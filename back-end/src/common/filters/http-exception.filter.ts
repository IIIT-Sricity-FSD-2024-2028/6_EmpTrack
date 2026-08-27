import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { MulterError } from 'multer';
import { FileLoggerService } from '../logger/file-logger.service';

const MULTER_ERROR_MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: 'File too large.',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
  LIMIT_FILE_COUNT: 'Too many files uploaded.',
};

// Catches every exception (HttpException and anything unexpected) so every API
// response - success or failure - has the same shape, the client never sees a raw
// stack trace or internal error detail, and every error is written to the error log
// with the request id that ties it back to the access-log line for the same request.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: FileLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request?.requestId;
    const isProduction = process.env.NODE_ENV === 'production';

    const isMulterError = exception instanceof MulterError;
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : isMulterError
        ? HttpStatus.BAD_REQUEST
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[];
    if (isHttpException) {
      const body = exception.getResponse();
      message = typeof body === 'string' ? body : (body as any).message || exception.message;
    } else if (isMulterError) {
      message = MULTER_ERROR_MESSAGES[(exception as MulterError).code] || 'File upload failed.';
    } else {
      // Never leak the raw error message for unexpected (non-HttpException) failures -
      // it may contain internal detail (SQL, file paths, library internals).
      message = 'Internal server error';
    }

    const clientBody = {
      success: false,
      statusCode: status,
      message,
      path: request?.originalUrl,
      timestamp: new Date().toISOString(),
      requestId,
    };

    // Anything at or above 500 - or any exception that isn't a recognized HttpException
    // at all - is treated as unexpected and written to the error log with a stack trace
    // for debugging. Ordinary 4xx client errors (validation, not found, forbidden) stay
    // out of the error log so it isn't flooded with expected request rejections.
    const isUnexpected = (!isHttpException && !isMulterError) || status >= 500;
    if (isUnexpected) {
      const err = exception instanceof Error ? exception : undefined;
      this.logger.error(err?.message || 'Unhandled exception', {
        requestId,
        method: request?.method,
        url: request?.originalUrl,
        status,
        userId: (request?.headers?.['x-actor-id'] as string) || undefined,
        stack: err?.stack,
      });
    }

    if (isProduction && status >= 500) {
      clientBody.message = 'Internal server error';
    }

    response.status(status).json(clientBody);
  }
}
