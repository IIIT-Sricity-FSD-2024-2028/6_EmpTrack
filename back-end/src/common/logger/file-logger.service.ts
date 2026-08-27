import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export type LogChannel = 'access' | 'application' | 'errors';

// Field names that must never reach a log line, no matter which channel or who calls in.
const REDACTED_KEYS = [
  'password', 'newpassword', 'currentpassword', 'confirmpassword',
  'token', 'accesstoken', 'refreshtoken', 'authorization',
  'apikey', 'api_key', 'secret', 'jwtsecret', 'jwt_secret',
  'databaseurl', 'database_url', 'dbpassword', 'db_password',
];

// Writes structured log lines to date-rotated files under LOG_DIR (env-configurable,
// defaults to <cwd>/logs), split into access/application/errors so each concern stays
// independently greppable and none of them grow without bound in a single file.
// Failures to write to disk are swallowed (falling back to console) so a full disk or a
// permissions problem never blocks the request that triggered the log line.
@Injectable()
export class FileLoggerService {
  private readonly baseDir: string;
  private readonly streams = new Map<string, fs.WriteStream>();

  constructor() {
    this.baseDir = path.resolve(process.env.LOG_DIR || path.join(process.cwd(), 'logs'));
    for (const sub of ['access', 'application', 'errors']) {
      fs.mkdirSync(path.join(this.baseDir, sub), { recursive: true });
    }
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  private streamFor(channel: LogChannel): fs.WriteStream {
    const key = `${channel}-${this.today()}`;
    let stream = this.streams.get(key);
    if (!stream) {
      // Close out any stream left over from a previous day so file handles don't leak
      // across midnight rotation.
      for (const [existingKey, existingStream] of this.streams) {
        if (existingKey.startsWith(`${channel}-`) && existingKey !== key) {
          existingStream.end();
          this.streams.delete(existingKey);
        }
      }
      const filePath = path.join(this.baseDir, channel, `${channel}-${this.today()}.log`);
      stream = fs.createWriteStream(filePath, { flags: 'a' });
      stream.on('error', (err) => {
        console.error(`[FileLoggerService] failed writing to ${filePath}:`, err.message);
      });
      this.streams.set(key, stream);
    }
    return stream;
  }

  // Deep-redacts any key matching REDACTED_KEYS (case-insensitive) before it can be
  // serialized into a log line.
  private redact(value: any, depth = 0): any {
    if (value === null || value === undefined || depth > 4) return value;
    if (Array.isArray(value)) return value.map((v) => this.redact(v, depth + 1));
    if (typeof value === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = REDACTED_KEYS.includes(k.toLowerCase()) ? '[REDACTED]' : this.redact(v, depth + 1);
      }
      return out;
    }
    return value;
  }

  private write(channel: LogChannel, line: string) {
    try {
      this.streamFor(channel).write(line + '\n');
    } catch (err) {
      console.error(`[FileLoggerService] write failure on ${channel}:`, err);
    }
  }

  log(channel: LogChannel, level: LogLevel, message: string, meta: Record<string, any> = {}) {
    const safeMeta = this.redact(meta);
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...safeMeta,
    };
    this.write(channel, JSON.stringify(entry));
    if (level === LogLevel.ERROR) console.error(`[${channel}] ${message}`, safeMeta);
    else if (level === LogLevel.WARN) console.warn(`[${channel}] ${message}`, safeMeta);
  }

  access(meta: Record<string, any>) {
    this.log('access', LogLevel.INFO, 'HTTP request', meta);
  }

  info(message: string, meta: Record<string, any> = {}) {
    this.log('application', LogLevel.INFO, message, meta);
  }

  debug(message: string, meta: Record<string, any> = {}) {
    this.log('application', LogLevel.DEBUG, message, meta);
  }

  warn(message: string, meta: Record<string, any> = {}) {
    this.log('application', LogLevel.WARN, message, meta);
  }

  error(message: string, meta: Record<string, any> = {}) {
    this.log('errors', LogLevel.ERROR, message, meta);
  }
}
