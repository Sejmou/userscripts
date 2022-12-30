// ==UserScript==
// @name         YouTube subtitle selector
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Replace the commit timestamps on the 'commits' subpage of any repo with local time
// @author       Sejmou
// @match        https://www.youtube.com/watch/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==
dispatchKeyboardEvent({ key: 'c' });
document.querySelector('.ytp-settings-button').click();
document
  .querySelector('.ytp-menuitem:nth-of-type(3) .ytp-menuitem-content')
  .click();
document.querySelector('[role="menuitemradio"]:nth-of-type(3)').click();
document.querySelector('[role="menuitemradio"]:nth-of-type(27)').click(); // 27th entry is English

function dispatchKeyboardEvent(kbEvtInit) {
  const keyboardEvent = new KeyboardEvent('keydown', kbEvtInit);

  const activeElement = document.activeElement;
  document.body.focus();
  document.body.dispatchEvent(keyboardEvent);
  activeElement.focus();
}
