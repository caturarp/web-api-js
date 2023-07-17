let SocketIORun = () => { 200}
let io = SocketIORun()
io.on('connect',function(socket){
    socket.on('message',function(message){
        // Iki lapo?
    })
})