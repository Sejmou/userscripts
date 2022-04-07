// ==UserScript==
// @name         DataCamp code editor shortcuts
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Adds keyboard shortcuts for use in DataCamp's R code editor + adds workaround for shortcuts overridden by Chrome shortcuts
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
  constructor(keyboardEventInit = {}) {
    Object.assign(this, keyboardEventInit);
  }

  equals(keyboardEvent) {
    return (
      this.code === keyboardEvent.code &&
      this.altKey === keyboardEvent.altKey &&
      this.ctrlKey === keyboardEvent.ctrlKey &&
      this.shiftKey === keyboardEvent.shiftKey
    );
  }
}

class CustomShortcut extends KeyCombination {
  constructor(config = {}) {
    super(config);
    this.output = config.output;
  }
}

// Some DataCamp shortcuts are extremely "smart", e.g. ctrl + j for going to previous lesson
// This shortcut doesn't work in Google Chrome as is, because per default, this opens the downloads
// A simple way to fix this would have been to add preventDefault() in the keydown event listener, but apparently DataCamp's developers forgot about that
// So, in essence this class just retriggers the key stroke
class ShortcutWorkaround extends KeyCombination {
  constructor(keyboardEventInit = {}) {
    super(keyboardEventInit);
    this.keyboardEvent = new KeyboardEvent('keydown', keyboardEventInit);
  }

  dispatchKeyboardEvent() {
    const activeElement = document.activeElement;
    document.body.focus();
    document.body.dispatchEvent(this.keyboardEvent);
    activeElement.focus();
  }
}

const shortcuts = [
  new CustomShortcut({ code: 'Slash', altKey: true, output: '<-' }),
  new CustomShortcut({ code: 'Period', altKey: true, output: '%>%' }),
];

const shortcutWorkarounds = [
  new ShortcutWorkaround({
    // Ctrl + J
    key: 'j',
    code: 'KeyJ',
    location: 0,
    ctrlKey: true,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    repeat: false,
    isComposing: false,
    charCode: 0,
    keyCode: 74,
    which: 74,
    detail: 0,
    bubbles: true,
    cancelable: true,
    composed: true,
  }),
  new ShortcutWorkaround({
    // Ctrl + K
    key: 'k',
    code: 'KeyK',
    location: 0,
    ctrlKey: true,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    repeat: false,
    isComposing: false,
    charCode: 0,
    keyCode: 75,
    which: 75,
    detail: 0,
    bubbles: true,
    cancelable: true,
    composed: true,
  }),
];

function getShortcutOutput(keyboardEvent) {
  return shortcuts.find(s => s.equals(keyboardEvent))?.output;
}

function getShortcutWorkaround(keyboardEvent) {
  return shortcutWorkarounds.find(s => s.equals(keyboardEvent));
}

const dispatchedEvents = [];

function run() {
  document.body.addEventListener(
    'keydown',
    ev => {
      if (!ev.isTrusted) {
        console.log('Manually created event');
        return;
      }

      const customShortcutOutput = getShortcutOutput(ev);
      if (customShortcutOutput) {
        GM.setClipboard(customShortcutOutput);
        return;
      }

      const shortcutWorkaround = getShortcutWorkaround(ev);
      console.log('workaround', shortcutWorkaround);
      if (shortcutWorkaround) {
        shortcutWorkaround.dispatchKeyboardEvent();
        ev.preventDefault();
      }
    },
    {
      capture: true, // should increase probability that event listener is triggered
    }
  );
}

window.addEventListener('load', run, { once: true });
