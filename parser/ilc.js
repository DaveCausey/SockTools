
const util = require('util');
const EventEmitter = require('events');

module.exports = {
  EndPoint: EndPoint,
  connect: connect,
};

function EndPoint(name) {
  EventEmitter.call(this);
  this.write = function(p){this.emit('idata',p)}
}
util.inherits(EndPoint,EventEmitter);

function connect(ep1, ep2) {
  ep1.on('idata',function(data){ep2.emit('data',data)});
  ep2.on('idata',function(data){ep1.emit('data',data)});
}

