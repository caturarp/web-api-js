// const initApp = require('./app').initApp
const http = require('http');
const bodyParser = require("body-parser");
const express = require('express');

const app = express();
const server = http.createServer(app);
const port = 3000;
const qrcode = require('qrcode-terminal');
const qrOption = require('qrcode');
const fs = require('fs-extra');
const rimraf = require("rimraf");

const socketIO= require('socket.io')(server);
const io = socketIO
const { body, validationResult } = require("express-validator");
const { contextsKey } = require('express-validator/src/base');
const logger = require('./util/logger.js');
const sessionPath = "sessions/";

const { Client,
  LocalAuth,
  Location,
  MessageMedia,
  MessageTypes,
  Message,
  Contact,
  Chat } = require('whatsapp-web.js');


// import modules from core.js
const { messageFinder, messageFetcher, messageSender } = require('./core/core.js');


// const newUserAgent = 'Looyal EDGE/1.0'

let activeSessions = {}; // Menyimpan informasi sesi aktif
const chatIdMap = new Map();

let initApp = (clientId) => {
  try {
    io.on('connection', (socket) => {
      // let clientId = socket.id;
      const client = new Client({
        authStrategy: new LocalAuth({
            dataPath: sessionPath,
            // clientId: clientId
        })
      })
      
      activeSessions[clientId] = client;
      console.log(client)
  
      client.on('authenticated', () => {
          logger.info(`client ${clientId} authenticated!✅`)
          socket.emit('authenticated', {clientId: clientId})
      })
  
      client.on('qr', async(qr) => {
          qrcode.generate(qr, {small: true});
          // // currentQR = qr
          // socket.emit('qr', qr); 
          // const { connection, qr } = update;
          if (qr) {
            qrOption.toDataURL(qr, (err, url) => {
              if (err) {
                console.error("Error generating QR code:", err);
                // Kirim pesan ke klien bahwa terjadi kesalahan dalam pembuatan QR code
                socket.emit("message", "Error generating QR code. Please try again.");
              } else {
                socket.emit("qr", url);
                socket.emit("message", "QR Code received, please scan!");
              }
            });
          }
          else {
            socket.emit("message", "no qr code found");
          }
      });
      
      client.on('ready', () => {
          logger.info(`client ${clientId} ready!`)
          console.log(sessionPath.concat(`session-${clientId}`))
          // socket.emit('ready', {clientId: clientId})
      });
      
      client.on('auth_failure', (msg) => {
          logger.info(`client ${clientId} authentication failure: ${msg}`)
          deleteSession(clientId);
          // socket.emit('auth_failure');
          client.initialize()
      });
  
      client.on('message', async (msg, clientId) => {
        // handle message to specific action according to type
        let messageType = await messageHandler(msg, clientId)
        logger.info(`${messageType} command successfully received.`)

        // save message to database
        const uploadedMessage = await saveMessage(msg, clientId)
        if(uploadedMessage){
          console.log(uploadedMessage.chatMessageBody)
          logger.info(`Message successfully saved to database.`)
        }
          // socket.emit('message', msg);  
      });

      // on message_create
      client.on('message_create', async (msg, clientId) => {
        if (!msg) {
          logger.error(`Message is empty, skip saving...`)
        }  
        // save message to database
        const uploadedMessage = await saveMessage(msg, clientId)
        if(uploadedMessage){
          console.log(uploadedMessage.chatMessageBody)
          logger.info(`Message successfully saved to database.`)
        }
      })
  
      client.on('disconnected', async (reason) => {
        logger.info(`client ${clientId} disconnected: ${reason}`);
        delete activeSessions[clientId]; // Remove the session from sessions object
        // await client.destroy();
        deleteSession();
        socket.emit('disconnected', reason);
        // client.initialize();
      });
      client.initialize();
    });
     
    const saveMessage = async (message, clientId) => {
      // const message = m.messages[0];
      // console.log(message)
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
        if (group == undefined){
          conversation = `${numberSender} (group): ${body}`
          logger.info(`Message is from group, skip saving...`, conversation)
          return
        }
        const payload = {
          chatNumberSender: numberSender,
          chatNumberReceiver: numberReceiver,
          chatMessageId: messageId,
          chatMessageBody: conversation,
          chatIsFromMe: fromMe
        };
        return payload
        // post method here
        // const response = await axios.post();
      } catch (error) {
        logger.error(`Error saving message: ${error.message}`)
      }
      return
    }

    const deleteSession = () => {
      const sessionDirectory = sessionPath;
    
      if (fs.existsSync(sessionDirectory)) {
        try {
          rimraf.sync(sessionDirectory, { force: true });
          logger.info(`Session directory deleted: ${sessionDirectory}`);
        } catch (error) {
          logger.error(`Error deleting session directory: ${error}`);
        }
      } else {
        logger.info(`Session directory does not exist: ${sessionDirectory}`);
      }
    };
    
    const messageHandler = async (message) => {
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
        // if (type === 'chat') {
        //     if (body.toLowerCase() === 'hai') {
        //       await client.sendMessage(from, 'Hi!');
        //     }
        // } else if (message.type === 'image') {
        //     await message.reply('Terima kasih atas gambar yang dikirim!');
        // }
        }
        // logger.info('Message sent!');
      }
      return type
    }

  } catch (error) {
    fs.emptyDir(sessionPath); // Remove all files and subdirectories
    fs.remove(sessionPath); // Remove the empty directory
    logger.error(`Error initializing client ${clientId}: ${error}`);
    logger.info(`Session directory deleted: ${sessionPath}`);
  }
}


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + "/asset/img/"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/core/home.html");
});

