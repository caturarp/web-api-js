const qrcode = require('qrcode-terminal');
const pino = require('pino');
const fs = require('fs');
const rimraf = require("rimraf");

const { body, validationResult } = require("express-validator");
const { contextsKey } = require('express-validator/src/base');
const { create } = require('domain');
const logger = pino();
const sessionPath = "sessions/";


let activeSessions = {}; // Menyimpan informasi sesi aktif



let initApp = () => {
    const { Client, LocalAuth } = require('whatsapp-web.js');

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionsPath);
        logger.info(`sessions folder for client x created ✅`)
    }
    
    // const createClient = (clientId) => {
    //     const client = new Client({
    //         authStrategy: new LocalAuth({
    //             dataPath: path,
    //             clientId: clientId
    //         })
    //     })
    //     return client
    // }

    // const client = createClient(clientId);
    
    // get clientId from request.query
    

    console.log(client)
            
    activeSessions[clientId] = client;


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
        
    });

    client.on('disconnected', (reason) => {
        logger.info(`client ${clientId} disconnected : ${reason}`)
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

createClient = (clientId) => {
    const client = new Client({
        authStrategy: new LocalAuth({
            dataPath: sessionPath,
            clientId: clientId
        })
    })
    return client
}


exports.initApp = initApp
exports.createClient = createClient

// client.on('qr', qr => {
//     qrcode.generate(qr, {small: true});
// });

// client.on('ready', () => {
//     console.log('Client is ready!');
// });

// client.on('message', message => {
// 	if(message.body === '!ping') {
// 		message.reply('pong');
// 	}
// });
 

// client.initialize();
 