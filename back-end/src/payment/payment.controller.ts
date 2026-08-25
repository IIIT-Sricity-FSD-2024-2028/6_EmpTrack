import { Controller, Get, Post, Body, Query, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CompleteMockPaymentDto } from './dto/payment.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { resolvePlatformAdminScope } from '../common/utils/platform-scope.util';

@ApiTags('Payments')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('payments')
@UseGuards(RolesGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiOperation({ summary: "Company Admin's current subscription and billing status" })
  @Get('subscription')
  @Roles('COMPANY_ADMIN')
  getMySubscription(@Headers('x-actor-id') actorId: string) {
    return this.paymentService.getMySubscription(actorId);
  }

  @ApiOperation({ summary: "Company Admin's payment history" })
  @Get('history')
  @Roles('COMPANY_ADMIN')
  getMyPaymentHistory(@Headers('x-actor-id') actorId: string) {
    return this.paymentService.getMyPaymentHistory(actorId);
  }

  @ApiOperation({ summary: 'Complete a simulated (mock) subscription payment for the authenticated Company Admin' })
  @Post('mock/complete')
  @Roles('COMPANY_ADMIN')
  completeMockPayment(
    @Body() dto: CompleteMockPaymentDto,
    @Headers('x-actor-id') actorId: string,
    @Headers('x-actor-name') actorName: string,
  ) {
    return this.paymentService.completeMockPayment({ emp_id: actorId, emp_name: actorName || 'Company Admin' }, dto);
  }

  @ApiOperation({ summary: 'Payments for companies assigned to the authenticated Platform Admin' })
  @Get('platform-admin')
  @Roles('PLATFORM_ADMIN')
  getPlatformAdminPayments(
    @Headers('x-actor-id') actorId: string,
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.paymentService.getPlatformAdminPayments(resolvePlatformAdminScope('PLATFORM_ADMIN', actorId), { companyId, status, search });
  }

  @ApiOperation({ summary: 'Payment summary (assigned companies, paid/pending, revenue) for the authenticated Platform Admin' })
  @Get('platform-admin/summary')
  @Roles('PLATFORM_ADMIN')
  getPlatformAdminSummary(@Headers('x-actor-id') actorId: string) {
    return this.paymentService.getPlatformAdminSummary(resolvePlatformAdminScope('PLATFORM_ADMIN', actorId));
  }
}
