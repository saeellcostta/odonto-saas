import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "../../shared/const";
import * as jose from "jose";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Função para parsear cookies
function parseCookies(cookieHeader: string | undefined): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      cookies.set(name.trim(), rest.join('=').trim());
    }
  });
  
  return cookies;
}

// Função para verificar JWT próprio (login com email/senha)
async function verifyOwnJWT(token: string): Promise<{ userId: number; email: string; role: string; clinicId: number | null } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");
    const { payload } = await jose.jwtVerify(token, secret);
    
    // Verificar se é um JWT próprio (tem userId)
    if (payload.userId && payload.email) {
      return {
        userId: payload.userId as number,
        email: payload.email as string,
        role: payload.role as string,
        clinicId: payload.clinicId as number | null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const cookies = parseCookies(opts.req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    
    if (sessionCookie) {
      // APENAS verificar JWT próprio (login com email/senha)
      // NÃO usar OAuth do Manus como fallback
      const ownJwtPayload = await verifyOwnJWT(sessionCookie);
      
      if (ownJwtPayload) {
        // É um JWT próprio válido, buscar usuário pelo ID
        user = await db.getUserById(ownJwtPayload.userId) || null;
      }
      // Se não for JWT próprio válido, user permanece null
      // Isso força o redirecionamento para login
    }
  } catch (error) {
    // Authentication failed
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
