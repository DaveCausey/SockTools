
// Quick and dirty shim to add *.on(...) behavior to simple objects without using EventEmitter as a base class
// There is probably a much better approach

var EventEmitter = require('events').EventEmitter;

module.exports = emittify;

function emittify(self) {
  var _emitter = new EventEmitter();

  self.emit = emit;
  self.on = on;
  self.removeListener = removeListener;

  function on(ev,cb) {
    _emitter.on(ev,cb); 
    return self;
  }

  function removeListener(ev,cb) {
    _emitter.on(ev,cb); 
    return self;
  }

  function emit(ev) {
    var args = Array.prototype.slice.call(arguments,0);
    _emitter.emit.apply(_emitter, args);
  }
}

