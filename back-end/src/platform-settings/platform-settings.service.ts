import { Injectable } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';

@Injectable()
export class PlatformSettingsService {
  constructor(private readonly dataStore: MockDataService) {}

  get() {
    return this.dataStore.getPlatformSettings();
  }

  update(updateData: any) {
    const settings = this.dataStore.getPlatformSettings();
    Object.keys(updateData || {}).forEach((key) => {
      if (updateData[key] === undefined) return;
      const isPlainObject = typeof updateData[key] === 'object' && updateData[key] !== null && !Array.isArray(updateData[key]);
      if (isPlainObject && typeof settings[key] === 'object') {
        settings[key] = { ...settings[key], ...updateData[key] };
      } else {
        settings[key] = updateData[key];
      }
    });
    return settings;
  }
}
