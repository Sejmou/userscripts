// ==UserScript==
// @name         YouTube subtitle selector
// @namespace    http://tampermonkey.net/
// @version      0.3.4
// @description  Set YouTube subtitles to English automatically
// @author       Sejmou
// @match        https://www.youtube.com/watch*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @downloadURL  https://raw.githubusercontent.com/Sejmou/userscripts/master/youtube-subtitle-selector.js
// @updateURL    https://raw.githubusercontent.com/Sejmou/userscripts/master/youtube-subtitle-selector.js
// @grant        none
// ==/UserScript==
async function main() {
  await sleep(200);
  if (!window.location.href.includes('/watch')) return;
  const subtitleOptionSelector =
    '.ytp-menuitem:nth-of-type(3) .ytp-menuitem-content';
  const settingsButtonSelector = '.ytp-settings-button';

  document.querySelector(settingsButtonSelector).click();
  document.querySelector(subtitleOptionSelector).click();
  const englishOption = getElementByXpath(
    "//*[contains(@class, 'ytp-menuitem-label')][contains(text(),'English')]"
  );
  if (englishOption) {
    englishOption.click();
    document.querySelector(settingsButtonSelector).click();
    return;
  }

  // if we're here, need to select auto translate and open settings menu once more to reach the automatic subtitle selection
  getElementByXpath(
    "//*[contains(@class, 'ytp-menuitem-label')][contains(text(),'auto')]"
  ).click();
  document.querySelector(settingsButtonSelector).click();

  document.querySelector(settingsButtonSelector).click();
  document.querySelector(subtitleOptionSelector).click();
  document.querySelector('[role="menuitemradio"]:nth-of-type(3)').click();
  document.querySelector('[role="menuitemradio"]:nth-of-type(27)').click(); // 27th entry is English
  document.querySelector(settingsButtonSelector).click();

  setTimeout(() => {
    if (document.querySelector('.ytp-popup')) {
      document.querySelector(settingsButtonSelector).click();
    } else {
      alert();
    }
  }, 500);
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

function getElementByXpath(path) {
  return document.evaluate(
    path,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
}

let lastHref = document.location.href;
const body = document.querySelector('body');
const observer = new MutationObserver(mutations => {
  mutations.forEach(() => {
    if (lastHref !== document.location.href) {
      lastHref = document.location.href;
      main();
    }
  });
});
observer.observe(body, { childList: true, subtree: true });

main();
