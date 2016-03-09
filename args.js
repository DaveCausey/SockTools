
module.exports = {
  parseInputPort: parseInputPort,
  parseOutputPort: parseOutputPort,
  parsePort: parsePort,
};

function parseInputPort(p) {return parsePort(p,'')}
function parseOutputPort(p) {return parsePort(p,'localhost')}
function parsePort(p,defAddr) {
  var m = p.split(':'); 
  if (m.length === 2) m.splice(1,0,defAddr);
  if (m.length === 3) return {channel:m[0], addr:m[1], port:m[2]};
  console.log('Invalid endpoint argument "%s"', p);
}

