# SockTools
Tools for analyzing binary TCP stream data using Node.js

## Examples

### Play back data from a captured bidirectional log file
Listen on one port for the uplink and another for the downlink
...
./capturelog '<<:22100' '>>:22101'  
...

Play back each channel of the log file to its own port  
...
./playlog data/raw.txt '<<:127.0.0.1:22100' '>>:127.0.0.1:22101'  
...

### Send sample data through a logging proxy
Start the logging proxy - listen on port 22100, forward to port 22101, and log to port 22102  
...
./proxy '<<:22100' '>>:localhost:22101' 22102  
...

Listen on the proxy forward port  
...
./capturelog '<<:22101'  
...

Play back a log into the proxy listen port  
...
./playlog data/raw.txt '<<:127.0.0.1:22100'  
...

Monitor the logging output of the proxy  
...
telnet localhost 22101 | tee -a log.txt  
...

## Dependencies
Node.js 4.2.6+


