import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiHeader } from '@nestjs/swagger';
import { PlatformSettingsService } from './platform-settings.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Platform Settings')
@ApiHeader({ name: 'Role', required: true, description: 'Role-based access token' })
@Controller('platform-settings')
@UseGuards(RolesGuard)
@Roles('SUPER_ADMIN')
export class PlatformSettingsController {
  constructor(private readonly service: PlatformSettingsService) {}

  @Get()
  get() {
    return this.service.get();
  }

  @Patch()
  update(@Body() updateData: any) {
    return this.service.update(updateData);
  }
}
