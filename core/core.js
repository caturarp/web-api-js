const messageHandler = async (client, messageDetails) => {
  let { from, to, type, message, urlni, filename } = messageDetails;
  try {
    await client.sendMessage(to, message, type, urlni, filename);
    logger.info(`Message sent to ${to} from ${from}`);
  } catch (error) {
    logger.error(`Error in sending message to ${to} from ${from}`);
  }

}