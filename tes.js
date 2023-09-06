const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require("qrcode-terminal");
const logger = require("./util/logger.js");

const sessionPath = "sessions/";

const client1 = new Client({
    authStrategy: new LocalAuth({ 
        dataPath: sessionPath,
        clientId: '1', 
    })
});

const client2 = new Client({
    authStrategy: new LocalAuth({ 
        dataPath: sessionPath,
        clientId: '2', 
    })
});

const clients = {}
// Create and store client1
clients[1] = client1;

// Create and store client2
clients[2] = client2;
 

clients[1].on("authenticated", () => {
    logger.info(`client 1 authenticated!✅`);
});

clients[1].on("qr", async (qr) => {
    qrcode.generate(qr, { small: true });
})

clients[1].on('ready', () => {
    console.log('Client 1 is ready!');
});

clients[1].on('message', message => {
	if(message.body === 'hai') {
		message.reply('pong');
	}
});

clients[2].on("authenticated", () => {
    logger.info(`client 2 authenticated!✅`);
});

clients[2].on("qr", async (qr) => {
    qrcode.generate(qr, { small: true });
})

clients[2].on('ready', () => {
    console.log('Client 2 is ready!');
});

clients[2].on('message', message => {
	if(message.body === 'hai') {
		message.reply('pong');
	}
});
 

Object.values(clients).map((client) => {
    client.initialize();
});