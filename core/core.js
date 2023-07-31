const logger = require('../util/logger.js');

const messageHandler = async (client, message) => {
  const { from, type, body, to } = message;
  
  if (message != null && to != null){
    switch (type) {
      case 'chat':
        if (body.toLowerCase() === 'hai') {
          await client.sendMessage(from, 'Hi!');
        }
        break;
      case 'image':
        // try hasMedia property
        if(message.hasMedia && message.body === '!tostiker') {
          // create sticker from received image
          logger.info(` received image, converting to sticker...`);
          // const quotedMsg = await message.getQuotedMessage();
          const mediaData = await message.downloadMedia();
          logger.info(`${mediaData}}`);
          client.sendMessage(from, mediaData, { sendMediaAsSticker: true });
        }
        else if (message.hasMedia && message.body === '!image') {
          // send back received image and say thanks
          const media = await message.downloadMedia();
          await client.sendMessage(from, media, { caption: 'Terima kasih atas gambar yang Anda kirim!'});
        }
        break;
      case 'audio':
        logger.info('audio received')
        // await client.sendMessage(from, 'Terima kasih atas audio yang Anda kirim! Saya akan mendengarkannya.');
        break;
      case 'ptt': // voice
        logger.info('voice received')
        // await client.sendMessage(from, 'Terima kasih atas suara yang Anda kirim! Saya akan mendengarkan pesan suara Anda.');
        break;
      case 'video':
        logger.info('video received')
        // await client.sendMessage(from, 'Terima kasih atas video yang Anda kirim! Saya akan menontonnya.');
        break;
      case 'document':
        logger.info('document received')
        // await client.sendMessage(from, 'Terima kasih atas dokumen yang Anda kirim! Saya akan membacanya.');
        break;
      case 'sticker':
        // try MessageMedia property
        // const sticker = MessageMedia.fromFilePath('./yeji.jpg');
        // await client.sendMessage(from, sticker, { sendMediaAsSticker: true });
        logger.info('sticker received');
        break;
      case 'location':
        // try Location property
        logger.info('location received');
        let latitude = -7.2861445;
        let longitude = 112.6993123;
        let desc = 'Voza Tower Surabaya';
        let location = new Location(latitude, longitude, desc || "");
        await message.reply(location);
        break;
      case 'vcard':
        logger.info('vcard received');
        // const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
        //   + 'VERSION:3.0\n' 
        //   + 'FN:Rayhan Zs\n' // full name
        //   + 'ORG:Indonesia;\n' // the organization of the contact
        //   + 'TEL;type=CELL;type=VOICE;waid=6282133164875:+91 12345 67890\n' // WhatsApp ID + phone number
        //   + 'END:VCARD'
        // client.sendMessage(from, {
        //   contact: {
        //     name: 'Rayhan Zs',
        //     contacts: [{vcard}]
        //   }
        // }
        // )
        break;
      case 'REACTION':
        await client.sendMessage(from, 'Terima kasih atas reaksi Anda!');
        break;
      default:
        // Handle other message types or unknown types
        // await client.sendMessage(from, 'Kami akan segera kembali. Terima kasih!');
        logger.info(`Message type ${type} is not supported.`);
        break;        
    }
  }
  return type
}

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

const messageFinder = async (client, chatId, messageId) => {
  const messages = await messageFetcher(client, chatId)
  const message = messages.find(msg => msg.id.id === messageId)
  if (!message || message === undefined) {
      throw new NotFoundError(`Message ${messageId} not found`);
  }
  return message
}

const messageFetcher = async (client, chatId, limit) => {
  const chat = await client.getChatById(chatId).catch(() => {
      throw new NotFoundError(`Chat ${chatId} not found`);
  })
  // console.log(chat);
  // Use a conditional statement to handle the 'limit' argument
  const messages = limit
      ? await chat.fetchMessages({ limit: limit }).catch(() => {
          throw new NotFoundError(`Messages not found`);
      })
      : await chat.fetchMessages().catch(() => {
          throw new NotFoundError(`Messages not found`);
      });
  console.log(messages)
  return messages
}
// export messageHandler that will be used in index.js
module.exports = { messageFinder, messageFetcher, messageSender, messageHandler};

// const messageHandler = async (message) => {
//   const { from, type, body, to } = message;
  
//   if (message != null && to != null){
//     switch (type) {
//       case 'chat':
//         if (body.toLowerCase() === 'hai') {
//           await client.sendMessage(from, 'Hi!');
//         }
//         break;
//       case 'image':
//         // try hasMedia property
//         if(message.hasMedia && message.body === '!tostiker') {
//           // create sticker from received image
//           logger.info(` received image, converting to sticker...`);
//           // const quotedMsg = await message.getQuotedMessage();
//           const mediaData = await message.downloadMedia();
//           logger.info(`${mediaData}}`);
//           client.sendMessage(from, mediaData, { sendMediaAsSticker: true });
//         }
//         else if (message.hasMedia && message.body === '!image') {
//           // send back received image and say thanks
//           const media = await message.downloadMedia();
//           await client.sendMessage(from, media, { caption: 'Terima kasih atas gambar yang Anda kirim!'});
//         }
//         break;
//       case 'audio':
//         logger.info('audio received')
//         // await client.sendMessage(from, 'Terima kasih atas audio yang Anda kirim! Saya akan mendengarkannya.');
//         break;
//       case 'ptt': // voice
//         logger.info('voice received')
//         // await client.sendMessage(from, 'Terima kasih atas suara yang Anda kirim! Saya akan mendengarkan pesan suara Anda.');
//         break;
//       case 'video':
//         logger.info('video received')
//         // await client.sendMessage(from, 'Terima kasih atas video yang Anda kirim! Saya akan menontonnya.');
//         break;
//       case 'document':
//         logger.info('document received')
//         // await client.sendMessage(from, 'Terima kasih atas dokumen yang Anda kirim! Saya akan membacanya.');
//         break;
//       case 'sticker':
//         // try MessageMedia property
//         // const sticker = MessageMedia.fromFilePath('./yeji.jpg');
//         // await client.sendMessage(from, sticker, { sendMediaAsSticker: true });
//         logger.info('sticker received');
//         break;
//       case 'location':
//         // try Location property
//         logger.info('location received');
//         let latitude = -7.2861445;
//         let longitude = 112.6993123;
//         let desc = 'Voza Tower Surabaya';
//         let location = new Location(latitude, longitude, desc || "");
//         await message.reply(location);
//         break;
//       case 'vcard':
//         logger.info('vcard received');
//         // const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
//         //   + 'VERSION:3.0\n' 
//         //   + 'FN:Rayhan Zs\n' // full name
//         //   + 'ORG:Indonesia;\n' // the organization of the contact
//         //   + 'TEL;type=CELL;type=VOICE;waid=6282133164875:+91 12345 67890\n' // WhatsApp ID + phone number
//         //   + 'END:VCARD'
//         // client.sendMessage(from, {
//         //   contact: {
//         //     name: 'Rayhan Zs',
//         //     contacts: [{vcard}]
//         //   }
//         // }
//         // )
//         break;
//       case 'REACTION':
//         await client.sendMessage(from, 'Terima kasih atas reaksi Anda!');
//         break;
//       default:
//         // Handle other message types or unknown types
//         // await client.sendMessage(from, 'Kami akan segera kembali. Terima kasih!');
//         logger.info(`Message type ${type} is not supported.`);
//         break;        
//     }
//   }
//   return type
// }