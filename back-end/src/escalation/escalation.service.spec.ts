import { ForbiddenException } from '@nestjs/common';
import { EscalationService } from './escalation.service';

describe('EscalationService authorization', () => {
  const employees = [
    { emp_id: 'TL001', role: 'TEAMLEAD', companyId: 'C001' },
    { emp_id: 'EM001', role: 'EMPLOYEE', companyId: 'C001', manager_id: 'TL001' },
    { emp_id: 'EM002', role: 'EMPLOYEE', companyId: 'C001', manager_id: 'TL002' },
    { emp_id: 'HR001', role: 'HR', companyId: 'C001' },
  ];
  const escalations: any[] = [];
  const store = {
    getEmployees: jest.fn(() => employees),
    getEscalations: jest.fn(() => escalations),
  };
  const persistence = {
    seedEscalations: jest.fn(),
    saveEscalation: jest.fn(),
    createEscalation: jest.fn(),
    getEscalations: jest.fn(() => escalations),
  };
  const service = new EscalationService(store as any, persistence as any);
  const request = { reference_type: 'Workload', reference_id: 'EM001', escalated_to: 'HR', escalation_reason: 'Work is blocked by unresolved dependencies.' };

  it('allows a Team Lead to send a direct report escalation to the HR queue', () => {
    expect(service.createEscalation(request, 'TL001')).toMatchObject({ escalated_from: 'TL001', escalated_to: 'HR', reference_id: 'EM001', status: 'OPEN' });
  });

  it('rejects a Team Lead escalating another lead\'s employee', () => {
    expect(() => service.createEscalation({ ...request, reference_id: 'EM002' }, 'TL001')).toThrow(ForbiddenException);
  });

  it('rejects non Team Lead escalation requests', () => {
    expect(() => service.createEscalation(request, 'HR001')).toThrow(ForbiddenException);
  });
});
