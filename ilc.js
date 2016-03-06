
const util = require('util');
const EventEmitter = require('events');

module.exports = {
  EndPoint: EndPoint,
  connect: connect,
  Condition: Condition,
};

function EndPoint() {
  EventEmitter.call(this);
  this.write = function(p){this.emit('idata',p)}
}
util.inherits(EndPoint,EventEmitter);

function connect(ep1, ep2) {
  if (ep1 instanceof Condition) {
    if (ep2 instanceof ConditionAll) return ep2.connect(ep1);
    return ep1.trigger(ep2);
  }
  ep1.on('idata',function(data){ep2.emit('data',data)});
  ep2.on('idata',function(data){ep1.emit('data',data)});
}

function Condition(value) {
  EventEmitter.call(this);
  var self = this;
  var triggers = [];

  this.value = value;
  this.set = function(v){if (v === this.value) return; this.value = v; this.emit('change',v)}
  this.trigger = function(tgt){triggers.push(tgt);self.value && fire();return self};

  self.on('change', function(v) {if (v && triggers.length) fire()});

  function fire() {
    triggers.forEach(function(tgt){
      if (typeof tgt === 'function') return tgt(); 
      if (tgt instanceof Condition) tgt.set(true);
    });
    triggers = [];
  }
}
util.inherits(Condition,EventEmitter);
Condition.All = ConditionAll;

function ConditionAll(inputs) {
  Condition.call(this, false);
  var self = this;
  var deps = [];

  self.connect = function(c){deps.push(c); c.on('change', update); update()};

  inputs && inputs.forEach(self.connect);
  function update() {self.set(deps.length && !deps.some(function(c){return !c.value}))}
}
util.inherits(ConditionAll,Condition);

