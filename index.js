// const initApp = require('./app').initApp
const http = require('http');
const bodyParser = require("body-parser");
const express = require('express');

const app = express();
const server = http.createServer(app);
const port = 3000;
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const rimraf = require("rimraf");

const { body, validationResult } = require("express-validator");
const { contextsKey } = require('express-validator/src/base');
const logger = pino();
const sessionPath = "sessions/";


const userAgent = 'Looyal EDGE/1.0'

let activeSessions = {}; // Menyimpan informasi sesi aktif
// const createClient = require('./app').createClient

let initApp = (clientId) => {
  const { Client, LocalAuth } = require('whatsapp-web.js');

  if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath);
      logger.info(`sessions folder for client x created ✅`)
  }
  
  const client = new Client({
    authStrategy: new LocalAuth({
        userAgent: userAgent,
        dataPath: sessionPath,
        clientId: clientId
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
  });
  
  client.on('auth_failure', (msg) => {
      logger.info(`client ${clientId} authentication failure: ${msg}`)
  });

  client.on('message', async (msg) => {
      handleMessage(msg)
      logger.info(`client ${clientId} successfully sent message.`)
  });

  client.on('disconnected', (reason) => {
    logger.info(`client ${clientId} disconnected: ${reason}`);
    delete activeSessions[clientId]; // Remove the session from sessions object
    client.destroy();
    client.initialize();
  });
  
  async function handleMessage(message) {
      if (message.type === 'chat') {
          if (message.body.toLowerCase() === 'hai') {
              message.reply('pemikiran gua, lu punya materi lu punya kuasa, tapi buat gua enggak, Nyet.');
          }
      } else if (message.type === 'image') {
          await message.reply('Terima kasih atas gambar yang dikirim!');
      }
    }


  client.initialize();

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
  // use device query as parameter to create client session
  const clientId = req.params.id;
  // pass number to createClient function
  // const client = await createClient(number)
  initApp(clientId)
  res.status(200).send("success")

}); 

// app.post("/device", (req, res) => {
//   const number = req.body.device;
//   res.redirect("/scan/" + number);
// });

// start the express server
server.listen(port, function () {
  console.log(`App running on : ${port}`)
});


