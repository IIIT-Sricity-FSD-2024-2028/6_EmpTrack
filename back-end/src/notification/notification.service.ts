import { Injectable, ForbiddenException } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateNotificationDto } from './dto/notification.dto';
import { assertCanAccessEmployee, getActor } from '../common/utils/access-scope.util';

const NOTIFIER_ROLES = ['TEAMLEAD', 'HR', 'COMPANY_ADMIN'];

@Injectable()
export class NotificationService {
  constructor(private readonly dataStore: MockDataService) {}

  // Notifications are personal - only ever your own.
  getNotificationsForUser(empId: string, actorId: string) {
    if (empId !== actorId) {
      throw new ForbiddenException('You can only read your own notifications.');
    }
    return this.dataStore.getNotifications().filter(n => n.employee_id === empId).reverse();
  }

  // POST /notifications - a Team Lead / HR / Company Admin messaging someone they manage.
  sendAsActor(createDto: CreateNotificationDto, actorId: string) {
    const actor = getActor(this.dataStore, actorId);
    if (!NOTIFIER_ROLES.includes(actor.role)) {
      throw new ForbiddenException('Only a Team Lead, HR or Company Admin can send notifications.');
    }
    // Team Lead -> own direct reports, HR/Company Admin -> own company.
    assertCanAccessEmployee(this.dataStore, actorId, createDto.employee_id);
    return this.createNotification({ ...createDto }, actor.emp_id);
  }

  // Internal, trusted - also used by the platform ticket workflows for system
  // notifications. Not reachable from a client directly.
  createNotification(createDto: CreateNotificationDto, sentBy: string | null = null) {
    const newNotif = {
        id: 'NOTIF-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        employee_id: createDto.employee_id,
        message: createDto.message,
        type: createDto.type || 'info',
        link: createDto.link || null,
        sent_by: sentBy,
        timestamp: new Date().toISOString()
    };
    this.dataStore.getNotifications().push(newNotif);
    return newNotif;
  }
}
