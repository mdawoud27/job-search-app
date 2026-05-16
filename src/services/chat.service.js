import { MSG } from '../utils/messages.js';

export class ChatService {
  constructor(chatRepository, userRepository, companyRepository) {
    this.chatRepository = chatRepository;
    this.userRepository = userRepository;
    this.companyRepository = companyRepository;
  }

  async getChatHistory(currentUserId, otherUserId, query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const sort = query.sort === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;

    // Verify both users exist
    const currentUser = await this.userRepository.findById(currentUserId);
    const otherUser = await this.userRepository.findById(otherUserId);

    if (!currentUser || !otherUser) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    // Get chat history
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

  async validateMessageSend(senderId, receiverId) {
    // Get both users
    const sender = await this.userRepository.findById(senderId);
    const receiver = await this.userRepository.findById(receiverId);

    if (!sender || !receiver) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    // Check if chat already exists
    const existingChat = await this.chatRepository.getOrCreateChat(
      senderId,
      receiverId,
    );

    // If chat has no messages, only HR/Admin/Owner can initiate
    if (existingChat.messages.length === 0) {
      const isOwner = await this.companyRepository.isAnyCompanyOwner(senderId);
      if (sender.role !== 'HR' && sender.role !== 'Admin' && !isOwner) {
        throw new Error(MSG.JOB.NOT_AUTHORIZED('initiate chat'));
      }
    }

    return true;
  }

  async getUserChats(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(MSG.USER.NOT_FOUND);
    }

    const chats = await this.chatRepository.getUserChats(userId);

    // Format the chats
    const formattedChats = chats.map((chat) => {
      // Determine who the "other" user is
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
      message: 'Active chats retrieved successfully',
      data: formattedChats,
    };
  }
}
