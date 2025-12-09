import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { ClerkAuthGuard } from '../clerk-auth/clerk-auth.guard';
import { ConfigService } from '@nestjs/config';

const mockQuestionsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  upvoteQuestion: jest.fn(),
  downvoteQuestion: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('QuestionsController', () => {
  let controller: QuestionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuestionsController],
      providers: [
        {
          provide: QuestionsService,
          useValue: mockQuestionsService,
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

    controller = module.get<QuestionsController>(QuestionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
