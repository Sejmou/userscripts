// ==UserScript==
// @name         Local Time Commits
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Replace the commit timestamps on the 'commits' subpage of any repo with local time
// @author       Sejmou
// @match        https://github.com/*/*/commits/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

function convertToLocalTime(relativeTimeEl) {
  const el = relativeTimeEl;
  el.innerText = new Date(el.getAttribute('datetime')).toLocaleString('de-AT');
  el.previousSibling.nodeValue = ' ';
}

const htmlObs = new MutationObserver(recs => {
  recs.forEach(rec => {
    rec.addedNodes.forEach(n => {
      if (n.nodeName === 'BODY') {
        handleRelTimeEls();
      }
    });
  });
});

htmlObs.observe(document.querySelector('html'), { childList: true });

const obs = new MutationObserver(recs =>
  recs.forEach(rec => {
    convertToLocalTime(rec.target);
  })
);

function handleRelTimeEls() {
  obs.disconnect(); // stop listening to any previous elements
  const relTimeEls = document.querySelectorAll('relative-time');
  relTimeEls.forEach(convertToLocalTime);
  for (const el of relTimeEls) {
    obs.observe(el, { childList: true });
  }
}

handleRelTimeEls();
