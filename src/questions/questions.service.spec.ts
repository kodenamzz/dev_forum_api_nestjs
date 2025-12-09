import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { getModelToken } from '@nestjs/mongoose';
import { Question } from '../database/schemas/question.schema';
import { Tag } from '../database/schemas/tag.schema';
import { User } from '../database/schemas/user.schema';
import { Answer } from '../database/schemas/answer.schema';
import { Interaction } from '../database/schemas/Interaction.schema';

const mockQuestionModel = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
};

const mockTagModel = {
  findOneAndUpdate: jest.fn(),
  updateMany: jest.fn(),
};

const mockUserModel = {
  findByIdAndUpdate: jest.fn(),
};

const mockAnswerModel = {
  deleteMany: jest.fn(),
};

const mockInteractionModel = {
  deleteMany: jest.fn(),
};

describe('QuestionsService', () => {
  let service: QuestionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: getModelToken(Question.name),
          useValue: mockQuestionModel,
        },
        {
          provide: getModelToken(Tag.name),
          useValue: mockTagModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Answer.name),
          useValue: mockAnswerModel,
        },
        {
          provide: getModelToken(Interaction.name),
          useValue: mockInteractionModel,
        },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upvoteQuestion', () => {
    it('should upvote a question and update user reputation', async () => {
      const voteDto = {
        questionId: 'q1',
        userId: 'u1',
        hasupVoted: false,
        hasdownVoted: false,
      };
      const mockQuestion = { _id: 'q1', author: 'author1' };
      mockQuestionModel.findByIdAndUpdate.mockResolvedValue(mockQuestion);

      await service.upvoteQuestion(voteDto);

      expect(mockQuestionModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('author1', {
        $inc: { reputation: 10 },
      });
    });
  });

  describe('downvoteQuestion', () => {
    it('should downvote a question and update user reputation', async () => {
      const voteDto = {
        questionId: 'q1',
        userId: 'u1',
        hasupVoted: false,
        hasdownVoted: false,
      };
      const mockQuestion = { _id: 'q1', author: 'author1' };
      mockQuestionModel.findByIdAndUpdate.mockResolvedValue(mockQuestion);

      await service.downvoteQuestion(voteDto);

      expect(mockQuestionModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith('author1', {
        $inc: { reputation: -2 },
      });
    });
  });
});
