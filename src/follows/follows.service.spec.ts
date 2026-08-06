import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';

import { FollowsDataAccess } from './follows-data-access';
import { FollowsService } from './follows.service';

describe('FollowsService', () => {
  let service: FollowsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowsService,
        {
          provide: FollowsDataAccess,
          useValue: {},
        },
        {
          provide: I18nService,
          useValue: {
            t: (key: string) => key,
          },
        },
      ],
    }).compile();

    service = module.get<FollowsService>(FollowsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
