((global, container) => {

  const ansi_up = new AnsiUp();

  container.myWorker = null;
  container.observer = null;

  document.addEventListener('DOMContentLoaded', (event) => {

    registerWebWorker();

    document.querySelector('#scan')?.addEventListener('click', () => {

      document.querySelector('#download').disabled = true;

      document.querySelector('#console').innerHTML = '';

      container.myWorker.postMessage('MSG: SCAN');

    });

    document.querySelector('#download')?.addEventListener('click', async (e) => {

      e.preventDefault();

      await downloadFile('scan');

    });

    lookoutForMutation(document.querySelector('#console'), { childList: true });

  });

  global.onbeforeunload = () => {

    console.log('Removing observer');

    // Later, you can stop observing
    container.observer.disconnect();

  };

  function registerWebWorker() {

    if (window.Worker) {

      container.myWorker = new Worker('./modules/websocket.js');

      container.myWorker.onmessage = function (e) {

        const data = e.data;

        console.log(`Message received from worker - ${data}`);

        if (data === 'Enable download') {

          console.log('Enable download');

          document.querySelector('#download').disabled = false;

        } else {

          createAndAppendLineOutput(data);

        }

      };

    } else {

      console.error('WebWorker not supported. Fallback for WebSocket is not impemented yet!');

    }

  }

  /**
   * @param {string} data
   */
  function createAndAppendLineOutput(data) {

    if (data.includes('Reading data: ') || data.includes('Starting scan for ')) {

      let lineElem = null;

      if (data.includes('Reading data: ')) {

        lineElem = createUpdateLineOutputElem(data, 'reading');

      } else if (data.includes('Starting scan for ')) {

        lineElem = createUpdateLineOutputElem(data, 'starting');

      }

      if (lineElem) {

        appendInsideElement(global.document.querySelector('.output .console'), lineElem);

      }

    } else {

      const lineElem = createLineOutputElem(data);

      appendInsideElement(global.document.querySelector('.output .console'), lineElem);

    }

  }

  function createLineOutputElem(textContent) {

    const lineDivElem = global.document.createElement('div');
    // const textNode = global.document.createTextNode(textContent);

    // lineDivElem.append(textNode);

    lineDivElem.innerHTML = ansi_up.ansi_to_html(textContent);

    lineDivElem.classList.add('line');

    return lineDivElem;

  }

  function createUpdateLineOutputElem(textContent, className) {

    let lineDivElem = null;
    lineDivElem = document.querySelector(`div.line.${className}`);

    if (lineDivElem === null) {

      lineDivElem = global.document.createElement('div');
      lineDivElem.classList.add('line', className);

      lineDivElem.innerHTML = ansi_up.ansi_to_html(textContent);

      return lineDivElem;

    } else {

      lineDivElem.innerHTML = ansi_up.ansi_to_html(textContent);

    }

  }

  function appendInsideElement(parent, child) {

    parent.append(child);

  }

  function lookoutForMutation(targetNode, config = {
    attributes: true, childList: true, subtree: true
  }) {

    // Callback function to execute when mutations are observed
    const callback = (mutationList, observer) => {

      for (const mutation of mutationList) {

        if (mutation.type === 'childList') {

          // console.log('A child node has been added or removed.');

          // console.log(mutation.target);
          mutation.target.scrollTop = mutation.target.scrollHeight;

        } else if (mutation.type === 'attributes') {

          // console.log(`The ${mutation.attributeName} attribute was modified.`);

        }

      }

    };

    // Create an observer instance linked to the callback function
    container.observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    container.observer.observe(targetNode, config);

  }

  async function downloadFile(fileName) {

    const response = await fetch('/download');

    const blob = await response.blob();

    const aElement = global.document.createElement('a');
    aElement.setAttribute('download', fileName);

    const href = URL.createObjectURL(blob);
    aElement.href = href;
    // aElement.setAttribute('href', href);
    aElement.setAttribute('target', '_blank');
    aElement.click();
    URL.revokeObjectURL(href);

  }

})(window, window.myData = window.myData ?? {});
