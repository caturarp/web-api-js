const logger = require('./util/logger.js');

const messageFinder = async (client, chatId, messageId) => {
    const chat = await client.getChatById(chatId).catch(() => {
        throw new NotFoundError(`Chat ${chatId} not found`);
    })
    const messages = await chat.fetchMessages({ limit: 100 }).catch(() => {
        throw new NotFoundError(`Messages not found`);
    })
    const message = messages.find(msg => msg.id.id === messageId)
    if (!message || message === undefined) {
        throw new NotFoundError(`Message ${messageId} not found`);
    }
    return message
}
// export messageHandler that will be used in index.js
module.exports = messageFinder;