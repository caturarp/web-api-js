const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  MessageType,
  MessageOptions,
  Mimetype
} = require("@whiskeysockets/baileys");


const pino = require("pino");
const fs = require("fs");
const rimraf = require("rimraf");
const { Console } = require("console");
const path = "sessions/";
let x;

exports.gas = function (msg, no, to, type,urlni,filename) {
  con(no, msg, to, type, urlni, filename); // run
};

async function con(sta, msg, to, type, urlni, filename){
  const { state, saveCreds } = await useMultiFileAuthState(path.concat(sta));

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    defaultQueryTimeoutMs: undefined,
    logger: pino({ level: "fatal" }),
    browser: ["Looyal", "EDGE", "1.0"],
  });

  sock.ev.on("connection.update",async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection == "connecting") return;

    if (connection === "close") {
      let statusCode = lastDisconnect.error?.output?.statusCode;

      if (statusCode === DisconnectReason.restartRequired) {
        return;
      } else if (statusCode === DisconnectReason.loggedOut) {
        if (fs.existsSync(path.concat(sta))) {
          // Tambah Trigger Disini Juga
          // fs.unlinkSync(path.concat(sta));
         
          console.log("Deleting directory contents recursively...");
          rimraf.sync(path.concat(sta, "*")); // Hapus isi direktori secara rekursif
          rimraf.sync(path.concat(sta)); // Hapus direktori utama
          console.log("message", "Device session closed");
      
          // rimraf.sync(path.concat(sta),{});
        }
        return;
      }
    } else if (connection === "open") {
      if (msg != null && to != null) {
        // for (let x in to) {
        //   const id = to[x] + "@s.whatsapp.net";
        //   if (type === "chat") {
        //     sock.sendMessage(id, {
        //       text: msg,
        //     });
        //   }
        // }

        

        const id = to + "@s.whatsapp.net";



        if (type === "chat") {
          sock.sendMessage(id, {
            text: msg
          });
        }

        if (type === "contact"){
          const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
            + 'VERSION:3.0\n' 
            + 'FN:Rayhan Zs\n' // full name
            + 'ORG:Indonesia;\n' // the organization of the contact
            + 'TEL;type=CELL;type=VOICE;waid=6282133164875:+91 12345 67890\n' // WhatsApp ID + phone number
            + 'END:VCARD'

          sock.sendMessage(id,{
            contacts: { 
              displayName: 'Rayhan', 
              contacts: [{ vcard }] 
          },
          });
        }
        
        if (type === "location"){
          sock.sendMessage(id,{
            location: { degreesLatitude: 24.131, degreesLongitude: 55.1121221 }
          });
        }

        if (type === "videocapt"){
          sock.sendMessage(id,{
            video: {url: urlni},
            caption: msg
          })
        }
        
        if (type === "imagecapt") {
          sock.sendMessage(id, {
            image: {url: urlni},
            caption: msg
          });
        }

        if (type === "video"){
          sock.sendMessage(id,{
            video: {url: urlni}
          });
        }
        
        if (type === "image") {
          sock.sendMessage(id, {
            image: {url: urlni}
          });
        }

        if (type === "filepdf"){ 
          
          sock.sendMessage(id,{
            document: { url: urlni},
            fileName : filename,
            caption: msg
          });
        }

        if (type === "sticker"){ 
          
          sock.sendMessage(id,{
            sticker: {url: urlni}
          
          });
        }

        
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // sock.reply = (msg, text, options) => {
  // sock.reply = (from, text, msg) => sock.sendMessage(from, text, { quoted: msg });

  // if (conn.multi) {
  //   var prefix = /^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\/\\©^]/.test(chats) ? chats.match(/^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\/\\©^]/gi) : '#'
  // } else {
  //   if (conn.nopref) {
  //     prefix = ''
  //   } else {
  //     prefix = conn.prefa
  //   }
  // }

  return sock;
}

// const sendHandler = async (sta, msg, to, type, urlni, filename) => {
//   const sock = await connect(sta);
//   // await sock.connect();
//   sock.sendExec(to, msg);
// }



// const sendHandler = async (sta, msg, to, type, urlni, filename) => {
//   const sock = await connect(sta, msg, to, type, urlni, filename);
//   // await sock.connect();
//   sock.sendExec(to, msg);
// } 

const connect = async (sta) => {
  const { state, saveCreds } = await useMultiFileAuthState(path.concat(sta));

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    defaultQueryTimeoutMs: undefined,
    logger: pino({ level: "fatal" }),
    browser: ["Looyal", "EDGE", "1.0"],
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection == "connecting") return;

    if (connection === "close") {
      let statusCode = lastDisconnect.error?.output?.statusCode;

      if (statusCode === DisconnectReason.restartRequired) {
        return;
      } else if (statusCode === DisconnectReason.loggedOut) {
        if (fs.existsSync(path.concat(sta))) {
          console.log("Deleting directory contents recursively...");
          rimraf.sync(path.concat(sta, "*")); // Hapus isi direktori secara rekursif
          rimraf.sync(path.concat(sta)); // Hapus direktori utama
          console.log("message", "Device session closed");
        }
        return;
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

  return sock;
}

const sendExec = async (sock, msg, to, type, urlni, filename) => {
  const id = to + "@s.whatsapp.net";
        if (type === "chat") {
          sock.sendMessage(id, {
            text: msg
          });
        }

        if (type === "contact"){
          const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
            + 'VERSION:3.0\n' 
            + 'FN:Rayhan Zs\n' // full name
            + 'ORG:Indonesia;\n' // the organization of the contact
            + 'TEL;type=CELL;type=VOICE;waid=6282133164875:+91 12345 67890\n' // WhatsApp ID + phone number
            + 'END:VCARD'

          sock.sendMessage(id,{
            contacts: { 
              displayName: 'Rayhan', 
              contacts: [{ vcard }] 
          },
          });
        }
        
        if (type === "location"){
          sock.sendMessage(id,{
            location: { degreesLatitude: 24.131, degreesLongitude: 55.1121221 }
          });
        }

        if (type === "videocapt"){
          sock.sendMessage(id,{
            video: {url: urlni},
            caption: msg
          })
        }
        
        if (type === "imagecapt") {
          sock.sendMessage(id, {
            image: {url: urlni},
            caption: msg
          });
        }

        if (type === "video"){
          sock.sendMessage(id,{
            video: {url: urlni}
          });
        }
        
        if (type === "image") {
          sock.sendMessage(id, {
            image: {url: urlni}
          });
        }

        if (type === "filepdf"){ 
          
          sock.sendMessage(id,{
            document: { url: urlni},
            fileName : filename,
            caption: msg
          });
        }

        if (type === "sticker"){ 
          
          sock.sendMessage(id,{
            sticker: {url: urlni}
          
          });
        }
}