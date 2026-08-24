import { Module } from '@nestjs/common';
import { TechnicalTeamController } from './technical-team.controller';
import { SupportTeamController } from './support-team.controller';
import { PlatformTeamOverviewController } from './platform-team-overview.controller';
import { PlatformTeamService } from './platform-team.service';

@Module({
  controllers: [TechnicalTeamController, SupportTeamController, PlatformTeamOverviewController],
  providers: [PlatformTeamService],
})
export class PlatformTeamModule {}
