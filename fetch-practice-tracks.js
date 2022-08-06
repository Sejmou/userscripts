// ==UserScript==
// @name         Fetch Practice Track Video Links
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Fetches YouTube video links for all tracks of a given Musical page on musicalpracticetracks.com
// @author       You
// @match        https://www.musicalpracticetracks.com/index.php/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=musicalpracticetracks.com
// @grant        none
// ==/UserScript==

function selectElements(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

function getTextContent(selector) {
  return document.querySelector(selector).innerText;
}

function indexOfEnd(string, substring) {
  const io = string.indexOf(substring);
  return io == -1 ? -1 : io + substring.length;
}

const pathName = window.location.pathname;
const subpage = pathName.substring(indexOfEnd(pathName, 'index.php/'));
const musicalId = subpage.split('/')[0];

const songName = getTextContent('.entry-title');
const songNr = songName.substring(0, songName.indexOf('.'));

const ytPlayerWrapper = document.querySelector('.fluid-width-video-wrapper');
const ytVideoPlayer = ytPlayerWrapper.querySelector('iframe');

const navContainer = document.querySelector('.entry-content p strong');
const nextSongLink = navContainer.innerText.includes('Next:')
  ? selectElements('a', navContainer).at(-1)
  : null;

let videoSrc = '';
let videoTitle = '';
let srcChanged = false;
let titleChanged = false;

const trackVideos = new Map();

let videoPreviews = selectElements('.epyt-gallery-thumb');
let previewIter = videoPreviews.values();
previewIter.next().value; // iterator should actually start at second element - first is already handled by ytPlayerObs!

const ytPlayerObs = new MutationObserver(() => {
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
    } else {
      const nextPageButton = document.querySelector('.epyt-next');
      if (getComputedStyle(nextPageButton).visibility !== 'hidden') {
        nextPageButton.click();
      } else {
        // done processing the page of this song!

        if (nextSongLink) {
          nextSongLink.click();
        } else {
          alert('DONE');
        }
      }
    }
  }
});

const vidPreviewContainer = document.querySelector('.epyt-gallery-list');

const vidPreviewContainerObs = new MutationObserver(() => {
  videoPreviews = selectElements('.epyt-gallery-thumb');
  previewIter = videoPreviews.values();
  // click next video (== first of next page)
  // -> will trigger MutationObserver once video changed
  // -> it will store the next video's data and handle/click through rest of the videos
  previewIter.next().value.click();
});

ytPlayerObs.observe(ytVideoPlayer, { attributes: true });
vidPreviewContainerObs.observe(vidPreviewContainer, {
  subtree: true,
  childList: true,
});
