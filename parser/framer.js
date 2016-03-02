
var ilc = require('./ilc');
var EndPoint = ilc.EndPoint;
var FrameParser = require('./pack').Reader;

module.exports = Framer;

function Framer(log) {
  var self = this;
  var _ts = null;

  ['stream','frame','extra'].forEach(function(c){self[c]=new EndPoint(c)});

  self.stream.on('data',rx);

  function rx(p) {
    var data = p.data;
    _ts = p.time;
    while (data && data.length) {
      var fp = new FrameParser(data);
      var flag = fp.read16();
      if (flag === 0x7f7f) {
        var id = fp.read16();
        var len = fp.read16();
        emitPacket(data.slice(0,len+6));
        data = data.slice(len+6);
      } else {
        emitExtra(data);
        data = null;
      }
    }
  }

  function emitPacket(data) {
    self.frame.write({time:_ts, data:data});
  }

  function emitExtra(data) {
    self.extra.write({time:_ts, data:data});
  }
}

