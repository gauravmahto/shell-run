// Create WebSocket connection.
const socket = new WebSocket('wss://bash.gauravmahto.click');

function heartbeat() {

  clearTimeout(this.pingTimeout);

  console.log('heartbeat');

  this.pingTimeout = setTimeout(() => {

    console.log('Terminating from client');

    socket.close();

  }, 3000 + 1000);

}

// Connection opened
socket.addEventListener('open', function (event) {

  socket.send('MSG: OPEN PING');

  heartbeat.call(this);

  socket.send('Hello Server!');

});

// Listen for messages
socket.addEventListener('message', function (event) {

  // console.log('Message from server ', event.data);

  if (event.data === 'MSG: OPEN PING') {

    heartbeat.call(this);

    socket.send('MSG: OPEN PING');

  } else if (event.data === 'SCAN COMPLETE') {

    postMessage('Enable download');

  } else {

    postMessage(filterMessage(event.data));

  }

});

socket.addEventListener('close', function clear() {

  clearTimeout(this.pingTimeout);

});

/**
 * @param {string} data
 */
function filterMessage(data) {

  let out = data;

  const stdOut = 'stdout: ';
  const stdErr = 'stderr: ';
  const stdEnd = 'stdend: ';

  if (data.startsWith(stdOut)) {

    out = data.slice(stdOut.length, -1);

  } else if (data.startsWith(stdErr)) {

    out = data.slice(stdErr.length, -1);

  } else if (data.startsWith(stdEnd)) {

    out = data.slice(stdEnd.length, -1);

  }

  return out;

}

onmessage = function (e) {

  console.log(`Worker: Message received from main script - ${e.data}`);

  // const result = e.data[0] * e.data[1];

  // if (isNaN(result)) {

  //   postMessage('Please write two numbers');

  // } else {

  //   const workerResult = 'Result: ' + result;
  //   console.log('Worker: Posting message back to main script');

  //   postMessage(workerResult);

  // }

  if (e.data === 'MSG: SCAN') {

    socket.send('SCAN');

  }

};
