var server = require('http').createServer();
var io = require('socket.io')(server);

server.listen(3000);

console.log("Server is running...");

io.sockets.on('connection', function (socket) {
    console.log('socket connected:' + socket.id);
});