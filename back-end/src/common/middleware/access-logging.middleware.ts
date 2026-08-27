import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FileLoggerService } from '../logger/file-logger.service';

// Records one access-log line per completed request: method, URL, request id,
// authenticated user/role (resolved from the same headers the rest of the app treats
// as its identity source), status, response time and client IP. Hooked to 'finish'
// rather than logged up-front so the real status code and timing are captured.
@Injectable()
export class AccessLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: FileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const responseTimeMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      const role = req.headers['role'];
      const userId = req.headers['x-actor-id'];

      this.logger.access({
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        responseTimeMs: Math.round(responseTimeMs * 100) / 100,
        ip: req.ip || req.socket.remoteAddress,
        userId: userId || undefined,
        role: role || undefined,
      });
    });

    next();
  }
}
