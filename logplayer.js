
//
// LogPlayer - Plays back selected channels from a log file onto one or more data streams
//

const fs = require('fs');
const util = require('util');
const EventEmitter = require('events');
const ilc = require('./ilc');

module.exports = LogPlayer;

function LogPlayer(file, logger) {
  EventEmitter.call(this);
  const self = this;
  const log = logger.log;
  var channels = {};

  self.out = [];
  self.go = new ilc.Condition().trigger(playLog);
  self.done = new ilc.Condition();
  self.open = openChannel;

  function openChannel(ch) {
    var ep = new ilc.EndPoint();
    self.out.push(ep);
    channels[ch] = ep;
    return ep;
  }

  function playLog() {
    log('Playing log');
    var tref = +new Date(); // Reference timing to right now
    new LogReader(log).read(file, tref, function(err, data) {
      if (err) return fail(err);
      play(data);
    });
  }

  function play(recs) {
    if (!Object.keys(channels).length) return fail('No channels configured');
    recs = recs.filter(function(x){return x.channel in channels});
    playNext();

    function playNext() {
      var dr = null;
      var t = +new Date();
      if (recs.length) {
        var dr = recs[0];
        while (dr && t >= dr.time) {
          var ep = channels[dr.channel];
          ep && ep.write({time:+new Date(),data:dr.data});
          recs.shift();
          dr = recs.length ? recs[0] : null;
        }
      }
      if (dr) setTimeout(playNext, dr.time - t);
      else complete();
    }
  }

  function fail(err) {
    log('Error: %s', err);
    self.done.set(true);
  }

  function complete(err) {
    if (err) log('Error: %s', err);
    else log('Done');
    self.done.set(true);
  }
}
util.inherits(LogPlayer,EventEmitter);

function LogReader(log) {
  var self = this;

  self.read = read;

  function read(fileName, tref, cb) {
    if (!cb && typeof tref === 'function') {cb = tref; tref = undefined}

    var recs = [];

    fs.readFile(fileName, 'utf8', function(err,data) {
      if (err) return cb(err);
      data.toString().split('\n').forEach(parseLine);
      if (tref && recs.length) {
        tref = tref - recs[0].time;
        recs.forEach(function(x){x.time+=tref});
      }
      cb(null, recs);
    });

    function parseLine(line) {
      line = line.replace(/\s*#.*/,'');
      if (!line) return;
      var m = line.match(/^([^\s]+)\s+\[([0-9a-f]+)\]\s+([0-9a-f]*)$/);
      if (!m) return log('Failed to parse line "', line, '"');
      recs.push({channel:m[1],time:parseInt(m[2],16),data:new Buffer(m[3],'hex')});
    }
  }
}


