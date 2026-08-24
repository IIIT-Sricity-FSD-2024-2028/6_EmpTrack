import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { CreatePlanDto, UpdatePlanDto, UpdatePlanStatusDto } from './dto/subscription.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Subscriptions')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('subscriptions')
@UseGuards(RolesGuard)
@Roles('SUPER_ADMIN')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  getAllPlans() {
    return this.subscriptionService.getAllPlans();
  }

  @Get(':id')
  getPlanById(@Param('id') id: string) {
    return this.subscriptionService.getPlanById(id);
  }

  @Get(':id/companies')
  getCompaniesForPlan(@Param('id') id: string) {
    return this.subscriptionService.getCompaniesForPlan(id);
  }

  @ApiOperation({ summary: 'Create a subscription plan' })
  @Post()
  createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionService.createPlan(dto);
  }

  @Patch(':id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.subscriptionService.updatePlan(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePlanStatusDto) {
    return this.subscriptionService.updateStatus(id, dto);
  }
}
