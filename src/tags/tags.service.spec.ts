import { Test, TestingModule } from '@nestjs/testing';
import { TagsService } from './tags.service';
import { getModelToken } from '@nestjs/mongoose';
import { Tag } from '../database/schemas/tag.schema';

const mockTagModel = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  countDocuments: jest.fn(),
};

describe('TagsService', () => {
  let service: TagsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        {
          provide: getModelToken(Tag.name),
          useValue: mockTagModel,
        },
      ],
    }).compile();

    service = module.get<TagsService>(TagsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
