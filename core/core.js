const logger = require('../util/logger.js');

const messageHandler = async (client, messageDetails) => {
  // console.log(client)
  let { from, to, type, message, urlni, filename } = messageDetails;
  const idSend = to + "@s.whatsapp.net";
  try {
    await client.sendMessage(idSend, message);
    logger.info(`Message sent to ${to} from ${from}`);
  } catch (error) {
    logger.error(`Error in sending message to ${to} from ${from}`);
    // logger.error(message.error);
    logger.error(error.message);
  }

}
// export messageHandler that will be used in index.js
module.exports = messageHandler;