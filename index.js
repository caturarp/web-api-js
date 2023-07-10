// const initApp = require('./app').initApp
const http = require('http');
const bodyParser = require("body-parser");
const express = require('express');

const app = express();
const server = http.createServer(app);
const port = 3000;
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs-extra');
const rimraf = require("rimraf");

const { body, validationResult } = require("express-validator");
const { contextsKey } = require('express-validator/src/base');
const logger = pino();
const sessionPath = "sessions/";


// const newUserAgent = 'Looyal EDGE/1.0'

let activeSessions = {}; // Menyimpan informasi sesi aktif
// const createClient = require('./app').createClient

let initApp = (clientId) => {
  try {
    const { Client, LocalAuth, Location, MessageMedia, MessageTypes } = require('whatsapp-web.js');

  // if (!fs.existsSync(clientSessionPath)) {
  //     fs.mkdirSync(sessionPath);
  //     logger.info(`sessions folder for client x created ✅`)
  // }
  
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
  })

  client.on('qr', qr => {
      qrcode.generate(qr, {small: true});
  });
  
  client.on('ready', () => {
      logger.info(`client ${clientId} ready!`)
      console.log(sessionPath.concat(`session-${clientId}`))
  });
  
  client.on('auth_failure', (msg) => {
      logger.info(`client ${clientId} authentication failure: ${msg}`)
      deleteSession(clientId);
      client.initialize()
      
  });

  client.on('message', async (msg, clientId) => {
      handleMessage(msg, clientId)
      logger.info(`client ${clientId} successfully sent message.`)
  });

  client.on('disconnected', (reason) => {
    logger.info(`client ${clientId} disconnected: ${reason}`);
    delete activeSessions[clientId]; // Remove the session from sessions object
    deleteSession();
    // client.initialize();
  }); 

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
  

  // const deleteSession = async () => {
  //   // const sessionDirectory = sessionPath.concat(`session-${clientId}`);
  //   const sessionDirectory = sessionPath;
    
  //   try {
  //     if (fs.existsSync(sessionDirectory)) {
  //       await removeSessionDirectory(sessionDirectory);
  //       logger.info(`Session directory deleted: ${sessionDirectory}`);
  //     } else {
  //       logger.info(`Session directory does not exist: ${sessionDirectory}`);
  //     }
  //   } catch (error) {
  //     logger.error(`Error deleting session directory: ${error}`);
  //   }
  // }
  
  // const removeSessionDirectory = async (clientId, retryCount = 3, retryDelay = 1000) => {
  //   while (retryCount > 0) {
  //     try {
  //       await client.destroy(); 
  //       await fs.emptyDir(sessionDirectory); // Remove all files and subdirectories
  //       await fs.remove(sessionDirectory); // Remove the empty directory
  //       return; // Exit the loop if deletion is successful
  //     } catch (error) {
  //       retryCount--;
  //       await delay(retryDelay); // Delay before retrying the deletion
  //     }
  //   }
  // }

  // const delay = async (duration) => {
  //   return new Promise(resolve => setTimeout(resolve, duration));
  // }

  const handleMessage = async (message) => {
    const { from, type, body, to, hasQuotedMsg } = message;
    
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
          await client.sendMessage(from, 'Terima kasih atas audio yang Anda kirim! Saya akan mendengarkannya.');
          break;
        case 'voice':
          await client.sendMessage(from, 'Terima kasih atas suara yang Anda kirim! Saya akan mendengarkan pesan suara Anda.');
          break;
        case 'video':
          await client.sendMessage(from, 'Terima kasih atas video yang Anda kirim! Saya akan menontonnya.');
          break;
        case 'document':
          await client.sendMessage(from, 'Terima kasih atas dokumen yang Anda kirim! Saya akan membacanya.');
          break;
        case 'sticker':
          // try MessageMedia property
          // await client.sendMessage(from, 'Terima kasih atas stiker yang Anda kirim! Sangat lucu!');
          const sticker = MessageMedia.fromFilePath('./yeji.jpg');
          await client.sendMessage(from, sticker, { sendMediaAsSticker: true });
          break;
        case 'location':
          // try Location property
          let latitude = -7.2861445;
          let longitude = 112.6993123;
          let desc = 'Voza Tower Surabaya';
          let location = new Location(latitude, longitude, desc || "");
          await client.sendMessage(from, location);
          break;
        case 'contact':
          const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
            + 'VERSION:3.0\n' 
            + 'FN:Rayhan Zs\n' // full name
            + 'ORG:Indonesia;\n' // the organization of the contact
            + 'TEL;type=CELL;type=VOICE;waid=6282133164875:+91 12345 67890\n' // WhatsApp ID + phone number
            + 'END:VCARD'
          client.sendMessage(from, {
            contact: {
              name: 'Rayhan Zs',
              contacts: [{vcard}]
            }
          }
          )
          break;
        case 'REACTION':
          await client.sendMessage(from, 'Terima kasih atas reaksi Anda!');
          break;
        default:
          // Handle other message types or unknown types
          await client.sendMessage(from, 'Kami akan segera kembali. Terima kasih!');
          break;
      // if (type === 'chat') {
      //     if (body.toLowerCase() === 'hai') {
      //       await client.sendMessage(from, 'Hi!');
      //     }
      // } else if (message.type === 'image') {
      //     await message.reply('Terima kasih atas gambar yang dikirim!');
      // }
      }  
    }
  }

  client.initialize();
  } catch (error) {
    fs.emptyDir(sessionPath); // Remove all files and subdirectories
    fs.remove(sessionPath); // Remove the empty directory
    logger.error(`Error initializing client ${clientId}: ${error}`);
    logger.info(`Session directory deleted: ${sessionPath}`);
  }
}

// initApp()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + "/asset/img/"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/core/home.html");
});

app.get("/device", (req, res) => {
  // use device query as parameter to create client session
  // const number = req.body.device;
  
});
  
app.get("/scan/:id", async (req, res) => {
  const clientId = req.params.id;
  try {
    initApp(clientId);
    res.status(200).send("sucsxcess");
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

// app.post("/device", (req, res) => {
//   const number = req.body.device;
//   res.redirect("/scan/" + number);
// });

// start the express server
server.listen(port, function () {
  console.log(`App running on : ${port}`)
});


