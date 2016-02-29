
var EndPoint = require('./ilc').EndPoint;
var FrameParser = require('./pack').Reader;

module.exports = Arq;

var frameType = {
  Data: 0,
  Ack: 1,
  KeepAlive: 2,
};

function Arq(log) {
  var self = this;
  var _ts = null;

  self.ldata = new EndPoint('ldata');
  self.udata = new EndPoint('udata');

  self.ldata.on('data',rx);

  function rx(p) {
    _ts = p.time;
    var data = p.data;
    var trace = p.trace;
    trace.comment = 'Arq.rx';
    var fp = new FrameParser(data);
    var ft = fp.read8();
    var id = fp.read8();
    switch (ft) {
      case frameType.Data: processData(id, fp, trace); break;
      case frameType.Ack: processAck(id, fp, trace); break;
      case frameType.KeepAlive: log('KeepAlive: ', fp.data); break;
      default: log('ARQ: ', data);
    }
  }

  function processData(id, fp, trace) {
    trace.comment = 'Arq.processData';
    self.udata.write({time:_ts, data:fp.readAll(), trace:trace});
  }

  function processAck(id, fp, trace) {
    trace.comment = 'ARQ Ack';
    trace.silence = true; 
  }
}

