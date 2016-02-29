
var emittify = require('./emittify');

module.exports = {
  EndPoint: EndPoint,
  connect: connect,
};

function EndPoint(name) {
  emittify(this);
  this.write = function(p){this.emit('idata',p)}
}

function connect(ep1, ep2) {
  ep1.on('idata',function(data){ep2.emit('data',data)});
  ep2.on('idata',function(data){ep1.emit('data',data)});
}

