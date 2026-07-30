import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { I18nContext } from 'nestjs-i18n';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return localized Hello World message', () => {
      const tMock = jest.fn().mockReturnValue('Hello World!');
      const i18nMock = {
        t: tMock,
      } as unknown as I18nContext;

      expect(appController.getHello(i18nMock)).toBe('Hello World!');
      expect(tMock).toHaveBeenCalledWith('translation.HELLO');
    });
  });
});
