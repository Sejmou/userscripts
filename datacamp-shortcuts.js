// ==UserScript==
// @name         DataCamp code editor shortcuts
// @namespace    http://tampermonkey.net/
// @version      0.7.1
// @description  Adds keyboard shortcuts for use in DataCamp's R code editor + adds workaround for shortcuts overridden by Chrome shortcuts
// @author       You
// @include      *.datacamp.com*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=datacamp.com
// @grant        GM.setClipboard
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM.addValueChangeListener
// ==/UserScript==

// Two types of shortcuts are supported by this script:
// 1. EditorTypingShortcuts: Paste any given string to the clipboard
//      Usage: press shortcut for required symbol, it will then be pasted to your clipboard and you just have to do ctrl + v to insert the symbol
//      Unfortunately, direct pasting from the script is not possible due to security restrictions on the JavaScript Clipboard API :/
//
// 2. ShortcutWorkaround: They essentially make DataCamp's built-in shortcuts work (for details see comments in/above class)

// There may be a smarter way to store key combinations and shortcuts; If you know one, let me know lol
class KeyCombination {
  constructor(keyboardEventInit) {
    // set defaults
    this.altKey = false;
    this.ctrlKey = false;
    this.shiftKey = false;
    this.metaKey = false;
    // override with values defined in keyboardEventInit
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
  constructor(kbComboKbEvtInit, dispatchedKbEvtInit = null) {
    if (new.target === KeyboardShortcut) {
      throw new TypeError(
        'KeyboardShortcut class is abstract, cannot instantiate directly!'
      );
    }
    this.keyCombination = new KeyCombination(kbComboKbEvtInit);
    if (dispatchedKbEvtInit)
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

// allows running an arbitrary function by pressing a shortcut
class FunctionShortcut extends KeyboardShortcut {
  constructor(kbEvtInit, fn) {
    super(kbEvtInit);
    this.fn = fn;
  }

  apply() {
    this.fn();
  }
}

// Stores a collection of KeyboardShortcuts; can be used to find and apply shortcuts
class KeyboardShortcuts {
  // shortcuts should be an array of KeyboardShortcut objects
  // TODO: add logic for checking if multiple shortcuts listen for same KeyCombination
  constructor(shortcuts) {
    this.shortcuts = shortcuts;
  }

  // applies a shortcut if it matches
  // TODO: think about whether multiple shortcut bindings for same keyboard combination should be allowed
  // If yes, current solution wouldn't work
  applyMatching(keyboardEvent) {
    return this.shortcuts.find(s => s.handle(keyboardEvent));
  }

  // TODO: add logic for checking if keybinding for KeyCombination of shortcut already exists
  add(shortcut) {
    this.shortcuts.push(shortcut);
  }
}

// Some DataCamp shortcuts are not "well-chosen", e.g. ctrl + j for going to previous lesson
// This shortcut doesn't work in Google Chrome as is, because per default, this opens the downloads
// A simple way to fix this would have been to add preventDefault() in the keydown event listener, but apparently DataCamp's developers forgot about that
// In essence, this class just retriggers the key combination provided via keyBoardEventInit on document.body
class ShortcutWorkaround extends KeyboardShortcut {
  constructor(origKbEvtInit, remapKbEvtInit = null) {
    if (!remapKbEvtInit) {
      // both the handled and dispatched KeyboardEvent are practically the same
      super(origKbEvtInit, origKbEvtInit);
    } else {
      // We want to trigger different KeyboardEvent when user hits key combination -> remap
      super(origKbEvtInit, remapKbEvtInit);
    }
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

function createShortcuts() {
  // Feel free to add more
  return new KeyboardShortcuts([
    new EditorTypingShortcut({ code: 'Slash', altKey: true }, '<-'),
    new EditorTypingShortcut({ code: 'Period', altKey: true }, '%>%'),
    new EditorTypingShortcut({ code: 'KeyI', altKey: true }, '%in%'),
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
    new ShortcutWorkaround({
      key: 'o',
      code: 'KeyO',
      location: 0,
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      repeat: false,
      isComposing: false,
      charCode: 0,
      keyCode: 79,
      which: 79,
      detail: 0,
      bubbles: true,
      cancelable: true,
      composed: true,
    }),
    new ShortcutWorkaround(
      // Hitting Enter at end of exercise never works (despite message being shown)
      {
        code: 'Enter',
        altKey: true,
      },
      () => {
        document.querySelector('.dc-completed__continue button')?.click();
      }
    ),
    // TODO: maybe add class for shortcuts that only apply to certain page?
    // Note: Would probably require change in KeyboardShortcuts (applyMatching()!), too
    new FunctionShortcut(
      {
        key: 'Escape',
        code: 'Escape',
        location: 0,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        repeat: false,
        isComposing: false,
        charCode: 0,
        keyCode: 27,
        which: 27,
        detail: 0,
        bubbles: true,
        cancelable: true,
        composed: true,
      },
      () => {
        const currentPage = getCurrentPage();
        if (currentPage === 'video-iframe') {
          document.activeElement.blur();
          ScriptMessaging.notify(notificationIds.escKeyPressFromVideoIframe);
        } else {
          // closes modal that opens after hitting Ctrl + O (in case it is open)
          document.querySelector('.modal-overlay')?.click();
        }
      }
    ),
    new FunctionShortcut(
      {
        key: 'f',
        code: 'KeyF',
        location: 0,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        repeat: false,
        isComposing: false,
        charCode: 0,
        keyCode: 70,
        which: 70,
        detail: 0,
        bubbles: true,
        cancelable: true,
        composed: true,
      },
      () => {
        if (getCurrentPage() === 'video-page') {
          const videoIframeWindow = document.querySelector(
            'iframe[title*="video"]'
          )?.contentWindow; // contentWindow of iframe video is running in
          videoIframeWindow?.focus();

          // notify script instance running in iframe that it should focus the video player
          ScriptMessaging.notify(notificationIds.fKeyPressFromVideoPage);
        }
      }
    ),
  ]);
}

// The following class tries to mimick Window.postMessage(), but for use with GM script instances
// See also https://stackoverflow.com/a/47880285/13727176 and https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
class ScriptMessaging {
  static #LAST_MESSAGE_SUFFIX = '_last-message-sent-at';
  static #LAST_VALUE_CHANGE_SUFFIX = '_last-value-change-at';
  static trackedMessageLabels = new Set(); // populated with message labels as messages are sent

  static onMessage(label, callback, onlyIfMsgChanged = true) {
    if (onlyIfMsgChanged) {
      GM.addValueChangeListener(label, (label, oldValue, newValue) =>
        callback(newValue)
      );
    } else {
      const lastMessageLabel = label + this.#LAST_MESSAGE_SUFFIX;
      GM.addValueChangeListener(lastMessageLabel, async () =>
        callback(await GM.getValue(label))
      );
    }
  }

  static sendMessage(label, content) {
    GM.setValue(label, content);

    const lastChangeLabel = label + this.#LAST_VALUE_CHANGE_SUFFIX;
    const lastMessageLabel = label + this.#LAST_MESSAGE_SUFFIX;
    if (!this.trackedMessageLabels.has(label)) {
      this.trackedMessageLabels.add(label);
      GM.addValueChangeListener(label, () => {
        GM.setValue(lastChangeLabel, Date.now());
      });
    }
    GM.setValue(lastMessageLabel, Date.now());
  }

  static notify(notificationId) {
    this.sendMessage(notificationId, Math.random());
  }

  static onNotify(notificationId, callback) {
    GM.addValueChangeListener(notificationId, callback);
  }
}

const notificationIds = {
  fKeyPressFromVideoPage: 'f-key-video-page',
  escKeyPressFromVideoIframe: 'esc-key-video-iframe',
};

function run() {
  const shortcuts = createShortcuts();
  const currentPage = getCurrentPage();

  if (currentPage === 'video-iframe') {
    const videoPlayer = document.activeElement;
    ScriptMessaging.onNotify(notificationIds.fKeyPressFromVideoPage, () =>
      videoPlayer.focus()
    );
  } else {
    ScriptMessaging.onNotify(notificationIds.escKeyPressFromVideoIframe, () => {
      // remove focus for video in iframe -> focus is back in main document
      // regular DataCamp keyboard shortcuts work again
      document.activeElement.blur();
    });
  }

  document.body.addEventListener(
    'keydown',
    ev => {
      if (!ev.isTrusted) {
        // we're dealing with a manually created event -> probably one we dispatched ourselves!
        return;
      }
      shortcuts.applyMatching(ev);
    },
    {
      capture: true, // should increase probability that event listener is triggered
    }
  );
}

function getCurrentPage() {
  if (document.querySelector('.slides')) {
    return 'video-iframe'; // inside video iframe
  } else if (
    // only true if video already loaded, while video is still loading, this is not available
    document.querySelector('[data-cy*="video-exercise"]')
  ) {
    return 'video-page';
  } else {
    return 'other';
  }
}

window.addEventListener('load', run, { once: true });
