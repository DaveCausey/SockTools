
var deps = require('./deps');
var EndPoint = deps.ilc.EndPoint;
var FrameParser = require('./pack').Reader;
var FrameBuilder = require('./pack').Writer;

module.exports = App;

// Static Data
var messageSpecs = [
  {id:0x01,   name:'Reset',         silence:false  },
  {id:0x02,   name:'ResetAck',      silence:false  },
  {id:0x10,   name:'Start',         silence:false  },
  {id:0x11,   name:'Abort',         silence:false  },
  {id:0x20,   name:'Started',       silence:false  },
  {id:0x21,   name:'Complete',      silence:false  },
  {id:0x22,   name:'Failed',        silence:false  },
  {id:0x23,   name:'Event',         silence:false  },
  {id:0x24,   name:'EventAck',      silence:false  },
  {id:0xff,   name:'Unknown',       silence:false  },
];
var transSpecs = [
  {id:0x0,    name:'None',          start:null,        complete:null,        silence:false  },
  {id:0x1001, name:'Register',      start:null,        complete:null,        silence:false  },
  {id:0x1002, name:'PowerOn',       start:null,        complete:null,        silence:false  },
  {id:0x1003, name:'PowerOff',      start:null,        complete:null,        silence:false  },
  {id:0x1004, name:'Login',         start:null,        complete:null,        silence:false  },
  {id:0x1005, name:'Logout',        start:null,        complete:null,        silence:false  },
  {id:0x1006, name:'StatusReport',  start:null,        complete:null,        silence:false  },
  {id:0x1007, name:'AcceptJob',     start:null,        complete:null,        silence:false  },
  {id:0x1008, name:'StartJob',      start:null,        complete:null,        silence:false  },
  {id:0x1009, name:'CompleteJob',   start:null,        complete:null,        silence:false  },
  {id:0x2001, name:'Dispatch',      start:null,        complete:null,        silence:false  },
  {id:0x2002, name:'Alert',         start:null,        complete:null,        silence:false  },
  {id:0x2003, name:'Event',         start:null,        complete:null,        silence:false  },
  {id:0x2004, name:'Sync',          start:null,        complete:null,        silence:false  },
  {id:0x2005, name:'SysLogout',     start:null,        complete:null,        silence:false  },
  {id:0x3001, name:'Ping',          start:null,        complete:null,        silence:true   },
  {id:0xffff, name:'Unknown',       start:null,        complete:null,        silence:false  },
];
var systemEntity = {
  Terminal: 0x0,
  FieldAgent: 0x1,
  GatewayAgent: 0x2,
  ServerAgent: 0x3,
};
messageSpecs.byId = messageSpecs.reduce(function(t,v){t[v.id]=v;return t},{});
messageSpecs.byName = messageSpecs.reduce(function(t,v){t[v.name]=v;return t},{});
var messageType = messageSpecs.reduce(function(t,v){t[v.name]=v.id;return t},{});
transSpecs.byId = transSpecs.reduce(function(t,v){t[v.id]=v;return t},{});
transSpecs.byName = transSpecs.reduce(function(t,v){t[v.name]=v;return t},{});
var transType = transSpecs.reduce(function(t,v){t[v.name]=v.id;return t},{});

function App(log) {
  var self = this;
  var _session = null;
  var _transID = 1;
  var _localTransactions = {};

  self.data = new EndPoint('data');

  self.data.on('data',processMessage);

  function processMessage(p) {
    var data = p.data;
    var trace = p.trace;
    trace.comment = 'processMessage';
    var fp = new FrameParser(data);
    var mt = fp.read8();
    var spec = messageSpecs.byId[mt] || messageSpecs.byName.Unknown;
    trace.comment = spec.name;
    switch (mt) {
      case messageType.Start: processStart(fp, trace); break;
      case messageType.Complete: processComplete(fp, trace); break;
    }

    function sendResetAck() {
      var fb = new FrameBuilder();
      fb.write8(messageType.ResetAck);
      fb.write32(_session);
//        transmit(fb.data, {comment:'ResetAck'});
    }

    function startTransaction(type, data) {
      var t = {type:type, id:_transID++, startData:data};
      _localTransactions[t.id] = t;
      sendStartTransaction(t);
      return t;
    }

    function sendStartTransaction(t) {
      var fb = new FrameBuilder();
      fb.write8(messageType.Start);
      fb.write16(t.type);
      fb.write32(_session);
      fb.write32(t.id);
      fb.write(t.startData);
      //transmit(fb.data, 'Start');
//        transmit(fb.data, {comment:'Start'});
      t.lastChange = +new Date();
    }

    function completeTransaction(t) {
      var fb = new FrameBuilder();
      fb.write8(messageType.Complete)
      fb.write32(_session)
      fb.write32(t.id)
      if (t.type !== transType.None) {
        fb.write16(t.type)
        if (t.completeData) fb.write(t.completeData)
      }
//        transmit(fb.data, {comment:'Complete transaction ('+ t.type.toString(16) + ':' + t.id.toString(16) + ')'})
      //t.State = Transaction.States.Completed
      //t.LastChange = NowMS()
      //'Debug.WriteLine("Completed transaction: " & transID)
    }

    function processStart(fp, trace) {
      var type = fp.read16();
      _session = fp.read32();
      var tid = fp.read32();
      var payload = fp.readAll();
      var spec = transSpecs.byId[type] || transSpecs.byName.Unknown;
      trace.comment = 'Start transaction ' + tid.toString(16) + ' (' + spec.name + ')';
      if (spec.silence) trace.silence = true;

      var t = {type:type, id:tid, startData:payload, trace:trace}; //, spec:spec};

      function startPowerOnTransaction(t) {
        var fp = new FrameParser(t.startData);
        var entity = fp.read8();
        switch (entity) {
          case systemEntity.Terminal: 
            log('Terminal power on'); 
            pushSync(new Date(), 1);
            break;
        }
        completeTransaction(t);
      }

      function startLoginTransaction(t) {
        var fp = new FrameParser(t.startData);
        var user = fp.readString();
        var truck = fp.readString();
        log('Login: %s, %s', user, truck);
        completeTransaction(t);
      }

      function startLogoutTransaction(t) {
        log('Logout: %s', t.startData.toString('hex'));
        completeTransaction(t);
      }

      function pushSync(currentTime, timeScale) {
        var fb = new FrameBuilder();
        fb.writeDate(currentTime);
        fb.writeFloat(timeScale);
        var t = startTransaction(transType.Sync, fb.data);
        t.persistStart = false;
      }
    }

    function processComplete(fp, trace) {
      var sessionID = fp.read32();
      var transID = fp.read32();
      var type = fp.read16();
      var spec = transSpecs.byId[type] || transSpecs.byName.Unknown;
      trace.comment = 'Complete transaction ' + transID.toString(16) + ' (' + spec.name + ')';
      if (spec.silence) trace.silence = true;
    }
  }

}

