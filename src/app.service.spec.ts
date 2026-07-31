import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { I18nContext } from 'nestjs-i18n';
import { AppService } from './app.service';

describe('AppService', () => {
  let appService: AppService;

  beforeEach(() => {
    appService = new AppService();
  });

  describe('getHello', () => {
    it('should return localized Hello World message', () => {
      const tMock = jest.fn().mockReturnValue('Hello World!');
      const i18nMock = {
        t: tMock,
      } as unknown as I18nContext;

      expect(appService.getHello(i18nMock)).toBe('Hello World!');
      expect(tMock).toHaveBeenCalledWith('translation.HELLO');
    });
  });
});
