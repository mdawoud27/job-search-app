import { jest } from '@jest/globals';
import { ChatService } from '../../src/services/chat.service.js';
import { MSG } from '../../src/utils/messages.js';

let chatService;
let mockChatRepository;
let mockUserRepository;
let mockCompanyRepository;

beforeEach(() => {
  mockChatRepository = {
    getChatHistory: jest.fn(),
    getOrCreateChat: jest.fn(),
    getUserChats: jest.fn(),
  };

  mockUserRepository = {
    findById: jest.fn(),
  };

  mockCompanyRepository = {
    isAnyCompanyOwner: jest.fn(),
  };

  chatService = new ChatService(
    mockChatRepository,
    mockUserRepository,
    mockCompanyRepository,
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

/**
 * getChatHistory tests
 */
describe('getChatHistory', () => {
  it('should retrieve chat history successfully with default pagination', async () => {
    const currentUserId = 'user_123';
    const otherUserId = 'user_456';
    const currentUser = {
      _id: currentUserId,
      firstName: 'Test',
      lastName: 'User',
      role: 'User',
      profilePic: null,
    };
    const otherUser = {
      _id: otherUserId,
      firstName: 'Other',
      lastName: 'Person',
      role: 'HR',
      profilePic: { secure_url: 'pic.jpg' },
    };
    const messages = [{ text: 'Hello' }];

    mockUserRepository.findById
      .mockResolvedValueOnce(currentUser)
      .mockResolvedValueOnce(otherUser);
    mockChatRepository.getChatHistory.mockResolvedValue({
      messages,
      total: 1,
    });

    const result = await chatService.getChatHistory(currentUserId, otherUserId);

    expect(mockUserRepository.findById).toHaveBeenCalledWith(currentUserId);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(otherUserId);
    expect(mockChatRepository.getChatHistory).toHaveBeenCalledWith(
      currentUserId,
      otherUserId,
      0, // skip = (1-1)*50
      50, // default limit
      -1, // default sort desc
    );
    expect(result.message).toBe(MSG.CHAT.HISTORY_RETRIEVED);
    expect(result.data.messages).toBe(messages);
    expect(result.data.otherUser.name).toBe('Other Person');
    expect(result.data.otherUser.role).toBe('HR');
    expect(result.data.otherUser.profilePic).toBe('pic.jpg');
    expect(result.data.pagination).toEqual({
      total: 1,
      page: 1,
      limit: 50,
      pages: 1,
    });
  });

  it('should apply custom pagination and sort=asc', async () => {
    const currentUser = {
      _id: 'user_123',
      firstName: 'A',
      lastName: 'B',
      role: 'User',
      profilePic: null,
    };
    const otherUser = {
      _id: 'user_456',
      firstName: 'C',
      lastName: 'D',
      role: 'HR',
      profilePic: null,
    };

    mockUserRepository.findById
      .mockResolvedValueOnce(currentUser)
      .mockResolvedValueOnce(otherUser);
    mockChatRepository.getChatHistory.mockResolvedValue({
      messages: [],
      total: 0,
    });

    const result = await chatService.getChatHistory('user_123', 'user_456', {
      page: '2',
      limit: '10',
      sort: 'asc',
    });

    expect(mockChatRepository.getChatHistory).toHaveBeenCalledWith(
      'user_123',
      'user_456',
      10, // skip = (2-1)*10
      10,
      1, // sort asc
    );
    expect(result.data.pagination.page).toBe(2);
    expect(result.data.pagination.limit).toBe(10);
  });

  it('should throw NOT_FOUND when currentUser is not found', async () => {
    mockUserRepository.findById.mockResolvedValueOnce(null);

    await expect(
      chatService.getChatHistory('user_bad', 'user_456'),
    ).rejects.toThrow(MSG.USER.NOT_FOUND);
  });

  it('should throw NOT_FOUND when otherUser is not found', async () => {
    const currentUser = {
      _id: 'user_123',
      firstName: 'A',
      lastName: 'B',
      role: 'User',
      profilePic: null,
    };
    mockUserRepository.findById
      .mockResolvedValueOnce(currentUser)
      .mockResolvedValueOnce(null);

    await expect(
      chatService.getChatHistory('user_123', 'user_bad'),
    ).rejects.toThrow(MSG.USER.NOT_FOUND);
  });

  it('should handle otherUser with no profilePic', async () => {
    const currentUser = {
      _id: 'user_123',
      firstName: 'A',
      lastName: 'B',
      role: 'User',
      profilePic: null,
    };
    const otherUser = {
      _id: 'user_456',
      firstName: 'C',
      lastName: 'D',
      role: 'HR',
      profilePic: null,
    };

    mockUserRepository.findById
      .mockResolvedValueOnce(currentUser)
      .mockResolvedValueOnce(otherUser);
    mockChatRepository.getChatHistory.mockResolvedValue({
      messages: [],
      total: 0,
    });

    const result = await chatService.getChatHistory('user_123', 'user_456');

    expect(result.data.otherUser.profilePic).toBeUndefined();
  });
});

/**
 * validateMessageSend tests
 */
describe('validateMessageSend', () => {
  it('should allow HR sender to initiate a new chat', async () => {
    const sender = { _id: 'hr_123', role: 'HR' };
    const receiver = { _id: 'user_456', role: 'User' };
    const existingChat = { messages: [] };

    mockUserRepository.findById
      .mockResolvedValueOnce(sender)
      .mockResolvedValueOnce(receiver);
    mockChatRepository.getOrCreateChat.mockResolvedValue(existingChat);
    mockCompanyRepository.isAnyCompanyOwner.mockResolvedValue(false);

    const result = await chatService.validateMessageSend('hr_123', 'user_456');
    expect(result).toBe(true);
  });

  it('should allow any sender if chat already has messages', async () => {
    const sender = { _id: 'user_123', role: 'User' };
    const receiver = { _id: 'user_456', role: 'HR' };
    const existingChat = { messages: [{ text: 'Hi' }] };

    mockUserRepository.findById
      .mockResolvedValueOnce(sender)
      .mockResolvedValueOnce(receiver);
    mockChatRepository.getOrCreateChat.mockResolvedValue(existingChat);

    const result = await chatService.validateMessageSend(
      'user_123',
      'user_456',
    );
    expect(result).toBe(true);
    expect(mockCompanyRepository.isAnyCompanyOwner).not.toHaveBeenCalled();
  });

  it('should allow company owner to initiate a new chat', async () => {
    const sender = { _id: 'owner_123', role: 'User' };
    const receiver = { _id: 'user_456', role: 'User' };
    const existingChat = { messages: [] };

    mockUserRepository.findById
      .mockResolvedValueOnce(sender)
      .mockResolvedValueOnce(receiver);
    mockChatRepository.getOrCreateChat.mockResolvedValue(existingChat);
    mockCompanyRepository.isAnyCompanyOwner.mockResolvedValue(true);

    const result = await chatService.validateMessageSend(
      'owner_123',
      'user_456',
    );
    expect(result).toBe(true);
  });

  it('should throw when non-HR/non-owner tries to initiate new chat', async () => {
    const sender = { _id: 'user_123', role: 'User' };
    const receiver = { _id: 'user_456', role: 'User' };
    const existingChat = { messages: [] };

    mockUserRepository.findById
      .mockResolvedValueOnce(sender)
      .mockResolvedValueOnce(receiver);
    mockChatRepository.getOrCreateChat.mockResolvedValue(existingChat);
    mockCompanyRepository.isAnyCompanyOwner.mockResolvedValue(false);

    await expect(
      chatService.validateMessageSend('user_123', 'user_456'),
    ).rejects.toThrow(MSG.JOB.NOT_AUTHORIZED('initiate chat'));
  });

  it('should throw NOT_FOUND when sender is not found', async () => {
    mockUserRepository.findById.mockResolvedValueOnce(null);

    await expect(
      chatService.validateMessageSend('bad_id', 'user_456'),
    ).rejects.toThrow(MSG.USER.NOT_FOUND);
  });

  it('should throw NOT_FOUND when receiver is not found', async () => {
    const sender = { _id: 'user_123', role: 'User' };
    mockUserRepository.findById
      .mockResolvedValueOnce(sender)
      .mockResolvedValueOnce(null);

    await expect(
      chatService.validateMessageSend('user_123', 'bad_id'),
    ).rejects.toThrow(MSG.USER.NOT_FOUND);
  });

  it('should allow Admin to initiate a new chat', async () => {
    const sender = { _id: 'admin_123', role: 'Admin' };
    const receiver = { _id: 'user_456', role: 'User' };
    const existingChat = { messages: [] };

    mockUserRepository.findById
      .mockResolvedValueOnce(sender)
      .mockResolvedValueOnce(receiver);
    mockChatRepository.getOrCreateChat.mockResolvedValue(existingChat);
    mockCompanyRepository.isAnyCompanyOwner.mockResolvedValue(false);

    const result = await chatService.validateMessageSend(
      'admin_123',
      'user_456',
    );
    expect(result).toBe(true);
  });
});

/**
 * getUserChats tests
 */
describe('getUserChats', () => {
  it('should return formatted chats for sender perspective', async () => {
    const userId = 'user_123';
    const user = { _id: userId };
    const otherUser = {
      _id: 'user_456',
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'HR',
      profilePic: { secure_url: 'jane.jpg' },
    };
    const chat = {
      _id: 'chat_1',
      senderId: { _id: userId },
      receiverId: otherUser,
      messages: [{ message: 'Hi', senderId: userId, timestamp: new Date() }],
      updatedAt: new Date(),
    };

    mockUserRepository.findById.mockResolvedValue(user);
    mockChatRepository.getUserChats.mockResolvedValue([chat]);

    const result = await chatService.getUserChats(userId);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].chatId).toBe('chat_1');
    expect(result.data[0].otherUser.name).toBe('Jane Doe');
    expect(result.data[0].otherUser.profilePic).toBe('jane.jpg');
    expect(result.data[0].latestMessage.message).toBe('Hi');
  });

  it('should return formatted chats for receiver perspective', async () => {
    const userId = 'user_123';
    const senderUser = {
      _id: 'user_456',
      firstName: 'Bob',
      lastName: 'Smith',
      role: 'User',
      profilePic: null,
    };
    const chat = {
      _id: 'chat_2',
      senderId: senderUser,
      receiverId: { _id: userId },
      messages: [],
      updatedAt: new Date(),
    };

    mockUserRepository.findById.mockResolvedValue({ _id: userId });
    mockChatRepository.getUserChats.mockResolvedValue([chat]);

    const result = await chatService.getUserChats(userId);

    expect(result.data[0].otherUser.name).toBe('Bob Smith');
    expect(result.data[0].otherUser.profilePic).toBeNull();
    expect(result.data[0].latestMessage).toBeNull();
  });

  it('should return empty array when user has no chats', async () => {
    const userId = 'user_123';
    mockUserRepository.findById.mockResolvedValue({ _id: userId });
    mockChatRepository.getUserChats.mockResolvedValue([]);

    const result = await chatService.getUserChats(userId);

    expect(result.data).toHaveLength(0);
  });

  it('should throw NOT_FOUND when user does not exist', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    await expect(chatService.getUserChats('bad_id')).rejects.toThrow(
      MSG.USER.NOT_FOUND,
    );
  });
});
