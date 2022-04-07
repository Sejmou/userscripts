// ==UserScript==
// @name         KeyboardEventInit params extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Extracts and logs the parameters to new KeyboardEvent() required to reproduce any given KeyboardEvent.
// @author       You
// @include      *
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// ==/UserScript==

// Usage note: The KeyboardEventInit() params for each 'keydown' event on document.body are logged in the console
// Just open up the browser devtools and copy-paste into your code editor :)

let paramsAsString = '';

document.body.addEventListener(
  'keydown',
  ev => {
    const {
      // KeyboardEventInit params
      key,
      code,
      location,
      ctrlKey,
      shiftKey,
      altKey,
      metaKey,
      repeat,
      isComposing,
      charCode,
      keyCode,
      which,
      //UIEventInit params; also accepted by KeyBoardEvent constructor
      detail,
      //view, // object; not sure how to copy cleanly, better leaving out for now
      //sourceCapabilities, // object; not sure how to copy cleanly, better leaving out for now
      //EventInit params; also accepted by KeyBoardEvent constructor
      bubbles,
      cancelable,
      composed,
    } = ev;
    const kbEventInitParams = {
      key,
      code,
      location,
      ctrlKey,
      shiftKey,
      altKey,
      metaKey,
      repeat,
      isComposing,
      charCode,
      keyCode,
      which,
      detail,
      //view,
      //sourceCapabilities,
      bubbles,
      cancelable,
      composed,
    };

    console.log(ev);

    paramsAsString = '{\n';
    for (prop in kbEventInitParams) {
      let propValue = kbEventInitParams[prop];
      if (typeof kbEventInitParams[prop] === 'string')
        propValue = `'${propValue}'`;
      paramsAsString += ` ${prop}: ${propValue},\n`;
    }
    paramsAsString += '}';

    console.log(paramsAsString);
  },
  { capture: true }
);
