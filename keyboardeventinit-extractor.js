// ==UserScript==
// @name         KeyboardEventInit extractor
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Extracts and logs the parameters to new KeyboardEvent() required to reproduce any given KeyboardEvent.
// @author       You
// @include      *
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM.setClipboard
// ==/UserScript==

// Usage: Click button created by the script to activate the keyboard listener
// The KeyboardEventInit() params for each 'keydown' event on document.body are then copied to the clipboard
// click the button again to stop listening
// while listening, the KeyboardEventInit required to reproduce each keystroke is also logged to the console
// Note that one cannot completely reproduce KeyboardEvents using newKeyboardEvent(type, keyboardEventInit), as the isTrusted property is often important
// One cannot set this manually, only real key strokes have this property set to true

function run() {
  const controlsContainer = document.createElement('div');
  const controlsContainerId = 'keyboardeventinit-extractor-controls';
  controlsContainer.id = controlsContainerId;

  const btnId = 'keyboardeventinit-extractor-btn';
  const btn = createButton('Listen for keystrokes', btnId);

  document.body.appendChild(btn);

  const evtTypes = ['keydown', 'keypress', 'keyup'];
  const checkboxContainerClass = 'keyboardeventinint-checkbox-container';
  const checkboxContainers = evtTypes.map(evtType => {
    const checkboxContainer = createCheckbox(evtType);
    if (evtType === 'keydown') {
      checkboxContainer.querySelector('input').checked = true;
    }
    checkboxContainer.className = checkboxContainerClass;
    return checkboxContainer;
  });

  let listenersActive = false;

  const updateKeyboardListeners = () => {
    checkboxContainers.forEach((cc, i) => {
      const evtType = evtTypes[i];
      if (cc.querySelector('input').checked) {
        document.addEventListener(evtType, handleKeyboardEvent, {
          capture: true,
        });
      } else {
        document.removeEventListener(evtType, handleKeyboardEvent, {
          capture: true,
        });
      }
    });
  };

  const toggleListening = () => {
    listenersActive = !listenersActive;

    btn.innerText = listenersActive
      ? 'Stop listening'
      : 'Listen for keystrokes';

    updateKeyboardListeners();
  };

  btn.addEventListener('click', toggleListening);
  checkboxContainers.forEach(c =>
    c.addEventListener('change', updateKeyboardListeners)
  );

  checkboxContainers.forEach(c => controlsContainer.appendChild(c));
  controlsContainer.appendChild(btn);
  document.body.appendChild(controlsContainer);

  addStyle(`
    #${controlsContainerId} {
      color: black; 
      background-color: white;
      position: fixed;
      top: 52px;
      right: 50px;
      z-index: 999;
      display: grid; 
      grid-template-columns: 1fr 2fr; 
      grid-template-rows: 1fr 1fr 1fr;
      grid-template-areas: 
        ". button"
        ". button"
        ". button";
      gap: 0 1em;
      padding: 1em;
      border: 1px solid grey;
    }

    #${btnId} {
      transition: 0.25s all;
      background: white;
      color: black;
      padding: 0.5em 1em;
      border: 1px solid black;
      border-radius: 5px;
      grid-area: button;
      width: 100%;
      height: min-content;
      align-self: center;
      justify-self: center;
    }

    #${btnId}:active {
      transform: scale(0.92);
      box-shadow: 3px 2px 22px 1px rgba(0, 0, 0, 0.24);
    }
  
    .${checkboxContainerClass}:hover, .${checkboxContainerClass} *:hover {
      cursor: pointer;
    }

    .${checkboxContainerClass} {
      display: flex;
      justify-content: flex-start;
      height: 30px;
      align-items: center;
      gap: 10px;
    }
  `);
}

function handleKeyboardEvent(ev) {
  const eventInitStr = eventInitAsString(ev);
  GM.setClipboard(eventInitStr);
  console.log(ev.type, 'detected, KeyboardEventInit:');
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

function createCheckbox(labelText) {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.name = labelText;
  checkbox.id = labelText;

  const label = document.createElement('label');
  label.htmlFor = labelText;
  label.appendChild(document.createTextNode(labelText));

  const container = document.createElement('div');

  container.appendChild(checkbox);
  container.appendChild(label);

  return container;
}

function addStyle(CSSText) {
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(CSSText));
  document.querySelector('head').appendChild(style);
}

window.addEventListener('load', run, { once: true });
