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
}
