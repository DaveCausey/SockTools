
var args = {
  playback: {
    file: 'raw.txt',
    channels: [
      {channel:'<<', addr: '127.0.0.1', port: 22100, trace:'tx'},
      {channel:'>>', addr: '127.0.0.1', port: 22101, trace:'tx'},
    ],
  }
};

var net = require('net');
var Logger = require('./logger');
var Parser = require('./parser');
var LogFile = require('./logfile');
var rootLogger = new Logger();
var logger = rootLogger.sub('#');
var log = logger.log;

if (args.playback) {
  var logFile = args.playback.file;
  var terms = args.playback.channels.map(function(ch) {ch.file = logFile; return new Terminal(ch)});
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

