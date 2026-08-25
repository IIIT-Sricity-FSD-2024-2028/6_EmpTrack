import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { RevenueService } from './revenue.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Revenue')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('revenue')
@UseGuards(RolesGuard)
@Roles('SUPER_ADMIN')
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get('summary')
  getSummary() {
    return this.revenueService.getSummary();
  }

  @Get('by-plan')
  getByPlan() {
    return this.revenueService.getByPlan();
  }

  @Get('by-company')
  getByCompany() {
    return this.revenueService.getByCompany();
  }

  @Get('by-platform-admin')
  getByPlatformAdmin() {
    return this.revenueService.getByPlatformAdmin();
  }

  @Get('transactions')
  getTransactions(
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
    @Query('platformAdminId') platformAdminId?: string,
    @Query('search') search?: string,
  ) {
    return this.revenueService.getTransactions(companyId, status, platformAdminId, search);
  }
}
