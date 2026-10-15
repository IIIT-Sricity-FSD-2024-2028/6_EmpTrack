import { Controller, Get, Post, Body, Headers, HttpCode, HttpStatus, Ip, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

// Deliberately has no RolesGuard: this is the endpoint that determines the caller's
// role in the first place. Login is @Public(); logout needs the session it ends.
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Authenticate by email/password and resolve the account role (platform-level or company-level)' })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Stricter than the global 100/min baseline - login is the natural target for
  // credential-stuffing/brute-force, so it gets its own tighter throttle.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() dto: LoginDto, @Ip() ip: string, @Req() req: Request) {
    return this.authService.login(dto, ip, req.requestId);
  }

  @ApiOperation({ summary: 'Return the account behind the current session token (401 if missing, expired or revoked)' })
  @Get('me')
  me(@Headers('x-actor-id') actorId: string) {
    return this.authService.me(actorId);
  }

  @ApiOperation({ summary: 'End the current login session and record a logout event' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
    @Headers('role') role: string,
    @Req() req: Request,
  ) {
    return this.authService.logout(actorId, actorName, role, req.sessionToken);
  }
}
