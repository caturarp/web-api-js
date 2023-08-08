// const initApp = require('./app').initApp
const http = require("http");
const bodyParser = require("body-parser");
const express = require("express");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const qrcode = require("qrcode-terminal");
const qrOption = require("qrcode");
const fs = require("fs-extra");
const rimraf = require("rimraf");
require("dotenv").config();
const config = require("./config");
const port = config.port;

const socketIO = require("socket.io")(server);
const io = socketIO;
const { body, validationResult } = require("express-validator");
const { contextsKey } = require("express-validator/src/base");
const logger = require("./util/logger.js");
const sessionPath = "sessions/";

const {
    Client,
    LocalAuth,
    Location,
    MessageMedia,
    MessageTypes,
    Message,
    Contact,
    Chat,

} = require("whatsapp-web.js");

// import modules from core.js
const {
    messageFinder,
    messageFetcher,
    messageSender,
    messageHandler,
} = require("./core/core.js");
const { connectDevice, disconnectDevice } = require("./util/connectionDeviceUtil.js");
const { saveMessage } = require("./util/messageUtil.js");
const { requestProcessor } = require("./util/requestProcessor.js");
const { Pool } = require("pg");

// const ne`wUserAgent = 'Looyal EDGE/1.0'

let activeSessions = {} // Menyimpan informasi sesi aktif
const requestQueue = []; // Menyimpan antrian request yang akan diproses
let isProcessing = false;


const pool = new Pool({
    user: "postgres",
    host: "containers-us-west-32.railway.app",
    database: "railway",
    password: "JndvZdVXUtYE5Lfdw2sa",
    port: 7887, // Replace with your PostgreSQL port if different
});

const initApp = async (clientId) => {
    return new Promise((resolve, reject) =>{
        try {
            // io.on("connection", async (socket) => {   
            // });
            const client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: sessionPath,
                    clientId: clientId,
                }),
            });

            console.log(client)
            client.initialize();

            client.on("authenticated", () => {
                logger.info(`client ${clientId} authenticated!✅`);
                // socket.emit("authenticated", { clientId: clientId });
            });

            client.on("qr", async (qr) => {
                qrcode.generate(qr, { small: true });
                if (qr) {
                    //  03/08/2023 before 5pm
                    let sessionIndex = -1;

                    for (const key in activeSessions) {
                        if (activeSessions[key].id === clientId) {
                           sessionIndex = clientId;
                        }
                    }
                
                    if (sessionIndex === -1) {
                        client.id = clientId;
                        activeSessions[clientId] = client;
                    }

                    // activeSessions[clientId] = client;
                    qrOption.toDataURL(qr, (err, url) => {
                        if (err) {
                            console.error("Error generating QR code:", err);
                            // Kirim pesan ke klien bahwa terjadi kesalahan dalam pembuatan QR code
                            // socket.emit(
                            //     "message",
                            //     "Error generating QR code. Please try again."
                            // );
                        } else {
                            const base64QR = url.split(",")[1]; // Extract the base64 data from the URL
                            io.to(deviceNumber).emit("qr", base64QR); // Emit the 'qr' event with the QR code data
                            // socket.emit("qr", url);
                            // socket.emit(
                            //     "message",
                            //     "QR Code received, please scan!"
                            // );
                        }
                    });
                } else {
                    // socket.emit("message", "no qr code found");
                }
            });

            client.on("ready", () => {
                logger.info(`client ${clientId} ready!`);
                console.log(sessionPath.concat(`session-${clientId}`));
                // socket.emit('ready', {clientId: clientId})
                //  03/08/2023 before 5pm
                let sessionIndex = -1;

                for (const key in activeSessions) {
                    if (activeSessions[key].id === clientId) {
                       sessionIndex = clientId;
                    }
                }
            
                if (sessionIndex === -1) {
                    client.id = clientId;
                    activeSessions[clientId] = client;
                }
            });

            client.on("auth_failure", (msg) => {
                logger.info(
                    `client ${clientId} authentication failure: ${msg}`
                );
                deleteSession(clientId);
                // socket.emit('auth_failure');
                reject(new Error("Authentication failure"));
            });

            client.on("message", async (msg, clientId) => {
                // handle message to specific action according to type
                let messageType = await messageHandler(client, msg);
                logger.info(`${messageType} command successfully received.`);

                // save message to database
                const uploadedMessage = await saveMessage(msg, clientId);
                if (uploadedMessage) {
                    console.log(uploadedMessage.chatMessageBody);
                    logger.info(`Message successfully saved to database.`);
                }
                // socket.emit('message', msg);
            });

            // on message_create
            client.on("message_create", async (msg, clientId) => {
                if (!msg) {
                    logger.error(`Message is empty, skip saving...`);
                }
                // save message to database
                const uploadedMessage = await saveMessage(msg, clientId);
                if (uploadedMessage) {
                    console.log(uploadedMessage.chatMessageBody);
                    logger.info(`Message successfully saved to database.`);
                }
            });

            client.on("disconnected", async (reason) => {
                logger.info(`client ${clientId} disconnected: ${reason}`);
                delete activeSessions[clientId]; // Remove the session from sessions object
                // await client.destroy();
                deleteSession();
                // socket.emit("disconnected", reason);
                // client.initialize();
            });
            resolve(client); 
        } catch (error) {
            fs.emptyDir(sessionPath); // Remove all files and subdirectories
            fs.remove(sessionPath); // Remove the empty directory
            logger.error(`Error initializing client ${clientId}: ${error}`);
            logger.info(`Session directory deleted: ${sessionPath}`);
        }
    })
};

