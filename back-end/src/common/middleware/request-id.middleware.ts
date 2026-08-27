import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Accepts a caller-supplied X-Request-Id only if it looks safe to echo back and log
// verbatim (bounded length, restricted charset) - otherwise a fresh one is generated.
// This stops a client from injecting newlines/control characters into log files via
// the header.
const SAFE_REQUEST_ID = /^[a-zA-Z0-9._-]{1,100}$/;

declare module 'express' {
  interface Request {
    requestId: string;
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.headers['x-request-id'];
    const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
    const requestId = candidate && SAFE_REQUEST_ID.test(candidate) ? candidate : `req-${randomUUID()}`;

    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
