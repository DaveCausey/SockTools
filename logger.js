
var net = require('net');

module.exports = Logger;

function Logger(config) {
  var self = this;
  var config = config||{prefix:''};
  var _prefix = config.prefix;
  var _method = config.method || consoleLog;
  if (config.base) _method = config.base.log;
  if (config.port) _method = new LogServer(config).log;

  self.log = log;
  self.sub = sub;

  function log() {
    var args = Array.prototype.slice.call(arguments,0);
    if (_prefix) args.unshift(_prefix + ' ' + (args.length ? args.shift() : ''));
    _method.apply(null,args);
  }

  function sub(prefix) {
    // This could be optimized...
    return new Logger({prefix:prefix,base:self});
  }

  function consoleLog() {
    var args = Array.prototype.slice.call(arguments,0);
    console.log.apply(console, args);
  }
}

function LogServer(config) {
  var self = this;
  var _port = config.port;
  var _sockets = [];

  self.log = log;

  net.createServer(onConnect).listen(_port);

  function onConnect(socket) {
    _sockets.push(socket);
    socket.on('close', onClose);

    function onClose() {
      var i = _sockets.indexOf(socket);
      if (i>=0) _sockets.splice(i,1);
    }
  }

  function log() {
    var args = Array.prototype.slice.call(arguments,0);
    var l = expandLog(args) + '\n';
    _sockets.forEach(function(s){try {s.write(l)} catch (e) {}});
  }
}

function expandLog(args) {
  if (!args.length) return '';
  var s = args.shift();
  var m = s.match(/(\%[sdifoOc])/g);
  if (!m) return s;
  m.shift;
  m.forEach(function(x){s = s.replace(x,expand(x))});
  return s;

  function expand(x) {
    if (!args.length) return x;
    var r = x;
    var v = args[0];
    var consume = true;
    switch (x.slice(1)) {
      case 's': r = v; break;
      case 'd': case 'i': r = parseInt(v); break;
      case 'f': r = parseFloat(v); break;
      case 'o': break;
      case 'O': break;
      case 'c': break;
      default: consume = false;
    }
    if (consume) args.shift();
    return ''+r;
  }
}
