import { Test, TestingModule } from '@nestjs/testing';
import { AnswersController } from './answers.controller';
import { AnswersService } from './answers.service';
import { ClerkAuthGuard } from '../clerk-auth/clerk-auth.guard';
import { ConfigService } from '@nestjs/config';

const mockAnswersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  upvoteAnswer: jest.fn(),
  downvoteAnswer: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('AnswersController', () => {
  let controller: AnswersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnswersController],
      providers: [
        {
          provide: AnswersService,
          useValue: mockAnswersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AnswersController>(AnswersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
