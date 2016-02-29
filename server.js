
// Server - TCP port server

var args = {
  channels: [
    //{port: 22100, channel:'<<'},
    {port: 22101, channel:'>>'},
  ],
};

var net = require('net');
var Logger = require('./logger');
var Parser = require('./parser');
var rootLogger = new Logger();
var logger = rootLogger.sub('#');
var log = logger.log;

if (args.channels) {
  args.channels.forEach(function(ch) {
    listen(ch.port, ch.channel);
  });
}

function listen(port, channel) {
  net.createServer(onConnect).listen(port);

  function onConnect(socket) {
    var parser = new Parser(logger.sub(channel),rootLogger.sub(channel));
    socket.on('data', onData).on('close', onClose);
    log('Connected');

    function onClose() {log('Disconnected')}
    function onData(data) {parser.rx(data)}
  }
}

