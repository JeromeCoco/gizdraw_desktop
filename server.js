var server = require('http').createServer();
var io = require('socket.io')(server);

server.listen(3000);

console.log("Server is running...");

io.sockets.on('connection', function (socket) {
    console.log('socket connected:' + socket.id);

    socket.on("sender", function(data){
        socket.broadcast.emit("sendtopc", data);
    })

    socket.on("createCanvas", function(data){
        socket.broadcast.emit("createCanvasToMobile", data);
    });

    socket.on("sendActiveTool", function(data){
        socket.broadcast.emit("sendActiveToolToPC", data);
    });

    socket.on("sendCoordinates", function(data){
        socket.broadcast.emit("sendCoordinatesToPC", data);
    });

    socket.on("onTouchStart", function (data) {
        socket.broadcast.emit("onTouchStartToPC", data);
    });

    socket.on("onTouchEnd", function (data) {
        socket.broadcast.emit("onTouchEndToPC", data);
    });

    socket.on("sendActivePreset", function (data) {
        socket.broadcast.emit("sendActivePresetToPC", data);
    });

    socket.on("onTouchBrushStart", function(data){
        socket.broadcast.emit("onTouchBrushStartToPC", data);
    });

    socket.on("onTouchBrushEnd", function(data){
        socket.broadcast.emit("onTouchBrushEndToPC", data);
    });

    socket.on("sendPenColor", function(data){
        socket.broadcast.emit("onSendPenColor", data);
    });

    socket.on("sendPenWidth", function(data){
        socket.broadcast.emit("onSendPenWidth", data);
    });

    socket.on("onColorSend", function(data){
        socket.broadcast.emit("onColorSendToPC", data);
    });

    socket.on("onUndo", function(data){
        socket.broadcast.emit("onUndoReceive", data);
    });

    socket.on("onRedo", function(data){
        socket.broadcast.emit("onRedoReceive", data);
    });

    socket.on("cStep", function(data){
        socket.broadcast.emit("cStepReceive", data);
    }); 

    socket.on("onSendGrid", function(data){
        socket.broadcast.emit("onSendGridToPC", data);
    });

    socket.on("onClearCanvasFromPC", function(data){
        socket.broadcast.emit("onClearCanvasToMobile", data);
    });

    socket.on("onClearCanvasFromMobile", function(data){
        socket.broadcast.emit("onClearCanvasToPC", data);
    });

    socket.on("onDisconnectFromMobile", function(data){
        socket.broadcast.emit("onDisconnectToPC", data);
    });
});
