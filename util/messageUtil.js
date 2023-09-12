// messageUtils.js
// const pool = require(''); // Import the pool from the appropriate file
const logger = require('./logger.js'); // Import the logger from the appropriate file

const saveMessage = async (message, clientId) => {

    // const message = m.messages[0];      
    // Extracting details from the message object
    const messageId = message.id.id;
    const fromMe = message.id.fromMe;
    const numberSender = message.id.remote.split('@')[0];
    const group = message.author; // undefined if personal chat
    const numberReceiver = clientId;
    const body = message.body;
    const type = message.type;
    // const timestamp = message.timestamp;
    // const from = message.from;
    // const to = message.to;
    // const hasQuotedMsg = message.hasQuotedMsg;
    // const mentionedIds = message.mentionedIds; 
    console.log(messageId, body)

    try {
      let conversation = body
      if (conversation == null || type == undefined){
        logger.info(`Message is not a text message, skip saving...`)
        return
      }
      // if (isGroupMsg == true){
      //   conversation = `${numberSender} (group): ${body}`
      //   logger.info(`Message is from group, skip saving...`, conversation)
      //   return
      // }
      const payload = {
        chatNumberSender: numberSender,
        chatNumberReceiver: numberReceiver,
        chatMessageId: messageId,
        chatMessageBody: conversation,
        chatIsFromMe: fromMe
      };
      // console.log(payload);

      // Insert the payload data into the database
    //   const query = `
    //     INSERT INTO messages (sender_number, receiver_number, message_id, message_body, is_from_me)
    //     VALUES ($1, $2, $3, $4, $5)
    //     RETURNING *
    //   `;
      
    //   const values = [
    //     payload.chatNumberSender,
    //     payload.chatNumberReceiver,
    //     payload.chatMessageId,
    //     payload.chatMessageBody,
    //     payload.chatIsFromMe,
    //   ];

    //   const result = await pool.query(query, values);
    //   logger.info(`Message saved successfully.`, result.rows[0]);
      return payload
      // post method her
      // const response = await axios.post();
    } catch (error) {
      logger.error(`Error saving message: ${error.message}`)
    }
    return
  }


module.exports = { saveMessage };

// const saveMessage = async (message, clientId) => {
    //   // const message = m.messages[0];
    //   // console.log(message)
    //   // Extracting details from the message object
    //   const messageId = message.id.id;
    //   const fromMe = message.id.fromMe;
    //   const numberSender = message.id.remote.split('@')[0];
    //   const group = message.author; // undefined if personal chat
    //   const numberReceiver = clientId;
    //   const body = message.body;
    //   const type = message.type;
    //   // const timestamp = message.timestamp;
    //   // const from = message.from;
    //   // const to = message.to;
    //   // const hasQuotedMsg = message.hasQuotedMsg;
    //   // const mentionedIds = message.mentionedIds; 
    //   console.log(messageId, body)
    //   try {
    //     let conversation = body
    //     if (conversation == null || type == undefined){
    //       logger.info(`Message is not a text message, skip saving...`)
    //       return
    //     }
    //     if (group == undefined){
    //       conversation = `${numberSender} (group): ${body}`
    //       logger.info(`Message is from group, skip saving...`, conversation)
    //       return
    //     }
    //     const payload = {
    //       chatNumberSender: numberSender,
    //       chatNumberReceiver: numberReceiver,
    //       chatMessageId: messageId,
    //       chatMessageBody: conversation,
    //       chatIsFromMe: fromMe
    //     };

    //     // Insert the payload data into the database
    //     const query = `
    //       INSERT INTO messages (sender_number, receiver_number, message_id, message_body, is_from_me)
    //       VALUES ($1, $2, $3, $4, $5)
    //       RETURNING *
    //     `;
        
    //     const values = [
    //       payload.chatNumberSender,
    //       payload.chatNumberReceiver,
    //       payload.chatMessageId,
    //       payload.chatMessageBody,
    //       payload.chatIsFromMe,
    //     ];

    //     const result = await pool.query(query, values);
    //     logger.info(`Message saved successfully.`, result.rows[0]);
    //     return payload
    //     // post method her
    //     // const response = await axios.post();
    //   } catch (error) {
    //     logger.error(`Error saving message: ${error.message}`)
    //   }
    //   return
    // }