import WebSocket, { WebSocketServer } from 'ws';

export const MESSAGES = {

  PING: 'MSG: OPEN PING'

};

export const MESSAGE_TYPE = {

  MESSAGE: 'MESSAGE',
  PING: 'PING',
  UNKNOWN: 'UNKNOWN'

};

export function heartbeat() {

  this.isAlive = true;

}

export function createWebSocketServer(secureServer) {

  const wss = new WebSocketServer({
    server: secureServer,
    perMessageDeflate: {
      zlibDeflateOptions: {
        // See zlib defaults.
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Other options settable:
      clientNoContextTakeover: true, // Defaults to negotiated value.
      serverNoContextTakeover: true, // Defaults to negotiated value.
      serverMaxWindowBits: 10, // Defaults to negotiated value.
      // Below options specified as default values.
      concurrencyLimit: 10, // Limits zlib concurrency for perf.
      threshold: 1024 // Size (in bytes) below which messages
      // should not be compressed if context takeover is disabled.
    }
  });

  const interval = setInterval(function ping() {

    wss.clients.forEach(function each(ws) {

      if (ws.isAlive === false) {

        console.log('Terminating from server');

        return ws.terminate();

      }

      console.log('Called');

      ws.isAlive = false;

      ws.send(MESSAGES.PING);

    });

  }, 3000);

  wss.on('close', function close() {

    clearInterval(interval);

  });

  return wss;

}
