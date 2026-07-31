import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { I18nContext } from 'nestjs-i18n';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let getHelloMock: jest.Mock;

  beforeEach(async () => {
    getHelloMock = jest.fn().mockReturnValue('Hello World!');

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHello: getHelloMock,
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return localized Hello World message', () => {
      const i18nMock = {} as I18nContext;

      expect(appController.getHello(i18nMock)).toBe('Hello World!');
      expect(getHelloMock).toHaveBeenCalledWith(i18nMock);
    });
  });
});
