import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { I18nContext, I18nService } from 'nestjs-i18n';

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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getHello', () => {
    it('should return localized Hello World message', () => {
      jest.spyOn(I18nContext, 'current').mockReturnValue({
        lang: 'en',
      } as I18nContext);

      expect(appService.getHello()).toBe('Hello World!');
      expect(tMock).toHaveBeenCalledWith('translation.HELLO', { lang: 'en' });
    });
  });
});
