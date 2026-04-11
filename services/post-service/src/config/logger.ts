import { Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  base: { service: 'post-service' },
});

@Injectable()
export class AppLogger implements LoggerService {
  log(message: string, context?: string) {
    pinoLogger.info({ context }, message);
  }
  error(message: string, trace?: string, context?: string) {
    pinoLogger.error({ context, trace }, message);
  }
  warn(message: string, context?: string) {
    pinoLogger.warn({ context }, message);
  }
  debug(message: string, context?: string) {
    pinoLogger.debug({ context }, message);
  }
}

export { pinoLogger as logger };
