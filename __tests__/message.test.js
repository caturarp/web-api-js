const {messageFetcher, messageFinder, messageSender} = require('../core/core.js');

const mockChat = {
    id: {
        server: 'c.us',
        user: '554199999999',
        _serialized: '554199999999@c.us'
    },
    archived: false,
    isGroup: false,
    isReadOnly: false,
    isMuted: false,
    muteExpiration: 0,
    name: 'Test',
    timestamp: 0,
    unreadCount: 0
}

const mockClient = {
    // sendMessage: jest.fn().mockResolvedValue('Message sent'),
    getChatById: jest.fn().mockResolvedValue(mockChat),
}

const mockedMessages = [
    {
      _data: {
        id: { /* properties */ },
        // Rest of the _data properties
      },
      mediaKey: undefined,
      id: { /* properties */ },
      ack: 3,
      hasMedia: false,
      body: 'kepo deh',
      type: 'chat',
      timestamp: 1689911384,
      from: '6282228544074@c.us',
      to: '6285895090120@c.us',
      author: undefined,
      deviceType: 'ios',
      isForwarded: undefined,
      forwardingScore: 0,
      isStatus: false,
      isStarred: false,
      broadcast: false,
      fromMe: false,
      hasQuotedMsg: true,
      hasReaction: false,
      duration: undefined,
      location: undefined,
      vCards: [],
      inviteV4: undefined,
      mentionedIds: [],
      orderId: undefined,
      token: undefined,
      isGif: false,
      isEphemeral: undefined,
      links: []
    },
    {
      _data: {
        id: { /* properties */ },
        // Rest of the _data properties
      },
      mediaKey: undefined,
      id: { /* properties */ },
      ack: 3,
      hasMedia: false,
      body: 'baik🧍🏼‍♂️',
      type: 'chat',
      timestamp: 1689911792,
      from: '6285895090120@c.us',
      to: '6282228544074@c.us',
      author: '6285895090120@c.us',
      deviceType: 'android',
      isForwarded: false,
      forwardingScore: 0,
      isStatus: false,
      isStarred: false,
      broadcast: false,
      fromMe: true,
      hasQuotedMsg: false,
      hasReaction: true,
      duration: undefined,
      location: undefined,
      vCards: [],
      inviteV4: undefined,
      mentionedIds: [],
      orderId: undefined,
      token: undefined,
      isGif: false,
      isEphemeral: undefined,
      links: []
    }
  ];
  

describe('messageFinder and messageFetcher', () => {
    afterEach(() => {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    });
  
    test('messageFinder returns the correct message', async () => {
      // Mocking necessary data
      const chatId = 'chatId123';
      const messageId = 'messageId456';
      const mockedMessage = { id: { id: messageId }, /* other message properties */ };
      mockClient.getChatById.mockResolvedValue({ fetchMessages: jest.fn().mockResolvedValue([mockedMessage]) });
  
      const foundMessage = await messageFinder(mockClient, chatId, messageId);
      expect(foundMessage).toEqual(mockedMessage);
    });
  
    test('messageFinder throws NotFoundError when message is not found', async () => {
      // Mocking necessary data
      const chatId = 'chatId123';
      const messageId = 'messageId456';
      mockClient.getChatById.mockResolvedValue({ fetchMessages: jest.fn().mockResolvedValue([]) });
  
      await expect(messageFinder(mockClient, chatId, messageId)).rejects.toThrowError(NotFoundError);
    });
  
    test('messageFetcher retrieves messages', async () => {
      // Mocking necessary data
      const chatId = 'chatId123';
      const limit = 10;
    //   const mockedMessages = [/* mocked messages */];
      mockClient.getChatById.mockResolvedValue({ fetchMessages: jest.fn().mockResolvedValue(mockedMessages) });
  
      const messages = await messageFetcher(mockClient, chatId, limit);
      expect(messages).toEqual(mockedMessages);
    });
  
    test('messageFetcher retrieves messages without limit', async () => {
      // Mocking necessary data
      const chatId = 'chatId123';
    //   const mockedMessages = [/* mocked messages */];
      mockClient.getChatById.mockResolvedValue({ fetchMessages: jest.fn().mockResolvedValue(mockedMessages) });
  
      const messages = await messageFetcher(mockClient, chatId);
      expect(messages).toEqual(mockedMessages);
    });
  });