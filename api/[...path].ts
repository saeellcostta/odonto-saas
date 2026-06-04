import type { Request, Response } from "express";
import { createApp } from "../server/_core/app";

let appPromise: ReturnType<typeof createApp> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = createApp({ serveClient: false });
  }
  return appPromise;
}

export default async function handler(req: Request, res: Response) {
  try {
    const app = await getApp();

    const originalUrl = req.url ?? "/";
    const queryIndex = originalUrl.indexOf("?");
    const pathOnly = queryIndex === -1 ? originalUrl : originalUrl.slice(0, queryIndex);
    const query = queryIndex === -1 ? "" : originalUrl.slice(queryIndex);

    if (!pathOnly.startsWith("/api")) {
      req.url = `/api${pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`}${query}`;
    }

    return app(req, res);
  } catch (error) {
    console.error("[api] handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Internal Server Error",
      });
    }
  }
}

export const config = {
  maxDuration: 30,
};
