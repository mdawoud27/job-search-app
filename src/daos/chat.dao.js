import { Chat } from '../models/Chat.js';

export class ChatDAO {
  async getChatHistory(userId1, userId2, skip = 0, limit = 50, sort = 1) {
    const chat = await Chat.findChat(userId1, userId2).populate({
      path: 'messages.senderId',
      select: 'firstName lastName email profilePic',
    });

    if (!chat) {
      return { messages: [], total: 0 };
    }

    // Get total count
    const total = chat.messages.length;

    // Apply pagination and sorting
    const messages = chat.messages
      .sort((a, b) =>
        sort === 1 ? a.timestamp - b.timestamp : b.timestamp - a.timestamp,
      )
      .slice(skip, skip + limit);

    return { messages, total, chatId: chat._id };
  }

  async getOrCreateChat(userId1, userId2) {
    let chat = await Chat.findChat(userId1, userId2);

    if (!chat) {
      chat = await Chat.create({
        senderId: userId1,
        receiverId: userId2,
        messages: [],
      });
    }

    return chat;
  }

  async addMessage(userId1, userId2, message, senderId) {
    const chat = await this.getOrCreateChat(userId1, userId2);
    await chat.addMessage(message, senderId);

    // Return the newly added message with populated sender
    // We need to re-fetch or manually populate because addMessage just pushes to array
    const updatedChat = await Chat.findById(chat._id).populate({
      path: 'messages.senderId',
      select: 'firstName lastName email profilePic',
    });

    const newMessage = updatedChat.messages[updatedChat.messages.length - 1];
    return {
      chatId: chat._id,
      message: newMessage,
    };
  }

  async getChatById(chatId) {
    return Chat.findById(chatId)
      .populate('senderId', 'firstName lastName email role')
      .populate('receiverId', 'firstName lastName email role');
  }
}
