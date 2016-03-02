
module.exports = {

  proxyDemo: {
    terminal: {
      playback: {
        file: 'data/raw.txt',
        channels: [
          {channel:'<<', addr: '127.0.0.1', port: 22100, trace:'tx'},
        ],
      },
    },
    proxy: {
      downlink:{port:22100, channel:'<<'},
      uplink:{addr:'localhost', port:22101, channel:'>>'},
      log:{port:22102}
    },
    server: {
      channels: [
        {port: 22101, channel:'>>'},
      ],
    },
  },

  playback: {
    terminal: {
      playback: {
        file: 'data/raw.txt',
        channels: [
          {channel:'<<', addr: '127.0.0.1', port: 22100, trace:'tx'},
          {channel:'>>', addr: '127.0.0.1', port: 22101, trace:'tx'},
        ],
      },
    },
    server: {
      channels: [
        {port: 22100, channel:'<<'},
        {port: 22101, channel:'>>'},
      ],
    },
  },

};

