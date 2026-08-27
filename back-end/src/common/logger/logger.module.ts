import { Global, Module } from '@nestjs/common';
import { FileLoggerService } from './file-logger.service';

// Global so any module can inject FileLoggerService without re-declaring it as a provider.
@Global()
@Module({
  providers: [FileLoggerService],
  exports: [FileLoggerService],
})
export class LoggerModule {}
