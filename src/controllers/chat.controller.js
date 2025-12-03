export class ChatController {
  constructor(chatService) {
    this.chatService = chatService;
  }

  async getChatHistory(req, res, next) {
    try {
      const result = await this.chatService.getChatHistory(
        req.user.id,
        req.params.userId,
        req.query,
      );
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
