import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { InvitationModule } from '../invitation/invitation.module';

@Module({
  imports: [InvitationModule],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}
