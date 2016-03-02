
var EndPoint = require('./ilc').EndPoint;
var FrameParser = require('./pack').Reader;

module.exports = Mux;

function Mux(logger, dlogger) {
  var log = logger.log, dlog = dlogger.log;
  var self = this;
  var _ts = null;

  self.ldata = new EndPoint('ldata');
  self.udata = new EndPoint('udata');

  self.ldata.on('data',rx);

  function rx(p) {
    _ts = p.time;
    var data = p.data;
    var fp = new FrameParser(data);
    var flag = fp.read16();
    var id = fp.read16();
    var len = fp.read16();
    var payload = fp.readAll();
    var trace = {silence:false, comment:'rx', data:data};
    if (id) self.udata.write({time:_ts, data:payload, trace:trace});
    else processCtlFrame(payload, trace);
    dlog('[%s] %s%s', _ts.toString(16), trace.data.toString('hex'), trace.comment ? ' # '+trace.comment : '');
  }

  function processCtlFrame(data, trace) {
    trace.comment = 'Control Frame'
    var fp = new FrameParser(data);
    var req = fp.read16();
    switch (req) {
      case 5: processConnect(fp); break;
      case 6: processDisconnect(fp); break;
      case 7: processTermIdentity(fp); break;
      default: log('processCtlFrame: %s', data.toString('hex'));
    }

    function processConnect(fp) {
      trace.comment = 'Connect Notification';
      var oldTermKey = fp.read32();
      var pid = fp.read32();
      var machine = fp.readString();
      var version = fp.readString();
      var termID = fp.read64();
      log('machine = %s', machine);
      log('version = %s', version);
      log('termID = %s', termID.toString('hex'));
    }

    function processDisconnect(fp) {
      trace.comment = 'Disconnect Notification';
      //log('Received disconnect notification');
    }

    function processTermIdentity(fp) {
      trace.comment = 'Term Identity';
      var termID = fp.read64();
      //log('Received term identity assignment: %s', termID.toString('hex'));
    }
  }
}

