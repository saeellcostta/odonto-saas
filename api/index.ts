import type { Request, Response } from "express";
import { createApp } from "../server/_core/index";

const appPromise = createApp({ serveClient: false });

/**
 * Vercel serverless entry. Rewrites send /api/* here; normalize req.url so
 * Express routes mounted at /api/trpc, /api/oauth, etc. still match.
 */
export default async function handler(req: Request, res: Response) {
  const app = await appPromise;

  const originalUrl = req.url ?? "/";
  const queryIndex = originalUrl.indexOf("?");
  const pathOnly = queryIndex === -1 ? originalUrl : originalUrl.slice(0, queryIndex);
  const query = queryIndex === -1 ? "" : originalUrl.slice(queryIndex);

  if (!pathOnly.startsWith("/api")) {
    req.url = `/api${pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`}${query}`;
  }

  return app(req, res);
}
