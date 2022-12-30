// ==UserScript==
// @name         YouTube subtitle selector
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Replace the commit timestamps on the 'commits' subpage of any repo with local time
// @author       Sejmou
// @match        https://www.youtube.com/watch*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @downloadURL  https://raw.githubusercontent.com/Sejmou/userscripts/master/youtube-subtitle-selector.js
// @updateURL    https://raw.githubusercontent.com/Sejmou/userscripts/master/youtube-subtitle-selector.js
// @grant        none
// ==/UserScript==
async function main() {
  // navigate to https://www.youtube.com/account_playback "Include auto-generated captions (when available)", then the following should work to auto-activate generated English subtitles
  if (!window.location.href.includes('/watch')) return;
  document.querySelector('.ytp-settings-button').click();
  await sleep(100);
  document
    .querySelector(
      '[role="menuitemradio"]:nth-of-type(3) .ytp-menuitem-content'
    )
    .click();
  await sleep(100);
  document.querySelector('.ytp-settings-button').click();
  await sleep(100);

  document.querySelector('.ytp-settings-button').click();
  await sleep(100);
  document
    .querySelector('.ytp-menuitem:nth-of-type(3) .ytp-menuitem-content')
    .click();
  await sleep(100);
  document.querySelector('[role="menuitemradio"]:nth-of-type(3)').click();
  await sleep(100);
  document.querySelector('[role="menuitemradio"]:nth-of-type(27)').click(); // 27th entry is English
  await sleep(100);
  document.querySelector('.ytp-settings-button').click();
  await sleep(100);
}

function dispatchKeyboardEvent(kbEvtInit) {
  const keyboardEvent = new KeyboardEvent('keydown', kbEvtInit);

  const activeElement = document.activeElement;
  document.body.focus();
  document.body.dispatchEvent(keyboardEvent);
  activeElement.focus();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

setTimeout(main, 2000);
