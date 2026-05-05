import { Injectable } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateEscalationDto } from './dto/escalation.dto';

@Injectable()
export class EscalationService {
  constructor(private readonly dataStore: MockDataService) {}

  getAllEscalations() {
    return this.dataStore.getEscalations();
  }

  createEscalation(createDto: CreateEscalationDto) {
    const newEsc = {
        escalation_id: 'ESC-' + Math.floor(1000 + Math.random() * 9000),
        ...createDto,
        escalation_date: new Date().toISOString().split('T')[0],
        status: "OPEN"
    };
    this.dataStore.getEscalations().push(newEsc);
    return newEsc;
  }

  rejectEscalation(id: string) {
    const escalations = this.dataStore.getEscalations();
    const esc = escalations.find(e => e.escalation_id === id);
    if (esc) {
        esc.status = 'REJECTED';
    }
    return { success: true, message: `Escalation ${id} has been rejected.` };
  }

  generateEscalationReport(id: string) {
    return { success: true, message: `Report generated successfully for escalation ${id}.` };
  }
}

