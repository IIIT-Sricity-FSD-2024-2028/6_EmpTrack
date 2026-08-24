import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InvitationService } from './invitation.service';
import { AcceptInvitationDto } from './dto/invitation.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Invitations')
@Controller('invitations')
@UseGuards(RolesGuard)
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @ApiOperation({ summary: 'List all invitations (Super Admin)' })
  @Get()
  @Roles('SUPER_ADMIN')
  getAllInvitations() {
    return this.invitationService.getAllInvitations();
  }

  @ApiOperation({ summary: 'Validate an invitation token - public, used by the invitation acceptance page' })
  @Get(':token')
  getByToken(@Param('token') token: string) {
    const invitation = this.invitationService.getByToken(token);
    return {
      name: invitation.name,
      email: invitation.email,
      role: invitation.role,
      company_id: invitation.company_id,
      expires_at: invitation.expires_at,
    };
  }

  @ApiOperation({ summary: 'Accept an invitation and set a password - public' })
  @Post(':token/accept')
  acceptInvitation(@Param('token') token: string, @Body() dto: AcceptInvitationDto) {
    return this.invitationService.acceptInvitation(token, dto.password);
  }
}
