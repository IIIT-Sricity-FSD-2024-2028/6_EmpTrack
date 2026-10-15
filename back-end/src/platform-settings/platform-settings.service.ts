import { Injectable } from '@nestjs/common';
import { MockDataService } from '../data/mock-data.service';
import { UpdatePlatformSettingsDto } from './dto/platform-settings.dto';

@Injectable()
export class PlatformSettingsService {
  constructor(private readonly dataStore: MockDataService) {}

  get() {
    return this.dataStore.getPlatformSettings();
  }

  update(updateData: UpdatePlatformSettingsDto) {
    const settings = this.dataStore.getPlatformSettings();
    // DTO instances carry every declared field (undefined when not sent), so only
    // the values actually sent are merged - nested groups key by key.
    const sent = (obj: object) => Object.entries(obj).filter(([, value]) => value !== undefined);
    for (const [key, value] of sent(updateData || {})) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        settings[key] = { ...settings[key], ...Object.fromEntries(sent(value)) };
      } else {
        settings[key] = value;
      }
    }
    return settings;
  }
}
