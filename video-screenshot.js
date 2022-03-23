// ==UserScript==
// @name         Video Screenshot
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  Adds button that downloads a screenshot of the currently playing video as png
// @author       You
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM.setClipboard
// @downloadURL  https://raw.githubusercontent.com/Sejmou/userscripts/master/video-screenshot.js
// @updateURL    https://raw.githubusercontent.com/Sejmou/userscripts/master/video-screenshot.js
// ==/UserScript==

const video = document.querySelector('video');
const videos = [];

if (video) {
  //video element available right away
  addScreenshotButton(video);
} else {
  // listen to DOM changes, reacting accordingly if a video element is added
  let videoFound = false;

  const obs = new MutationObserver(mutations => {
    mutations.forEach(m => {
      const addedNodes = Array.from(m.addedNodes);
      if (!videoFound) {
        const video = addedNodes.find(n => findVideo(n));
        if (video) {
          if (!videos.find(v => v === video) && !(video.nodeName !== 'VIDEO')) {
            // it is possible that we find the same video twice
            // for some reason, sometimes also elements that aren't in fact videos are found
            // either this is an error on my side or the elements really change their nodeName!?
            videos.push(video);
            addScreenshotButton(video, videos);
          }
        }
      }
    });
  });

  obs.observe(document.body, { childList: true, subtree: true });
}

function findVideo(el) {
  if (el.nodeName === 'VIDEO') {
    return el;
  }
  return Array.from(el.childNodes).find(child => findVideo(child));
}

function addScreenshotButton(video) {
  if (video.nodeName !== 'VIDEO') {
    // for some reason, it is possible
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 1920;
  canvas.height = 1080;

  video.addEventListener('seeked', () => {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  });

  const btn = createButton();
  video.parentNode.appendChild(btn);
  btn.addEventListener('click', () => {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const link = document.createElement('a');
    link.download = 'filename.png';
    link.href = canvas.toDataURL();
    link.click();

    // TODO: add "copy to clipboard" functionality
    // Currently, the following doesn't seem to work due to security restrictions
    // For example, on DataCamp this causes the error: Uncaught (in promise) DOMException: The Clipboard API has been blocked because of a permissions policy applied to the current document. See https://goo.gl/EuHzyv for more details.
    // canvas.toBlob(blob => {
    //   const item = new ClipboardItem({ 'image/png': blob });
    //   navigator.clipboard.write([item]);
    // });
  });
}

function createButton() {
  const btn = document.createElement('button');
  const btnId = 'video-screenshot-btn';

  btn.id = btnId;
  addStyle(`
  #${btnId} {
    position: fixed;
    top: 20px;
    left: 50%;
    z-index: 2147483647 !important;/* make sure this button REALLY shows up */
    transition: 0.25s all;
    transform: translateX(-50%);
  }

  #${btnId}:active {
    transform: scale(0.92) translateX(-50%);
    box-shadow: 3px 2px 22px 1px rgba(0, 0, 0, 0.24);
  }
  `);

  btn.innerText = 'download screenshot';
  btn.type = 'button';

  return btn;
}

function addStyle(CSSText) {
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(CSSText));
  document.querySelector('head').appendChild(style);
}
