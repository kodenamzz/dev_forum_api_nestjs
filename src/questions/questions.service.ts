import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  Question,
  QuestionDocument,
} from '../database/schemas/question.schema';
import { Model } from 'mongoose';
import { Tag } from '../database/schemas/tag.schema';
import { User } from '../database/schemas/user.schema';
import { Answer } from '../database/schemas/answer.schema';
import { Interaction } from '../database/schemas/Interaction.schema';
import { QuestionVoteDto } from './dto/question-vote-dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(Tag.name) private tagModel: Model<Tag>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Answer.name) private answerModel: Model<Answer>,
    @InjectModel(Interaction.name) private interactionModel: Model<Interaction>,
  ) {}

  async create(
    createQuestionDto: CreateQuestionDto,
  ): Promise<QuestionDocument> {
    const { tags, ...newQuestion } = createQuestionDto;

    try {
      const question = await this.questionModel.create(newQuestion);

      const tagDocuments = [];

      for (const tag of tags) {
        const existingTag = await this.tagModel.findOneAndUpdate(
          { name: { $regex: new RegExp(`^${tag}$`, 'i') } },
          { $setOnInsert: { name: tag }, $push: { questions: question._id } },
          { upsert: true, new: true },
        );

        tagDocuments.push(existingTag._id);
      }

      await this.questionModel.findByIdAndUpdate(question._id, {
        $push: { tags: { $each: tagDocuments } },
      });
      return question;
    } catch (error) {
      Logger.error('can not create question', error);
      throw error;
    }
  }

  async findAll(): Promise<Question[]> {
    return await this.questionModel
      .find({})
      .populate({ path: 'tags', model: this.tagModel })
      .populate({ path: 'author', model: this.userModel })
      .sort({ createdAt: -1 });
  }

  async findOne(questionId: string) {
    return await this.questionModel
      .findById(questionId)
      .populate({ path: 'tags', model: this.tagModel, select: '_id name' })
      .populate({
        path: 'author',
        model: this.userModel,
        select: '_id clerkId name picture',
      });
  }

  async upvoteQuestion(questionVoteDto: QuestionVoteDto) {
    const { questionId, userId, hasupVoted, hasdownVoted } = questionVoteDto;

    let updateQuery = {};

    if (hasupVoted) {
      updateQuery = { $pull: { upvotes: userId } };
    } else if (hasdownVoted) {
      updateQuery = {
        $pull: { downvotes: userId },
        $push: { upvotes: userId },
      };
    } else {
      updateQuery = { $addToSet: { upvotes: userId } };
    }

    const question = await this.questionModel.findByIdAndUpdate(
      questionId,
      updateQuery,
      { new: true },
    );

    if (!question) {
      throw new Error('Question not found');
    }

    // Increment author's reputation
    let reputationChange = 0;
    if (hasupVoted) {
      reputationChange = -10;
    } else if (hasdownVoted) {
      reputationChange = 12;
    } else {
      reputationChange = 10;
    }

    await this.userModel.findByIdAndUpdate(question.author, {
      $inc: { reputation: reputationChange },
    });

    return question;
  }

  async downvoteQuestion(questionVoteDto: QuestionVoteDto) {
    const { questionId, userId, hasupVoted, hasdownVoted } = questionVoteDto;

    let updateQuery = {};

    if (hasdownVoted) {
      updateQuery = { $pull: { downvotes: userId } };
    } else if (hasupVoted) {
      updateQuery = {
        $pull: { upvotes: userId },
        $push: { downvotes: userId },
      };
    } else {
      updateQuery = { $addToSet: { downvotes: userId } };
    }

    const question = await this.questionModel.findByIdAndUpdate(
      questionId,
      updateQuery,
      { new: true },
    );

    if (!question) {
      throw new Error('Question not found');
    }

    // Increment author's reputation
    let reputationChange = 0;
    if (hasdownVoted) {
      reputationChange = 2;
    } else if (hasupVoted) {
      reputationChange = -12;
    } else {
      reputationChange = -2;
    }

    await this.userModel.findByIdAndUpdate(question.author, {
      $inc: { reputation: reputationChange },
    });

    return question;
  }

  update(id: number, updateQuestionDto: UpdateQuestionDto) {
    return `This action updates a #${id} question`;
  }

  async remove(questionId: string) {
    try {
      await this.questionModel.deleteOne({ _id: questionId });
      await this.answerModel.deleteMany({ question: questionId });
      await this.interactionModel.deleteMany({ question: questionId });
      await this.tagModel.updateMany(
        { questions: questionId },
        { $pull: { questions: questionId } },
      );
    } catch (error) {
      Logger.error('can not remove question', error);
      throw error;
    }
  }
}
