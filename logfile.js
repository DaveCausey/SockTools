
const fs = require('fs');
const util = require('util');
const EventEmitter = require('events');

module.exports = {
  Reader: LogReader,
  Player: LogPlayer,
}

function LogReader(log) {

  this.read = read;

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

function LogPlayer() {
  EventEmitter.call(this);
  var self = this;

  this.play = play;

  function play(recs, channel, cb) {
    recs = recs.filter(function(x){return x.channel === channel});
    playNext();

    function playNext() {
      var dr = null;
      var t = +new Date();
      if (recs.length) {
        var dr = recs[0];
        while (dr && t >= dr.time) {
          self.emit('data', dr.data);
          recs.shift();
          dr = recs.length ? recs[0] : null;
        }
      }
      if (dr) setTimeout(playNext, dr.time - t);
      else cb && cb();
    }
  }
}
util.inherits(LogPlayer,EventEmitter);

