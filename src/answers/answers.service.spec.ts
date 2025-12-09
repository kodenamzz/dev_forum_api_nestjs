import { Test, TestingModule } from '@nestjs/testing';
import { AnswersService } from './answers.service';
import { getModelToken } from '@nestjs/mongoose';
import { Answer } from '../database/schemas/answer.schema';
import { Question } from '../database/schemas/question.schema';
import { User } from '../database/schemas/user.schema';

const mockAnswerModel = {
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  countDocuments: jest.fn(),
};

const mockQuestionModel = {
  findByIdAndUpdate: jest.fn(),
};

const mockUserModel = {};

describe('AnswersService', () => {
  let service: AnswersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswersService,
        {
          provide: getModelToken(Answer.name),
          useValue: mockAnswerModel,
        },
        {
          provide: getModelToken(Question.name),
          useValue: mockQuestionModel,
        },
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<AnswersService>(AnswersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('remove', () => {
    it('should delete an answer and update the question', async () => {
      const mockAnswerId = 'answer123';
      const mockQuestionId = 'question123';
      const mockAnswer = { _id: mockAnswerId, question: mockQuestionId };

      mockAnswerModel.findOneAndDelete.mockResolvedValue(mockAnswer);
      mockQuestionModel.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.remove(mockAnswerId);

      expect(mockAnswerModel.findOneAndDelete).toHaveBeenCalledWith({ _id: mockAnswerId });
      expect(mockQuestionModel.findByIdAndUpdate).toHaveBeenCalledWith(mockQuestionId, {
        $pull: { answers: mockAnswerId },
      });
      expect(result).toEqual(mockAnswer);
    });

    it('should throw an error if answer not found', async () => {
       mockAnswerModel.findOneAndDelete.mockResolvedValue(null);
       await expect(service.remove('invalidId')).rejects.toThrow('Answer not found');
    });
  });

  describe('update', () => {
    it('should update an answer', async () => {
      const mockAnswerId = 'answer123';
      const updateDto = { content: 'Updated content' };
      const mockUpdatedAnswer = { _id: mockAnswerId, ...updateDto };

      mockAnswerModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedAnswer);

      const result = await service.update(mockAnswerId, updateDto);

      expect(mockAnswerModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockAnswerId,
        updateDto,
        { new: true },
      );
      expect(result).toEqual(mockUpdatedAnswer);
    });
  });
});
