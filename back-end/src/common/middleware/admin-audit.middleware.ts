import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FileLoggerService } from '../logger/file-logger.service';

// Route-scoped (see AppModule.configure) - only wired onto the administrative route
// groups (companies, employees, platform-admin management, tickets, escalations).
// Tags mutating calls into the application log with extra context beyond the generic
// access log line, independent of whichever service-level activity-log entry the
// handler itself writes. Left deliberately thin: this is a demonstration that
// module/router-level middleware (as opposed to a single global middleware) is doing
// real work on a real subset of routes, not a second audit-log system.
@Injectable()
export class AdminAuditMiddleware implements NestMiddleware {
  constructor(private readonly logger: FileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (req.method !== 'GET') {
      this.logger.debug('Admin-scoped route accessed', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        actorId: req.headers['x-actor-id'] || undefined,
        role: req.headers['role'] || undefined,
      });
    }
    next();
  }
}
