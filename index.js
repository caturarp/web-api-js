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
const { saveMessage } = require("./util/messageUtil.js");

const { Pool } = require("pg");
const { log } = require("console");

// const newUserAgent = 'Looyal EDGE/1.0'

let activeSessions = {}; // Menyimpan informasi sesi aktif

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
            io.on("connection", async (socket) => {
                // let clientId = socket.id;
                const client = new Client({
                    authStrategy: new LocalAuth({
                        dataPath: sessionPath,
                        clientId: clientId,
                    }),
                });
    
                activeSessions[clientId] = client;
                // console.log(client)
                client.initialize();
    
                client.on("authenticated", () => {
                    logger.info(`client ${clientId} authenticated!✅`);
                    socket.emit("authenticated", { clientId: clientId });
                });
    
                client.on("qr", async (qr) => {
                    qrcode.generate(qr, { small: true });
                    if (qr) {
                        qrOption.toDataURL(qr, (err, url) => {
                            if (err) {
                                console.error("Error generating QR code:", err);
                                // Kirim pesan ke klien bahwa terjadi kesalahan dalam pembuatan QR code
                                socket.emit(
                                    "message",
                                    "Error generating QR code. Please try again."
                                );
                            } else {
                                socket.emit("qr", url);
                                socket.emit(
                                    "message",
                                    "QR Code received, please scan!"
                                );
                            }
                        });
                    } else {
                        socket.emit("message", "no qr code found");
                    }
                });
    
                client.on("ready", () => {
                    logger.info(`client ${clientId} ready!`);
                    console.log(sessionPath.concat(`session-${clientId}`));
                    // socket.emit('ready', {clientId: clientId})
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
                    socket.emit("disconnected", reason);
                    // client.initialize();
                });
                
                const clientIds = Object.keys(activeSessions);
                logger.info("active sessions: " + clientIds);  
                resolve(client); 
            });
        } catch (error) {
            fs.emptyDir(sessionPath); // Remove all files and subdirectories
            fs.remove(sessionPath); // Remove the empty directory
            logger.error(`Error initializing client ${clientId}: ${error}`);
            logger.info(`Session directory deleted: ${sessionPath}`);
        }
    })
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
        } else {
            // let { from, to, type, message, urlni, filename } = req.body;
            let messageDetails = req.body;
            if (
                fs.existsSync(
                    sessionPath.concat(`session-${messageDetails.from}`)
                )
            ) {
                console.log(
                    "Session path: " +
                        sessionPath.concat(`session-${messageDetails.from}`)
                );
                logger.info("Session exists");
                try {
                    // console.log('File exists', number);
                    // let clientId = from
                    const client = activeSessions[messageDetails.from];
                    if (!client) {
                        return res
                            .status(404)
                            .json({ error: "Client not found" });
                    }
                    // const msg = new Message()
                    logger.info(
                        "Client found, proceed to send message with messageSender"
                    );
                    // con.gas(message, number, to, type, urlni, filename);
                    const sentMessageDetails = await messageSender(
                        client,
                        messageDetails
                    );
                    console.log(sentMessageDetails);

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
    let device = req.query.device;
    let number = req.query.number;
    const client = activeSessions[device];
    if (!client) {
        return res.status(404).json({ error: "Client not found" });
    }
    try {
        let contact = await client.getContactById(`${number}@c.us`);
        if (!contact) {
            return res.status(404).json({ error: "contact not found" });
        }
        let isContact = contact.isWAContact;
        logger.info(contact, isContact);
        if (!isContact) {
            return res
                .status(404)
                .json({ error: `number not found, ${isContact}` });
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
});

app.get("/scan/:id", async (req, res) => {
    const clientId = req.params.id;
    try {
        console.log("initiating session for client: " + clientId);
        initApp(clientId);
        // Get all the keys (clientIds) from the activeSessions object
        // res.send(currentQR).Status(200)
        res.sendFile(__dirname + "/core//index.html");
    } catch (error) {
        if (error instanceof AuthenticationError) {
            logger.info(
                `client ${clientId} authentication failure: ${error.message}`
            );
            res.sendStatus(401); // Send 401 Unauthorized status code
        } else {
            // Handle other errors
            res.sendStatus(500); // Send 500 Internal Server Error status code or handle it differently
        }
    }
});

// start the express server
server.listen(port, function () {
    console.log(`App running on : ${port}`);
});
