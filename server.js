
const app = process.argv[2];
var config = require('./config')[app];
config = config && config.server;
if (!config) return;

var net = require('net');
var Logger = require('./logger');
var Parser = require('./parser');
var rootLogger = new Logger();
var logger = rootLogger.sub('#');
var log = logger.log;

if (config.channels) {
  config.channels.forEach(function(ch) {
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

