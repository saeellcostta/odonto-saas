import "dotenv/config";
import express from "express";
import { createServer, type Server as HttpServer } from "http";
import net from "net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { stripe } from "../stripe/stripe";
import { ENV } from "./env";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function attachClient(app: express.Express, server: HttpServer) {
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
}

export async function createApp(options: { serveClient?: boolean; server?: HttpServer } = {}) {
  const app = express();
  
  // Stripe webhook - MUST be before express.json() to get raw body for signature verification
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!stripe) {
      console.log("[Stripe Webhook] Stripe não configurado");
      return res.status(400).json({ error: "Stripe não configurado" });
    }

    const sig = req.headers["stripe-signature"] as string;
    // Importar webhook secret alternativo
    const ALTERNATIVE_WEBHOOK_SECRET = "whsec_yeegso47xqfrPnOEZA1cl5ePIOkuZERN";
    const webhookSecret = ALTERNATIVE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.log("[Stripe Webhook] STRIPE_WEBHOOK_SECRET não configurado");
      return res.status(400).json({ error: "Webhook secret não configurado" });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.log(`[Stripe Webhook] Erro na verificação da assinatura: ${err.message}`);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle test events
    if (event.id.startsWith("evt_test_")) {
      console.log("[Stripe Webhook] Evento de teste detectado, retornando verificação");
      return res.json({ verified: true });
    }

    // Handle the event
    console.log(`[Stripe Webhook] Evento recebido: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        console.log(`[Stripe Webhook] Checkout completado: ${session.id}`);
        
        // Processar assinatura de clínica
        if (session.mode === "subscription" && session.metadata?.clinic_id) {
          try {
            const clinicId = parseInt(session.metadata.clinic_id);
            const planDbId = session.metadata.plan_db_id ? parseInt(session.metadata.plan_db_id) : null;
            
            console.log(`[Stripe Webhook] Processando clínica ${clinicId}, plano ${planDbId}`);
            
            // Preparar dados para atualização
            const updateData: any = {
              subscriptionStatus: "active",
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              lastPaymentAt: new Date(),
            };
            
            // Adicionar planId apenas se existir
            if (planDbId) {
              updateData.planId = planDbId;
            }
            
            // Buscar subscription do Stripe para obter datas (se existir)
            if (session.subscription) {
              try {
                const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                const currentPeriodEnd = (subscription as any).current_period_end;
                
                if (currentPeriodEnd && typeof currentPeriodEnd === 'number') {
                  updateData.nextPaymentAt = new Date(currentPeriodEnd * 1000);
                  console.log(`[Stripe Webhook] Próximo pagamento: ${updateData.nextPaymentAt.toISOString()}`);
                }
                
                const currentPeriodStart = (subscription as any).current_period_start;
                if (currentPeriodStart && typeof currentPeriodStart === 'number') {
                  updateData.subscriptionStartedAt = new Date(currentPeriodStart * 1000);
                }
              } catch (subError) {
                console.error(`[Stripe Webhook] Erro ao buscar subscription:`, subError);
              }
            }
            
            // Atualizar clínica no banco
            const db = await import("../db");
            await db.updateClinicSubscription(clinicId, updateData);
            
            console.log(`[Stripe Webhook] Clínica ${clinicId} ativada com sucesso!`);
          } catch (error) {
            console.error(`[Stripe Webhook] Erro ao ativar clínica:`, error);
            console.error(`[Stripe Webhook] Stack:`, (error as Error).stack);
          }
        }
        break;
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`[Stripe Webhook] Pagamento bem-sucedido: ${paymentIntent.id}`);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log(`[Stripe Webhook] Pagamento falhou: ${paymentIntent.id}`);
        break;
      }
      default:
        console.log(`[Stripe Webhook] Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Proxy endpoint para servir imagens do storage (contorna problema de CORS/acesso)
  app.get("/api/storage/image", async (req, res) => {
    const key = req.query.key as string;
    if (!key) {
      return res.status(400).json({ error: "Missing key parameter" });
    }
    
    try {
      const baseUrl = ENV.forgeApiUrl;
      const apiKey = ENV.forgeApiKey;
      
      if (!baseUrl || !apiKey) {
        return res.status(500).json({ error: "Storage not configured" });
      }
      
      // Primeiro, obter a URL de download assinada
      const downloadApiUrl = new URL("v1/storage/downloadUrl", baseUrl.endsWith("/") ? baseUrl : baseUrl + "/");
      downloadApiUrl.searchParams.set("path", key.replace(/^\/+/, ""));
      
      const urlResponse = await fetch(downloadApiUrl.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      
      if (!urlResponse.ok) {
        console.error('[Storage Proxy] Failed to get download URL:', urlResponse.status, urlResponse.statusText);
        return res.status(urlResponse.status).json({ error: "Failed to get download URL" });
      }
      
      const { url: signedUrl } = await urlResponse.json();
      
      // Agora buscar a imagem usando a URL assinada
      const imageResponse = await fetch(signedUrl);
      
      if (!imageResponse.ok) {
        console.error('[Storage Proxy] Failed to fetch image:', imageResponse.status, imageResponse.statusText);
        return res.status(imageResponse.status).json({ error: "Failed to fetch image" });
      }
      
      // Determinar o content-type baseado na extensão
      const ext = key.split('.').pop()?.toLowerCase();
      const contentTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
      };
      const contentType = contentTypes[ext || ''] || imageResponse.headers.get('content-type') || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 24h
      
      // Stream a resposta
      const buffer = await imageResponse.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error: any) {
      console.error('[Storage Proxy] Error:', error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (options.serveClient) {
    if (!options.server) {
      throw new Error("An HTTP server is required when serving the Vite/static client");
    }
    await attachClient(app, options.server);
  }

  return app;
}

async function startServer() {
  const app = await createApp({ serveClient: false });
  const server = createServer(app);
  await attachClient(app, server);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

const isEntrypoint = process.argv[1]
  ? fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  : false;

if (isEntrypoint) {
  startServer().catch(console.error);
}
