// ==UserScript==
// @name         Video Keyboard Controls
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

//config
const videoSkipTimeSeconds = 5;
const videoPlaybackRateChange = 0.25;



let video = document.querySelector('video');

// create a new instance of `MutationObserver` named `observer`,
// passing it a callback function
const observer = new MutationObserver((data) => {
    data.forEach(mutationRecord => {
        let addedNodes = mutationRecord.addedNodes;
        if (!addedNodes) return;
        addedNodes.forEach(node => {
            if (node.nodeName == 'VIDEO') {
                video = node;
            }
        });
    });
});

// call `observe()` on that MutationObserver instance,
// passing it the element to observe, and the options object
observer.observe(document.body, {subtree: true, childList: true});


document.addEventListener('keydown', function (event) {
    if (!video) return;

    if (event.key === ' ') {
        if (video.paused) video.play();
        else video.pause();
    }

    if (event.key === 'ArrowRight') {
        video.currentTime = Math.min(video.currentTime + videoSkipTimeSeconds, video.duration)
    }

    if (event.key === 'ArrowLeft') {
        video.currentTime = Math.max(video.currentTime - videoSkipTimeSeconds, 0)
    }

    if (event.key === '+') {
        video.playbackRate += 0.25; 
    }

    if (event.key === '-') {
        video.playbackRate = Math.max(0.25, video.playbackRate - 0.25); 
    }
});