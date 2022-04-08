// ==UserScript==
// @name         KeyboardEventInit extractor
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Extracts and logs the parameters to new KeyboardEvent() required to reproduce any given KeyboardEvent.
// @author       You
// @include      *
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM.setClipboard
// ==/UserScript==

// Usage note: Click button created by the script to activate the keyboard listener
// The KeyboardEventInit() params for each 'keydown' event on document.body are then copied to the clipboard
// click the button again to stop listening

function run() {
  const btnId = 'keyboardeventinit-extractor-btn';
  const btn = createButton('Listen for keystrokes', btnId);

  let listenerActive = false;

  btn.addEventListener('click', () => {
    if (!listenerActive) {
      document.body.addEventListener('keydown', handleKeyboardEvent, {
        capture: true,
      });
      btn.innerText = 'Stop listening';
    } else {
      document.body.removeEventListener('keydown', handleKeyboardEvent, {
        capture: true,
      });
      btn.innerText = 'Listen for keystrokes';
    }

    listenerActive = !listenerActive;
  });

  addStyle(`
    #${btnId} {
      position: fixed;
      top: 50px;
      right: 50px;
      z-index: 999;
      transition: 0.25s all;
      background: white;
      color: black;
      padding: 0.5em 1em;
      border: 1px solid black;
      border-radius: 5px;
    }

    #${btnId}:active {
      transform: scale(0.92);
      box-shadow: 3px 2px 22px 1px rgba(0, 0, 0, 0.24);
    }
  `);

  document.body.appendChild(btn);
}

function handleKeyboardEvent(ev) {
  const eventInitStr = eventInitAsString(ev);
  GM.setClipboard(eventInitStr);
  console.log('keydown detected, KeyboardEventInit:');
  console.log(eventInitStr);
}

function eventInitAsString(keyboardEvent) {
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
  } = keyboardEvent;

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

  let paramsAsString = '';

  paramsAsString = '{\n';
  for (prop in kbEventInitParams) {
    let propValue = kbEventInitParams[prop];
    if (typeof kbEventInitParams[prop] === 'string')
      propValue = `'${propValue}'`;
    paramsAsString += ` ${prop}: ${propValue},\n`;
  }
  paramsAsString += '}';

  return paramsAsString;
}

function createButton(text, id = null, className = null) {
  const btn = document.createElement('button');
  if (id) btn.id = id;
  if (className) btn.className = className;
  btn.innerText = text;
  btn.type = 'button';
  return btn;
}

function addStyle(CSSText) {
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(CSSText));
  document.querySelector('head').appendChild(style);
}

window.addEventListener('load', run, { once: true });
