import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';

// Global so the app-wide AuthGuard and any service that must end sessions (password
// change, account deletion/deactivation) can inject SessionService.
@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionService],
  exports: [SessionService],
})
export class AuthModule {}
