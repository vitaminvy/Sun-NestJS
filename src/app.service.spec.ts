import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { I18nService } from 'nestjs-i18n';

import { AppService } from './app.service';

describe('AppService', () => {
  let appService: AppService;
  let tMock: jest.Mock;

  beforeEach(() => {
    tMock = jest.fn().mockReturnValue('Hello World!');
    appService = new AppService({
      t: tMock,
    } as unknown as I18nService);
  });

  describe('getHello', () => {
    it('should return localized Hello World message', () => {
      expect(appService.getHello()).toBe('Hello World!');
      expect(tMock).toHaveBeenCalledWith('translation.HELLO');
    });
  });
});
