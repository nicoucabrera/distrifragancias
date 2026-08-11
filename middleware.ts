import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ── Simple in-memory rate limiter ────────────────────────────
// Resets on cold start — acceptable for an internal tool.

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateEntry>();

function getRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

// Clean up old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }, 5 * 60 * 1000);
}

// ── Middleware ────────────────────────────────────────────────

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const clientIp = getClientIp(request);
  const method = request.method;

  // ── Read rate limit: 60 req/min per IP ───────────────────
  if (method === 'GET' || method === 'OPTIONS' || method === 'HEAD') {
    const { allowed, remaining } = getRateLimit(`read:${clientIp}`, 60, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Try again later.' },
        { status: 429 }
      );
    }
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return response;
  }

  // ── Write auth + rate limit: 20 req/min per IP ───────────
  if (!ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Admin password not configured' },
      { status: 503 }
    );
  }

  const { allowed, remaining } = getRateLimit(`write:${clientIp}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many write requests. Try again later.' },
      { status: 429 }
    );
  }

  // Check Basic Auth header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
    });
  }

  const decoded = atob(authHeader.slice(6));
  const [, password] = decoded.split(':');

  if (password !== ADMIN_PASSWORD) {
    return new NextResponse('Forbidden', {
      status: 403,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
    });
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
