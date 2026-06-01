import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

export class ChatController {
  constructor(chatService) {
    this.chatService = chatService;
  }

  // get chat history controller
  async getChatHistory(req, res, next) {
    try {
      const { userId } = req.params;
      if (!mongoose.isValidObjectId(userId)) {
        throw new AppError('Invalid user ID format', 400);
      }
      const result = await this.chatService.getChatHistory(
        req.user.id,
        userId,
        req.query,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // get user chats controller
  async getUserChats(req, res, next) {
    try {
      const result = await this.chatService.getUserChats(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
