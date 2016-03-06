
var net = require('net');
var ilc = require('./ilc');
var EndPoint = ilc.EndPoint;
var Condition = ilc.Condition;

module.exports = Socket;

function Socket(config) {
  var self = this;
  var addr = config.addr, port = config.port;
  var socket = null;

  self.in = new EndPoint();
  self.out = new EndPoint();
  self.go = new Condition().trigger(connect);
  self.connected = new Condition();
  self.close = close;

  self.in.on('data', function(prim){self.connected.value && socket.write(prim.data)});

  function connect() {
    socket = net.connect(port, addr, onConnect);
    socket.on('data', function(data){self.out.write({time:+new Date(),data:data})});
    socket.on('close', onDisconnect);
  }

  function onConnect() {self.connected.set(true)}
  function onDisconnect() {socket = null; self.connected.set(false)}

  function close() {socket && socket.end()}
}

