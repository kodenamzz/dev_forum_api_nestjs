import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../database/schemas/user.schema';
import { Question } from '../database/schemas/question.schema';
import { Answer } from '../database/schemas/answer.schema';

const mockUserModel = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  findByIdAndDelete: jest.fn(),
  countDocuments: jest.fn(),
};

const mockQuestionModel = {
  deleteMany: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

const mockAnswerModel = {
  find: jest.fn(),
  deleteMany: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Question.name),
          useValue: mockQuestionModel,
        },
        {
          provide: getModelToken(Answer.name),
          useValue: mockAnswerModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteUser', () => {
    it('should delete user and related data', async () => {
      const clerkId = 'clerk123';
      const mockUser = { _id: 'user123', clerkId };
      const mockAnswers = [{ _id: 'a1', question: 'q1' }];

      mockUserModel.findOneAndDelete.mockResolvedValue(mockUser);
      mockAnswerModel.find.mockResolvedValue(mockAnswers);
      mockUserModel.findByIdAndDelete.mockResolvedValue(mockUser);

      await service.deleteUser(clerkId);

      expect(mockUserModel.findOneAndDelete).toHaveBeenCalledWith({ clerkId });
      expect(mockQuestionModel.deleteMany).toHaveBeenCalledWith({ author: mockUser._id });
      expect(mockAnswerModel.find).toHaveBeenCalledWith({ author: mockUser._id });
      expect(mockQuestionModel.findByIdAndUpdate).toHaveBeenCalledWith('q1', {
        $pull: { answers: 'a1' },
      });
      expect(mockAnswerModel.deleteMany).toHaveBeenCalledWith({ author: mockUser._id });
      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(mockUser._id);
    });
  });
});
