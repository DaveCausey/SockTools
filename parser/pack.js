
module.exports = {
  Writer: FrameBuilder,
  Reader: FrameParser,
  Uint64: Uint64,
};

function FrameBuilder() {
  var data = new Buffer(1024);
  var offs = 0;
  return {
    write8: write8,
    write16: write16,
    write32: write32,
    write64: write64,
    writeFloat: writeString,
    writeDate: write64,
    writeString: writeString,
    write: write,
    get data() {return data.slice(0,offs)},
  };
  function write8(v) {data[offs++] = v}
  function write16(v) {write8((v>>8)&0xff); write8(v&0xff)}
  function write32(v) {write16((v>>16)&0xffff); write16(v&0xffff)}
  function write64(v) {
    v=v||0; 
    if (v instanceof Date) v = (+v)*10000; // 100 ns tick
    if (typeof v === 'number') v = new Uint64(v); 
    write32(v.hi); write32(v.lo)
  }
  function writeString(v) {v = ''+v; data.write(v, offs); offs+=v.length; write8(0)}
  function write(buffer) {if (!buffer) return; buffer.copy(data, offs); offs+=buffer.length}
}

function FrameParser(data) {
  data = data || new Buffer(0);
  var offs = 0;
  return {
    read8: read8,
    read16: read16,
    read32: read32,
    read64: read64,
    readString: readString,
    read: read,
    readAll: readAll,
    toHex: toHex,
  };
  function read8() {return data[offs++]}
  function read16() {return (read8() << 8) + read8()}
  function read32() {return (read16() << 16) + read16()}
  function read64() {return new Uint64(read32(),read32())}
  function readString() {var f=offs,t; for (t=f;(t<data.length)&&data[t];t++); offs=Math.min(data.length,t+1); return data.toString('utf8',f,t)}
  function read(len) {var f = offs, t = offs = offs+len; return data.slice(f, t)}
  function readAll() {return data.slice(offs)}
  function toHex() {return data.slice(offs).toString('hex')}
}

function Uint64(hi, lo) {
  if (typeof hi === 'number' && typeof lo === 'undefined') {
    var t = hi;
    hi = Math.floor(t / 0x100000000);
    lo = t - (hi * 0x100000000);
  }
  return {
    get hi() {return hi},
    get lo() {return lo},
    eq: eq,
    neq: neq,
    toString: toString,
  };

  function eq(v) {v=v||0; if (typeof v === 'number') v = new Uint64(v); return v.hi==hi && v.lo==lo}
  function neq(v) {return !eq(v)}

  function toString(fmt) {
    if (fmt === 'hex' || fmt === 16) return hi.toString(16) + ('00000000'+lo.toString(16)).slice(-8);
    return hi.toString() + ':' + lo.toString();
  }
}