const startAllSessions = async() => {
    try {
        const sessionFolders = await fs.readdir(sessionPath);
        const devices = sessionFolders.filter(folderName => fs.statSync(sessionPath + folderName).isDirectory());
        const promises = devices.map(dirName => {
            const deviceNumber = dirName.replace("session-", "");
            return initApp(deviceNumber);
        });
        await Promise.all(promises);
        console.log("All sessions are running!");
    } catch (error) {
        console.error("Error starting sessions:", error);
    }
}

const logActiveSessions = () => {
    console.log("Active Sessions:");
    activeSessions.keys(obj).forEach(key => {
        console.log(key);
      });
}

const getBot = (whatsappId) => {
    console.log(`getting the bot`)
    let sessionIndex = -1;
    for (const key in activeSessions) {
        if (activeSessions[key].id === whatsappId) {
           sessionIndex = whatsappId
           break;
        }
        console.log(`Accessing ${activeSessions[key].id} session`)  
    }

    if (sessionIndex === -1) {
      throw new Error("ERR_WAPP_NOT_INITIALIZED");
    }

    return activeSessions[sessionIndex];
};
  

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

app.post(
    "/send",
    [
        body("from").notEmpty(), //change from "number" to "from" matching to wwebjs property
        body("message"),
        body("to").notEmpty(),
        body("type").notEmpty(),
        body("urlni"),
        body("filename"),
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
        } 
        
        let messageDetails = req.body;
        const sessionExists = fs.existsSync(sessionPath.concat(`session-${messageDetails.from}`));

        if (!sessionExists) {
            return res.status(401).json({
                status: false,
                message: "Please scan the QR before using the API",
            });
        } 
        
        try {
            const wBot = getBot(messageDetails.from);
            if (wBot.info == undefined) {
                logger.info("session not ready for client: " + messageDetails.from);
                wBot.initialize()
            }
            else {
                logger.info("session initiated for client: " + wBot.info);
            }
            if (!wBot) {
                return res
                    .status(404)
                    .json({ error: "Client not found" });
            }
            logger.info(
                "Client found, proceed to send message with messageSender"
            );
            const sentMessageDetails = await messageSender( wBot, messageDetails );

            console.log(sentMessageDetails);
            res.status(200).json({
                status: true,
                message: "Success",
                sentMessageDetails: sentMessageDetails,
            });
        } catch (error) {
            res.status(500).json({
                status: false,
                message: "An error occurred",
                error: error.message,
            });
        }
        
            
    }
);

app.post("/unsend", async (req, res) => {
    let device = req.query.device;
    let number = req.query.number;
    let chatId = req.query.chatId;
    let messageId = req.query.messageId;

    const client = activeSessions[device];

    if (!device) return res.send("Input Parameter Device");
    if (!number) return res.send("Input Parameter Number Parameter");
    if (!/^\d+$/.test(number)) return res.send("Invalid Number");
    if (!chatId) return res.send("Input Parameter chatId Parameter");
    if (!messageId) return res.send("Input Parameter messageId Parameter");

    if (!client) {
        return res.status(404).json({ error: "Client not found" });
    }
    try {
        if (Array.isArray(messageId)) {
            // Handle multiple messageIds using messagesFinder
            const messages = await messagesFinder(client, chatId, messageId);

            if (messages.length === 0) return res.send("No messages found");

            await Promise.all(messages.map((message) => message.delete(true)));
        } else {
            // Handle a single messageId using messageFinder
            const message = await messageFinder(client, chatId, messageId);
            if (!message) return res.send("Message not found");
            await message.delete(true);
        }
        return res.send("Message(s) deleted");
    } catch (error) {
        logger.error(error);
    }
});

app.get("/getchat", async (req, res) => {
    let device = req.query.device;
    let number = req.query.number;
    let chatId = req.query.chatId;
    let limit = parseInt(req.query.limit); // Convert the 'limit' parameter to an integer

    const client = activeSessions[device];

    if (!device) return res.send("Input Parameter Device");
    if (!number) return res.send("Input Parameter Number Parameter");
    if (!/^\d+$/.test(number)) return res.send("Invalid Number");
    if (!chatId) return res.send("Input Parameter chatId Parameter");

    if (!client) {
        return res.status(404).json({ error: "Client not found" });
    }
    try {
        const messages = await messageFetcher(client, chatId, limit);
        if (!messages) return res.send("Message not found");
        // console.log(messages)
        // map messages to get message.body only
        messageBodies = messages.map((message) => message.body);
        return res.send(messageBodies);
    } catch (error) {
        logger.error(error);
    }
});

// check if Whatsapp number exist
app.get("/whatscheck", async (req, res) => {
    try {
        let device = req.query.device;
        let number = req.query.number;

        const client = activeSessions[device];

        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }
        
        let contact = await client.getContactById(`${number}@c.us`);
        if (!contact) {
            return res.status(404).json({ error: "contact not found" });
        }

        if (!contact.isWAContact) {
            return res.status(404).json({ status: false, error: "Number not found" });
        }

        res.status(200).json({ status: true, message: "Success" });

    } catch (error) {
        res.status(500).json({ status: false, message: "An error occurred", error: error.message });
    }
});

app.get("/scan/:id", async (req, res) => {
    const clientId = req.params.id;
    try {
        console.log("initiating session for client: " + clientId);
        initApp(clientId);
        res.sendFile(__dirname + "/core//index.html");
    } catch (error) {
        if (error instanceof AuthenticationError) {
            logger.info(
                `client ${clientId} authentication failure: ${error.message}`
            );
            res.sendStatus(401); // Send 401 Unauthorized status code
        } else {
            logger.error(`Error for client ${clientId}: ${error.message}`);
            res.status(500).json({ status: false, message: "Internal Server Error" });
        }
    }
});

// start the express server
server.listen(port, function () {
    console.log(`App running on : ${port}`);
    logActiveSessions();
    startAllSessions();
});
