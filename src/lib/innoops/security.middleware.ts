import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

// Simple in-memory sliding window rate limiter
const ipRequestHistory = new Map<string, number[]>();
const userRequestHistory = new Map<string, number[]>();

const LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Allow max 10 requests per minute

function isRateLimited(key: string, historyMap: Map<string, number[]>): boolean {
  const now = Date.now();
  const history = historyMap.get(key) || [];

  // Filter timestamps within the current window
  const activeHistory = history.filter((timestamp) => now - timestamp < LIMIT_WINDOW_MS);

  if (activeHistory.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  activeHistory.push(now);
  historyMap.set(key, activeHistory);
  return false;
}

export const rateLimiterMiddleware = createMiddleware().server(async ({ next, context }) => {
  const request = getRequest();

  // Try to find the client IP address
  const ipAddress =
    request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request?.headers?.get("x-real-ip") ||
    "unknown-ip";

  // 1. Check IP-based rate limit
  if (ipAddress !== "unknown-ip" && isRateLimited(ipAddress, ipRequestHistory)) {
    console.warn(`[Security] Rate limit exceeded for IP: ${ipAddress}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Too many requests. Please wait a minute before trying again.",
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // 2. Check User-based rate limit if user is authenticated (via requireSupabaseAuth context)
  const userId = (context as unknown as { userId?: string })?.userId;
  if (userId && isRateLimited(userId, userRequestHistory)) {
    console.warn(`[Security] Rate limit exceeded for User: ${userId}`);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Too many requests from this account. Please wait a minute.",
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return next();
});
