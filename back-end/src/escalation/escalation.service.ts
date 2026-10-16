import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { WorkflowPersistenceService } from '../data/workflow-persistence.service';
import { CreateEscalationDto } from './dto/escalation.dto';
import { accessibleEmployeeIds, assertCanAccessEmployee, getActor, todayKey } from '../common/utils/access-scope.util';

@Injectable()
export class EscalationService {
  constructor(private readonly dataStore: MockDataService, private readonly persistence: WorkflowPersistenceService) {
    this.persistence.seedEscalations(this.dataStore.getEscalations());
  }

  // Only escalations raised by someone in the caller's own company.
  getAllEscalations(actorId: string) {
    const visible = accessibleEmployeeIds(this.dataStore, actorId);
    return this.persistence.getEscalations().filter(e => visible.has(e.escalated_from));
  }

  getEscalationsForActor(actorId: string) {
    return this.persistence.getEscalations().filter((escalation) => escalation.escalated_from === actorId);
  }

  createEscalation(createDto: CreateEscalationDto, actorId: string) {
    const actor = getActor(this.dataStore, actorId);
    if (actor.role !== 'TEAMLEAD') {
      throw new ForbiddenException('Only Team Leads can raise escalations to HR.');
    }
    if (createDto.escalated_from && createDto.escalated_from !== actorId) {
      throw new ForbiddenException('You can only raise escalations as yourself.');
    }
    if (createDto.escalated_to !== 'HR' && createDto.escalated_to !== 'COMPANY_HR') {
      throw new BadRequestException('Escalations must be directed to the company HR queue.');
    }
    const target = this.dataStore.getEmployees().find((e) => e.emp_id === createDto.reference_id);
    if (!target || target.companyId !== actor.companyId || (target.emp_id !== actorId && target.manager_id !== actorId)) {
      throw new ForbiddenException('You may only escalate a record belonging to an employee in your team.');
    }
    if (createDto.issue_id) {
      const issue = this.persistence.getIssue(createDto.issue_id);
      if (!issue || issue.emp_id !== target.emp_id) {
        throw new ForbiddenException('The issue must belong to the employee referenced by this escalation.');
      }
      if (issue.status === 'Resolved') throw new ConflictException('Resolved issues cannot be escalated.');
    }
    const newEsc = {
        escalation_id: 'ESC-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
        ...createDto,
        escalated_from: actorId,
        escalation_date: todayKey(),
        status: "OPEN"
    };
    this.persistence.createEscalation(newEsc);
    this.dataStore.getEscalations().push(newEsc);
    return newEsc;
  }

  private findScoped(id: string, actorId: string) {
    const esc = this.persistence.getEscalations().find(e => e.escalation_id === id);
    if (!esc) throw new NotFoundException('Escalation not found');
    assertCanAccessEmployee(this.dataStore, actorId, esc.escalated_from);
    return esc;
  }

  rejectEscalation(id: string, actorId: string) {
    const esc = this.findScoped(id, actorId);
    if (esc.escalated_from === actorId) {
      throw new ForbiddenException('You cannot reject your own escalation.');
    }
    if (esc.status !== 'OPEN') {
      throw new ConflictException(`This escalation is already ${String(esc.status).toLowerCase()}.`);
    }
    esc.status = 'REJECTED';
    this.persistence.saveEscalation(esc);
    return { success: true, message: `Escalation ${id} has been rejected.` };
  }

  generateEscalationReport(id: string, actorId: string) {
    this.findScoped(id, actorId);
    return { success: true, message: `Report generated successfully for escalation ${id}.` };
  }
}
