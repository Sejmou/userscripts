// ==UserScript==
// @name         DataCamp code editor shortcuts
// @namespace    http://tampermonkey.net/
// @version      0.3
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

// There may be a smarter way to store key combinations and shortcuts; If you know one, let me know lol
class KeyCombination {
  constructor(keyboardEventInit = {}) {
    Object.assign(this, keyboardEventInit);
  }

  matches(keyboardEvent) {
    for (const [prop, value] of Object.entries(this)) {
      if (keyboardEvent[prop] !== value) {
        return false;
      }
    }

    return true;
  }
}

class KeyboardShortcut {
  // should emulate an abstract base class: https://stackoverflow.com/a/30560792/13727176

  // accept two different KeyboardEventInit objects as input, each serving different purpose:
  // 1. for creating the KeyCombination instance that is used for detecting whether a given key combination (KeyboardEvent) should be handled by the shortcut
  // 2. for setting up the keyboard event(s) that should be triggered by the shortcut
  constructor(kbComboKbEvtInit, dispatchedKbEvtInit) {
    if (new.target === KeyboardShortcut) {
      throw new TypeError(
        'KeyboardShortcut class is abstract, cannot instantiate directly!'
      );
    }
    this.keyCombination = new KeyCombination(kbComboKbEvtInit);
    this.keyboardEvent = new KeyboardEvent('keydown', dispatchedKbEvtInit);
  }

  handle(keyboardEvent) {
    if (this.keyCombination.matches(keyboardEvent)) {
      this.handleMatchingKeyboardEvent(keyboardEvent);
      this.apply();
      return true;
    }
    return false;
  }

  handleMatchingKeyboardEvent(keyboardEvent) {
    // for some types of shortcuts, the keyboardEvent that caused the shortcut to trigger might be relevant
  }

  apply() {
    throw new TypeError(
      'Cannot call apply() on KeyboardShortcut - abstract! Implement in subclass!'
    );
  }
}

class EditorTypingShortcut extends KeyboardShortcut {
  constructor(assignedShortCutKbEvtInit, outputStr) {
    super(
      // defines the keyboard event we want to listen for
      assignedShortCutKbEvtInit,
      // defines the keyboard event this type of shortcut should trigger
      {
        // Shift + Insert -> should trigger editor paste! Before pasting, we copy to clipboard (at least that's the idea)
        key: 'Insert',
        code: 'Insert',
        location: 0,
        ctrlKey: false,
        shiftKey: true,
        altKey: false,
        metaKey: false,
        repeat: false,
        isComposing: false,
        charCode: 0,
        keyCode: 45,
        which: 45,
        detail: 0,
        bubbles: true,
        cancelable: true,
        composed: true,
      }
    );

    this.outputStr = outputStr;
  }

  apply() {
    const activeElement = document.activeElement;
    activeElement.focus();
    GM.setClipboard(this.outputStr);

    // this dispatches Shift + Insert keydown event on activeElement
    // if it is the editor, this.outputStr should be pasted -> currently doesn't work, though :/
    // the isTrusted property of the manually created keyboard Event could be the issue
    //  if the Monaco code editor checks for this prop, there's not much we can do I guess :/
    activeElement.dispatchEvent(this.keyboardEvent);
  }
}

// Some DataCamp shortcuts are not "well-chosen", e.g. ctrl + j for going to previous lesson
// This shortcut doesn't work in Google Chrome as is, because per default, this opens the downloads
// A simple way to fix this would have been to add preventDefault() in the keydown event listener, but apparently DataCamp's developers forgot about that
// In essence, this class just retriggers the key combination provided via keyBoardEventInit on document.body
class ShortcutWorkaround extends KeyboardShortcut {
  constructor(keyboardEventInit) {
    super(keyboardEventInit, keyboardEventInit); // both the handled and dispatched keyboardEvent are practically the same lol
  }

  apply() {
    const activeElement = document.activeElement;
    document.body.focus();
    document.body.dispatchEvent(this.keyboardEvent);
    activeElement.focus();
  }

  handleMatchingKeyboardEvent(keyboardEvent) {
    keyboardEvent.preventDefault();
  }
}

const shortcuts = [
  new EditorTypingShortcut({ code: 'Slash', altKey: true }, '<-'),
  new EditorTypingShortcut({ code: 'Period', altKey: true }, '%>%'),
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

function applyKeyboardShortcutIfMatching(keyboardEvent) {
  return shortcuts.find(s => s.handle(keyboardEvent));
}

const dispatchedEvents = [];

function run() {
  document.body.addEventListener(
    'keydown',
    ev => {
      if (!ev.isTrusted) {
        // we're dealing with a manually created event -> probably one we dispatched ourselves!
        return;
      }

      applyKeyboardShortcutIfMatching(ev);
    },
    {
      capture: true, // should increase probability that event listener is triggered
    }
  );
}

window.addEventListener('load', run, { once: true });
