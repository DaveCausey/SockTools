
const app = process.argv[2];
var config = require('./config')[app];
config = config && config.terminal;
if (!config) return;

var net = require('net');
var Logger = require('./logger');
var Parser = require('./parser');
var LogFile = require('./logfile');
var rootLogger = new Logger();
var logger = rootLogger.sub('#');
var log = logger.log;

if (config.playback) {
  var logFile = config.playback.file;
  var terms = config.playback.channels.map(function(ch) {ch.file = logFile; return new Terminal(ch)});
  terms.forEach(function(t){t.start()});
}

function Terminal(config) {
  var addr = config.addr, port = config.port;
  var file = config.file, channel = config.channel;
  var trace = config.trace;
  var _socket = null;
  var onRead = [], onWrite = [];
  var _player = new LogFile.Player();
  _player.on('data', onPlay);

  configureTrace(config.trace);

  this.start = start;

  function start() {
    _socket = net.connect(port, addr, onConnect);
    _socket.on('data', function(data){onRead.forEach(function(f){f(data)})});
    _socket.on('close', onDisconnect);
  }

  function onConnect() {playLog()}
  function onDisconnect() {log('Disconnected')}
  function onPlay(data) {_socket.write(data); onWrite.forEach(function(f){f(data)})}
  function onDone() {log('Done');}

  function playLog() {
    log('Playing log');
    var tref = +new Date(); // Reference timing to right now
    new LogFile.Reader(log).read(file, tref, function(err, data) {
      if (err) return log('Error: ', err);
      _player.play(data, channel, onDone)
    });
  }

  function configureTrace(tr) {
    var tr = config.trace;
    if (tr === 'rx' || tr === 'both') {
      var ch = '<<'; if (ch === channel) ch = '>>';
      var rxParser = new Parser(logger.sub(ch),rootLogger.sub(ch));
      onRead.push(function(data){rxParser.rx(data)});
    }
    if (tr === 'tx' || tr === 'both') {
      var txParser = new Parser(logger.sub(channel),rootLogger.sub(channel));
      onWrite.push(function(data){txParser.rx(data)});
    }
  }

}