app.get("/device", (req, res) => {
  res.sendFile(__dirname + "/core/device.html");
});

app.post("/device", (req, res) => {
  const no = req.body.device;
  res.redirect("/scan/" + no);
});

app.post("/send",
  [
    body("from").notEmpty(), //change from "number" to "from" matching to wwebjs property
    body("message"),
    body("to").notEmpty(),
    body("type").notEmpty(),
    body("urlni"),
    body("filename")
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ message }) => {
      return message;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped(),
      });
    } else {
      // let { from, to, type, message, urlni, filename } = req.body;
      let messageDetails = req.body;
      if (fs.existsSync(sessionPath.concat("session"))) {
        logger.info('Session exists')
        try {
          // console.log('File exists', number);
          // let clientId = from
          const client = activeSessions[messageDetails.from];
          if (!client) {
            return res.status(404).json({ error: 'Client not found' });
          }
          // const msg = new Message()
          logger.info('Client found, proceed to send message with messageSender')
          // con.gas(message, number, to, type, urlni, filename);
          const sentMessageDetails = await messageSender(client, messageDetails)
          console.log(sentMessageDetails)
          
          res.writeHead(200, {
            "Content-Type": "application/json",
          });
          res.end(
            JSON.stringify({
              status: true,
              message: "success",
            })
          );
        } catch (error) {
          res.writeHead(401, {
            "Content-Type": "application/json",
          });
          res.end(
            JSON.stringify({
              message: "An error occurred",
              error: error.message,
            })
          );
        }
      } else {
        res.writeHead(401, {
          "Content-Type": "application/json",
        });
        res.end(
          JSON.stringify({
            status: false,
            message: "Please scan the QR before using the API",
          })
        );
      }
    }
  }
);

app.get("/unsend", async (req, res) => {
  let device = req.query.device
  let number = req.query.number
  let chatId = req.query.chatId
  let messageId = req.query.messageId

  const client = activeSessions[device];
  
  if (!device) return res.send('Input Parameter Device');
  if (!number) return res.send('Input Parameter Number Parameter');
  if (!/^\d+$/.test(number)) return res.send('Invalid Number');
  if (!chatId) return res.send('Input Parameter chatId Parameter');
  if (!messageId) return res.send('Input Parameter messageId Parameter');
  
  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }
  try {
    const message = await messageFinder(client, chatId, messageId)
    if(!message) return res.send('Message not found')
    await message.delete(true)
    return res.send('Message deleted')
  } catch (error) {
    logger.error(error)
  }

})

app.get("/getchat", async (req, res) => {
  let device = req.query.device
  let number = req.query.number
  let chatId = req.query.chatId
  let limit = parseInt(req.query.limit) // Convert the 'limit' parameter to an integer

  const client = activeSessions[device];

  if (!device) return res.send('Input Parameter Device');
  if (!number) return res.send('Input Parameter Number Parameter');
  if (!/^\d+$/.test(number)) return res.send('Invalid Number');
  if (!chatId) return res.send('Input Parameter chatId Parameter');

  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }
  try {
    const messages = await messageFetcher(client, chatId, limit)
    if(!messages) return res.send('Message not found')
    // console.log(messages)
    // map messages to get message.body only
    messageBodies = messages.map((message) => message.body)
    return res.send(messageBodies)
  } catch (error) {
    logger.error(error)
  }
})

// check if Whatsapp number exist
app.get("/whatscheck", async (req, res) =>{
  let device = req.query.device
  let number = req.query.number
  const client = activeSessions[device];
  if (!client) {
    return res.status(404).json({ error: 'Client not found' });
  }
  try { 
    let contact = await client.getContactById(`${number}@c.us`)
    if (!contact){
      return res.status(404).json({ error: 'contact not found' });
    }
    let isContact = contact.isWAContact
    logger.info(contact, isContact)
    if (!isContact){
      return res.status(404).json({ error: `number not found, ${isContact}` });
    }
    res.writeHead(200, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify({
        status: true,
        message: "success",
      })
    );
  } catch (error) {
    res.writeHead(401, {
      "Content-Type": "application/json",
    });
    res.end(
      JSON.stringify({
        message: "An error occurred",
        error: error.message,
      })
    );
  }
})

app.get("/scan/:id", async (req, res) => {
  const clientId = req.params.id;
  try {
    initApp(clientId);
    // res.send(currentQR).Status(200)
    res.sendFile(__dirname + "/core//index.html");
  } catch (error) {
    if (error instanceof AuthenticationError) {
      logger.info(`client ${clientId} authentication failure: ${error.message}`);
      res.sendStatus(401); // Send 401 Unauthorized status code
    } else {
      // Handle other errors
      res.sendStatus(500); // Send 500 Internal Server Error status code or handle it differently
    }
  }
}); 

// start the express server
server.listen(port, function () {
  console.log(`App running on : ${port}`)
});


