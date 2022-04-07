// ==UserScript==
// @name         DataCamp code editor shortcuts
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Adds keyboard shortcuts for use in DataCamp's R code editor
// @author       You
// @include      *campus.datacamp.com*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=datacamp.com
// @grant        GM.setClipboard
// ==/UserScript==

// Usage: press shortcut for required symbol, it will then be pasted to your clipboard and you just have to do ctrl + v to insert the symbol
// Unfortunately, direct pasting from the script is not possible due to security restrictions on the JavaScript Clipboard API :/
// I even tried to dispatch KeyboardEvents, but they seem to be ignored (at least by the Monaco Editor used on DataCamp)
// This is most probably due to the isTrusted prop being false for KeyboardEvents generated from scripts (the property can only be true for user-generated actions)
// Possible alternative: Writing a Python script and using something like PyAutoGUI; Python has lower-level system access, contrary to browser

// There must be a smarter way to store key combinations and shortcuts, haven't found one yet, though :/
class KeyCombination {
  constructor(config = {}) {
    this.code = config.code;
    this.altKey = config.altKey;
  }

  equals(other) {
    return this.code === other.code && this.altKey === other.altKey;
  }
}

class ShortcutKeyCombination extends KeyCombination {
  constructor(config = {}) {
    super(config);
    this.output = config.output;
  }
}

const shortcuts = [
  new ShortcutKeyCombination({ code: 'Slash', altKey: true, output: '<-' }),
  new ShortcutKeyCombination({ code: 'Period', altKey: true, output: '%>%' }),
];

function getShortcutOutput(keyboardEvent) {
  return shortcuts.find(s => s.equals(new KeyCombination(keyboardEvent)))
    ?.output;
}

function run() {
  document.body.addEventListener(
    'keydown',
    ev => {
      const output = getShortcutOutput(ev);

      if (output) {
        GM.setClipboard(output);
      }
    },
    {
      capture: true, // should increase probability that event listener is triggered
    }
  );
  // my attempts at triggering a key press for the "A" key via script -> didn't work as explained above :/
  // setTimeout(() => {
  //   console.log('dispatching...');
  //
  //   const aKeyPressDict = {
  //     key: 'a',
  //     code: 'KeyA',
  //     location: 0,
  //     ctrlKey: false,
  //     shiftKey: false,
  //     altKey: false,
  //     metaKey: false,
  //     repeat: false,
  //     isComposing: false,
  //     charCode: 0,
  //     keyCode: 65,
  //     which: 65,
  //     detail: 0,
  //     bubbles: true,
  //     cancelable: true,
  //     composed: true,
  //   };
  //   const input = document.querySelector('.inputarea.monaco-mouse-cursor-text');
  //   dispatchKeyboardEvent(aKeyPressDict, 'keydown', input);
  //   dispatchKeyboardEvent(aKeyPressDict, 'keypress', input);
  //   dispatchKeyboardEvent(aKeyPressDict, 'keyup', input);
  //   dispatchKeyboardEvent(aKeyPressDict, 'keydown');
  //   dispatchKeyboardEvent(aKeyPressDict, 'keypress');
  //   dispatchKeyboardEvent(aKeyPressDict, 'keyup');
  // }, 3000);
}

// unfortunately doesn't seem to work :/
function dispatchKeyboardEvent(
  keyboardEventInit,
  type = 'keydown',
  target = document.body
) {
  target.dispatchEvent(new KeyboardEvent(type, keyboardEventInit));
}

window.addEventListener('load', run, { once: true });
