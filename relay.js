
const app = process.argv[2];
var config = require('./config')[app];
config = config && config.proxy;
if (!config) return;

const net = require('net');
const util = require('util');
const EventEmitter = require('events');
const Logger = require('./logger');
const Parser = require('./parser');
const rootLogger = new Logger(config.log);
const logger = rootLogger.sub('#');
const log = logger.log;

if (config) {
  var relay = new Relay(config);
}

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
  EventEmitter.call(this);
  var self = this;
  var upQueue = [];
  var _ready = false;
  var socket = net.connect(config.port, config.addr, onConnect);

  self.write = write;

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
util.inherits(Uplink,EventEmitter);

