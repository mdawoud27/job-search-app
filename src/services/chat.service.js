import { AppError } from '../utils/AppError.js';
import { MSG } from '../utils/messages.js';

export class ChatService {
  constructor(chatRepository, userRepository, companyRepository) {
    this.chatRepository = chatRepository;
    this.userRepository = userRepository;
    this.companyRepository = companyRepository;
  }

  async sendMessage(senderId, receiverId, message) {
    const [sender, receiver] = await Promise.all([
      this.userRepository.findById(senderId),
      this.userRepository.findById(receiverId),
    ]);

    if (!receiver) {
      throw new AppError(MSG.CHAT.RECEIVER_NOT_FOUND, 404);
    }
    if (!sender) {
      throw new AppError(MSG.USER.NOT_FOUND, 404);
    }

    const existingChat = await this.chatRepository.findChatOnly(
      senderId,
      receiverId,
    );

    if (!existingChat || existingChat.messages.length === 0) {
      const isOwner = await this.companyRepository.isAnyCompanyOwner(senderId);
      if (sender.role !== 'HR' && sender.role !== 'Admin' && !isOwner) {
        throw new AppError(MSG.JOB.NOT_AUTHORIZED('initiate chat'), 403);
      }
    }

    const result = await this.chatRepository.addMessage(
      senderId,
      receiverId,
      message,
      senderId,
    );

    return {
      forReceiver: {
        senderId,
        senderName: `${sender.firstName} ${sender.lastName}`,
        senderProfilePic: sender.profilePic?.secure_url,
        message: result.message.message,
        timestamp: result.message.timestamp,
      },
      forSender: {
        receiverId,
        message: result.message.message,
        timestamp: result.message.timestamp,
      },
    };
  }

  async getChatHistory(currentUserId, otherUserId, query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const sort = query.sort === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    const currentUser = await this.userRepository.findById(currentUserId);
    const otherUser = await this.userRepository.findById(otherUserId);

    if (!currentUser || !otherUser) {
      throw new AppError(MSG.USER.NOT_FOUND, 404);
    }

    const { messages, total } = await this.chatRepository.getChatHistory(
      currentUserId,
      otherUserId,
      skip,
      limit,
      sort,
    );

    return {
      message: MSG.CHAT.HISTORY_RETRIEVED,
      data: {
        messages,
        otherUser: {
          id: otherUser._id,
          name: `${otherUser.firstName} ${otherUser.lastName}`,
          role: otherUser.role,
          profilePic: otherUser.profilePic?.secure_url,
        },
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    };
  }

  async getUserChats(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(MSG.USER.NOT_FOUND, 404);
    }

    const chats = await this.chatRepository.getUserChats(userId);

    const formattedChats = chats.map((chat) => {
      const isSender = chat.senderId._id.toString() === userId.toString();
      const otherUser = isSender ? chat.receiverId : chat.senderId;
      const latestMessage = chat.messages[chat.messages.length - 1];

      return {
        chatId: chat._id,
        otherUser: {
          id: otherUser._id,
          name: `${otherUser.firstName} ${otherUser.lastName}`,
          role: otherUser.role,
          profilePic: otherUser.profilePic?.secure_url || null,
        },
        latestMessage: latestMessage
          ? {
              message: latestMessage.message,
              senderId: latestMessage.senderId,
              timestamp: latestMessage.timestamp,
            }
          : null,
        updatedAt: chat.updatedAt,
      };
    });

    return {
      message: MSG.CHAT.CHATS_RETRIEVED,
      data: formattedChats,
    };
  }
}
