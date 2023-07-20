const logger = require('../util/logger.js');

const messageSender = async (client, messageDetails) => {
  // console.log(client)
  let { from, to, type, message, urlni, filename } = messageDetails;
  const idSend = to + "@s.whatsapp.net";
  try {
    const sentMessage = await client.sendMessage(idSend, message);
    // logger.info(`Message sent to ${to} from ${from}`);
    return sentMessage;
  } catch (error) {
    logger.error(`Error in sending message to ${to} from ${from}`);
    // logger.error(message.error);
    logger.error(error.message);
    throw error
  }

}
// export messageSender that will be used in index.js
module.exports = messageSender;