
var config = {
  downlink:{port:22100, channel:'<<'},
  //uplink:{addr:'107.20.164.239', port:8008, channel:'>>'}
  uplink:{addr:'localhost', port:22101, channel:'>>'},
  log:{port:22102}
};

var net = require('net');
var Logger = require('./logger');
var Parser = require('./parser');
var emittify = require('./emittify');
var rootLogger = new Logger(config.log);
var logger = rootLogger.sub('#');
var log = logger.log;

var relay = new Relay(config);

function Relay(config) {
  var dl = config.downlink, ul = config.uplink;
  net.createServer(openStream).listen(dl.port);

  function openStream(socket) {
    var uparser = new Parser(logger.sub(dl.channel), rootLogger.sub(dl.channel));
    var dparser = new Parser(logger.sub(ul.channel), rootLogger.sub(ul.channel));
    var uplink = new Uplink(ul);

    log('Connected');
    socket.on('data', dataup);
    socket.on('close', closed);
    uplink.on('data', datadown);

    function closed() {log('Disconnected')}
    function dataup(data) {uplink.write(data); uparser.rx(data)}
    function datadown(data) {try { socket.write(data); } catch (e) {}; dparser.rx(data)}
  }
}

function Uplink(config) {
  var self = this;
  var upQueue = [];
  var _ready = false;
  var socket = net.connect(config.port, config.addr, onConnect);

  self.write = write;
  emittify(self);

  function write(data) {
    if (upQueue) return upQueue.push(data);
    socket.write(data);
  }

  function onConnect() {
    socket.on('data', rx);
    socket.on('close', closed);
    upQueue.forEach(function(b){socket.write(b)}); upQueue = null;

    function closed() {log('Uplink disconnected')}
    function rx(data) {self.emit('data',data)}
  }
}

