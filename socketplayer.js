
//
// SocketPlayer - Plays back the contents of a logfile on one or more sockets
//

const Logger = require('./logger');
const Player = require('./logplayer');
const Socket = require('./socket');
const ilc = require('./ilc');
const logger = new Logger().sub('#');

module.exports = SocketPlayer;

function SocketPlayer(config) {
  var self = this;
  var allConnected = new ilc.Condition.All();
  var player = new Player(config.file, logger);

  self.go = new ilc.Condition();
  self.start = function(){self.go.set(true)};

  config.channels.forEach(function(ch){
    var s = new Socket({addr:ch.addr, port:ch.port});
    ilc.connect(player.open(ch.channel),s.in);
    ilc.connect(self.go, s.go);
    ilc.connect(s.connected, allConnected);
    ilc.connect(player.done,s.close);
  }), 
  ilc.connect(allConnected, player.go);
}

