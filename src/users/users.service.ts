import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../database/schemas/user.schema';
import { FilterQuery, Model } from 'mongoose';
import { Question } from '../database/schemas/question.schema';
import { GetAllUsersDto } from './dto/get-all-users.dto';
import { Answer } from '../database/schemas/answer.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    try {
      const newUser = await this.userModel.create(createUserDto);
      return newUser;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async findAll(getAllUsersDto: GetAllUsersDto) {
    try {
      const { searchQuery, filter, page = 1, pageSize = 10 } = getAllUsersDto;
      const skipAmount = (page - 1) * pageSize;

      // prepare query

      const query: FilterQuery<typeof User> = {};

      if (searchQuery) {
        const escapedSearchQuery = searchQuery.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        );
        query.$or = [{ name: { $regex: new RegExp(escapedSearchQuery, 'i') } }];
      }

      let sortOptions = {};

      switch (filter) {
        case 'recent':
          sortOptions = { joinedAt: -1 };
          break;
        case 'name':
          sortOptions = { name: 1 };
          break;
        case 'old':
          sortOptions = { joinedAt: 1 };
          break;

        default:
          break;
      }

      const totalTags = await this.userModel.countDocuments(query);
      const users = await this.userModel
        .find(query)
        .sort(sortOptions)
        .skip(skipAmount)
        .limit(pageSize);

      const isNext = totalTags > skipAmount + users.length;
      return { users, isNext };
    } catch (error) {
      Logger.error('something went wrong with get users', error);
      throw new HttpException(
        'Something went wrong please try again later',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.userModel.findOne({
        clerkId: id,
      });
      return user;
    } catch (error) {
      Logger.error('something went wrong with get user', error);
      throw new HttpException(
        'Something went wrong please try again later',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUser(updateUserDto: UpdateUserDto): Promise<UserDocument> {
    try {
      const { clerkId } = updateUserDto;
      const updatedUser = await this.userModel.findOneAndUpdate(
        { clerkId },
        updateUserDto,
        {
          new: true,
        },
      );
      return updatedUser;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async deleteUser(clerkId: string): Promise<UserDocument> {
    try {
      const user = await this.userModel.findOneAndDelete({ clerkId });

      if (!user) {
        throw new Error('User not found');
      }

      // Delete user from database
      // and questions, answers, comments, etc.

      // get user question ids
      // const userQuestionIds = await Question.find({ author: user._id}).distinct('_id');

      // delete user questions
      await this.questionModel.deleteMany({ author: user._id });

      // delete user answers
      // We need to also update the questions to remove these answers
      const userAnswers = await this.answerModel.find({ author: user._id });
      for (const answer of userAnswers) {
        await this.questionModel.findByIdAndUpdate(answer.question, {
          $pull: { answers: answer._id },
        });
      }
      await this.answerModel.deleteMany({ author: user._id });

      const deletedUser = await this.userModel.findByIdAndDelete(user._id);

      return deletedUser;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
