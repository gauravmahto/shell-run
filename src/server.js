import { readFile as rf, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:https';

import express from 'express';

import { ROOT_DIR, SERVER_PORT } from '../constants.js';
import { MESSAGES, MESSAGE_TYPE, createWebSocketServer, heartbeat } from './websocket.js';
import { checkScannedFilePresence, filePath, performScan } from './index.js';

const app = express();

app.use(express.static(join(ROOT_DIR, 'public')));

app.get('/download', async (req, res) => {

  res.download(filePath);

});

const server = createServer({
  key: readFileSync(join(ROOT_DIR, 'server.key')),
  cert: readFileSync(join(ROOT_DIR, 'server.crt'))
}, app);

const onError = console.error;

server.on('error', onError);

const wss = createWebSocketServer(server);

wss.on('connection', function connection(ws) {

  heartbeat.call(ws);

  ws.on('error', onError);

  ws.on('message', function message(data) {

    // console.log('received: %s', data);

    handleWebSocketMessages(ws, data);

  });

  ws.send('MSG: OPEN SUCCESS');

});

function handlePing(ws, data) {

  heartbeat.call(ws);

}

async function handleMessage(ws, data) {

  console.log(`Received message - ${data}`);

  if (data === 'SCAN') {

    try {

      await performScan((data) => ws.send(data));

      const enableDownload = await checkScannedFilePresence();

      if (enableDownload) {

        console.log('SCAN COMPLETE');

        ws.send('SCAN COMPLETE');

      }

    } catch (err) {

      console.error(`Scan error: ${err}`);

      ws.send('Scan error .. please retry after sometime');

    }

  }

}

function handleUnknownMessage(ws, data) {

  console.warn(`Unknown message - ${data}`);

}

function handleWebSocketMessages(ws, data) {

  data = Buffer.from(data).toString('utf-8');

  const messageType = getMessageType(data);

  switch (messageType) {

    case MESSAGE_TYPE.PING:
      handlePing(ws, data);
      break;

    case MESSAGE_TYPE.MESSAGE:
      handleMessage(ws, data);
      break;

    case MESSAGE_TYPE.UNKNOWN:
      handleUnknownMessage(ws, data);
      break;

  }

}

function getMessageType(data) {

  let type = MESSAGE_TYPE.UNKNOWN;

  if (typeof data === 'string') {

    if (data === MESSAGES.PING) {

      type = MESSAGE_TYPE.PING;

    } else {

      type = MESSAGE_TYPE.MESSAGE;

    }

  }

  return type;

}

server.listen(SERVER_PORT, () => console.log(`Server started on port ${SERVER_PORT}`));
