// ==UserScript==
// @name         Fetch Practice Track Video Links
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Fetches YouTube video links for all tracks of a given Musical page on musicalpracticetracks.com
// @author       You
// @match        https://www.musicalpracticetracks.com/index.php/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=musicalpracticetracks.com
// @grant        GM_getValue
// @grant        GM_setValue
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

function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

function removeAll(str, substrings) {
  let curr = str;
  for (sub of substrings) {
    curr = curr.replaceAll(sub, '');
  }
  return curr;
}

const pathName = window.location.pathname;
const subpage = pathName.substring(indexOfEnd(pathName, 'index.php/'));
const musicalId = subpage.split('/')[0];
const allMusicals = GM_getValue('musicals') || {};
if (!allMusicals[musicalId]) {
  allMusicals[musicalId] = [];
}
const musicalSongs = allMusicals[musicalId];
console.log(`songs of current musical (${musicalId})`, musicalSongs);

const songNoAndTitle = getTextContent('.entry-title');
const songNo = songNoAndTitle.substring(0, songNoAndTitle.indexOf('.'));
const songTitle = songNoAndTitle
  .substring(
    indexOfEnd(songNoAndTitle, songNo) + 1,
    songNoAndTitle.indexOf(' –') !== -1
      ? songNoAndTitle.indexOf(' –')
      : songNoAndTitle.length
  )
  .trim();
console.log(songTitle);

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

const trackLinks = new Map();

let videoPreviews = selectElements('.epyt-gallery-thumb');
let previewIter = videoPreviews.values();
previewIter.next().value; // iterator should actually start at second element - first is already handled by ytPlayerObs!

const vidPreviewContainer = document.querySelector('.epyt-gallery-list');

const vidPreviewContainerObs = new MutationObserver(() => {
  videoPreviews = selectElements('.epyt-gallery-thumb');
  previewIter = videoPreviews.values();
  // click next video (== first of next page)
  // -> will trigger MutationObserver once video changed
  // -> it will store the next video's data and handle/click through rest of the videos
  previewIter.next().value.click();
});

const ytPlayerObs = new MutationObserver((_, obs) => {
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
    const trackTitle = `${songNo}. ${title}`;
    const videoId = src.substring(indexOfEnd(src, '/embed/'), src.indexOf('?'));
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log('Found new track:', trackTitle, videoUrl);
    trackLinks.set(trackTitle, videoUrl);
    titleChanged = false;
    srcChanged = false;

    const iterResult = previewIter.next();

    if (!iterResult.done) {
      const nextPreview = iterResult.value;
      nextPreview.click(); // will cause this callback to retrigger once video player is loaded
    } else {
      const nextPageButton = document.querySelector('.epyt-next');
      if (
        nextPageButton &&
        getComputedStyle(nextPageButton).visibility !== 'hidden'
      ) {
        nextPageButton.click();
      } else {
        // done processing the page of this song!
        const titleHints = [
          'tenor',
          'soprano',
          'baritone',
          'bass',
          'alto',
          'choir',
          'women',
          'piano',
          'accompaniment',
          'practice',
          'track',
          'frollo',
          'quasimodo',
          'esmeralda',
        ];

        const tracks = Array.from(trackLinks).map(([rawTitle, url]) => {
          const title =
            rawTitle
              .split('-')
              .map(str => str.trim().toLowerCase())
              .find(str => {
                console.log(str);
                return titleHints.some(t => str.includes(t));
              }) || rawTitle.trim().toLowerCase();
          const partsToRemove = ['tracks', 'track', 'practice', '/rehearsal'];
          const shortTitle = removeAll(title, partsToRemove)
            .replace(/  +/g, ' ')
            .trim();
          const finalTitle = toTitleCase(shortTitle);
          const trackObj = {
            track: finalTitle,
            url,
          };
          console.log('adding track object', trackObj);
          return trackObj;
        });

        const songObj = { no: songNo, title: songTitle, tracks };

        console.log('song object (all tracks)', songObj);

        console.log('musical songs', musicalSongs);

        const songIdx = musicalSongs.findIndex(song => song.songNo === songNo);
        if (songIdx === -1) {
          musicalSongs.push(songObj);
          console.log('all musicals', allMusicals);
          GM_setValue('musicals', allMusicals);
        } else {
          alert(
            `Entry for song no. ${songNo} already exists in song array for '${musicalId}'!`
          );
        }

        if (nextSongLink) {
          nextSongLink.click();
        } else {
          alert('DONE');
          obs.disconnect();
          vidPreviewContainerObs.disconnect();
        }
      }
    }
  }
});

ytPlayerObs.observe(ytVideoPlayer, { attributes: true });
vidPreviewContainerObs.observe(vidPreviewContainer, {
  subtree: true,
  childList: true,
});
