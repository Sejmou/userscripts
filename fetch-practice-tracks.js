// ==UserScript==
// @name         Fetch Practice Track Video Links
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Fetches YouTube video links for all tracks of a given song page on musicalpracticetracks.com
// @author       You
// @match        https://www.musicalpracticetracks.com/index.php/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=musicalpracticetracks.com
// @grant        none
// ==/UserScript==

function selectElements(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function selectElement(selector) {
  return document.querySelector(selector);
}

function getTextContent(selector) {
  return selectElement(selector).innerText;
}

function indexOfEnd(string, substring) {
  const io = string.indexOf(substring);
  return io == -1 ? -1 : io + substring.length;
}

const songName = getTextContent('.entry-title');
const songNr = songName.substring(0, songName.indexOf('.'));
const videoPreviews = selectElements('.epyt-gallery-thumb');
console.log(videoPreviews);
const hasPagination = false; //TODO: detect and handle pagination

const ytPlayerWrapper = document.querySelector('.fluid-width-video-wrapper');
const ytVideoPlayer = ytPlayerWrapper.querySelector('iframe');

let videoSrc = '';
let videoTitle = '';
let srcChanged = false;
let titleChanged = false;

const trackVideos = new Map();

const previewIter = videoPreviews.values();
previewIter.next().value; // iterator should actually start at second element - first is already handled by MutationObserver!

const obs = new MutationObserver(() => {
  const { title, src } = ytVideoPlayer;
  if (videoSrc !== src) {
    videoSrc = src;
    srcChanged = true;
  }
  if (videoTitle !== title) {
    videoTitle = title;
    titleChanged = true;
  }
  if (titleChanged && srcChanged) {
    const trackTitle = `${songNr}. ${title}`;
    const videoId = src.substring(indexOfEnd(src, '/embed/'), src.indexOf('?'));
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log('Found new track:', trackTitle, videoUrl);
    trackVideos.set(trackTitle, videoUrl);
    titleChanged = false;
    srcChanged = false;

    const iterResult = previewIter.next();

    if (!iterResult.done) {
      const nextPreview = iterResult.value;
      nextPreview.click(); // will cause this callback to retrigger once video player is loaded
    }
  }
});

obs.observe(ytVideoPlayer, { attributes: true });
