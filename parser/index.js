
var deps = require('./deps');
var ilc = deps.ilc;
var Framer = require('./framer');
var Mux = require('./mux');
var Arq = require('./arq');
var App = require('./app');

module.exports = Parser;

function Parser(logger, dlog) {
  var log = logger.log;
  var framer = new Framer(logger.sub('FRM'));
  var mux = new Mux(logger.sub('MUX'), dlog);
  var arq = new Arq(logger.sub('ARQ'));
  var app = new App(logger.sub('APP'));

  var _stream = new ilc.EndPoint('stream');
  var _extra = new ilc.EndPoint('extra');
  _extra.on('data',extraData);

  ilc.connect(_stream, framer.stream);
  ilc.connect(_extra, framer.extra);
  ilc.connect(framer.frame, mux.ldata);
  ilc.connect(mux.udata, arq.ldata);
  ilc.connect(arq.udata, app.data);

  arq.rxNext = app.rx;

  this.rx = rx;

  function rx(data) {
    _stream.write({time:+new Date(), data:data});
  }

  function extraData(p) {
    log('XX : ', p.data.toString('hex'));
  }
}

