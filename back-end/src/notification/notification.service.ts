import { Injectable } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly dataStore: MockDataService) {}

  getNotificationsForUser(empId: string) {
    return this.dataStore.getNotifications().filter(n => n.employee_id === empId).reverse();
  }

  createNotification(createDto: CreateNotificationDto) {
    const newNotif = {
        id: 'NOTIF-' + Math.floor(1000 + Math.random() * 9000),
        employee_id: createDto.employee_id,
        message: createDto.message,
        type: createDto.type || 'info',
        link: createDto.link || null,
        timestamp: new Date().toISOString()
    };
    this.dataStore.getNotifications().push(newNotif);
    return newNotif;
  }
}

