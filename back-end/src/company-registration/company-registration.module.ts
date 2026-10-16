import { Module } from '@nestjs/common';
import { CompanyRegistrationController, RegistrationReviewController } from './company-registration.controller';
import { CompanyRegistrationService } from './company-registration.service';

@Module({
  controllers: [CompanyRegistrationController, RegistrationReviewController],
  providers: [CompanyRegistrationService],
})
export class CompanyRegistrationModule {}
