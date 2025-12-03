export class ChatService {
  constructor(chatRepository, userRepository) {
    this.chatRepository = chatRepository;
    this.userRepository = userRepository;
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
      throw new Error('User not found');
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
      message: 'Chat history retrieved successfully',
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
      throw new Error('User not found');
    }

    // Check if chat already exists
    const existingChat = await this.chatRepository.getOrCreateChat(
      senderId,
      receiverId,
    );

    // If chat has no messages, only HR/Admin can initiate
    if (existingChat.messages.length === 0) {
      if (sender.role !== 'HR' && sender.role !== 'Admin') {
        throw new Error(
          'Only HR or Company Owner can initiate conversations with users',
        );
      }
    }

    return true;
  }
}
