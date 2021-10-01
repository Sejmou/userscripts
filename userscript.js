// ==UserScript==
// @name         oeticket event bookmarker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Samo Kolter
// @match        https://www.oeticket.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// ==/UserScript==

'use strict';

//if true, automatically adds the event to the bookmarks as soon as its page loads
const autoAdd = true;



const eventsLabel = 'events';
const eventsArr = JSON.parse(GM_getValue(eventsLabel)) || [];

console.log('eventsArr', eventsArr);
console.log('mapped key value pairs', eventsArr.map(evObj => [evObj.id, evObj]));
const eventsKeyValuePairs = eventsArr.map(event => [event.id, event]);
const eventsMap = new Map(eventsKeyValuePairs);

const artistName = document.querySelector('.stage-headline')?.innerText;
const date = document.querySelector('time')?.innerText;
const venueEl = document.querySelector('a[href="#venueInformation"]');
const venue = venueEl?.innerText;

const eventURLStr = 'https://www.oeticket.com/event/';
const url = window.location.href;
const onEventURL = window.location.href.indexOf(eventURLStr) === 0;
const urlAfterEventURL = url.substring(eventURLStr.length);
const eventId = onEventURL? urlAfterEventURL.substring(0, urlAfterEventURL.indexOf('/')) : undefined;

const eventLink = eventId ? `${eventURLStr}${eventId}/` : undefined;
const address = document.querySelector('.venue-address p')?.innerText.split('\n')[0].trim();
const mapsLink = document.querySelector('.venue-address p a')?.href;


const saveEventButton = document.createElement('button');

function updateButtonText() {
    saveEventButton.innerText = eventsMap.has(eventId) ? 'remove event from bookmarks' : 'add event to bookmarks';
}

saveEventButton.style.position = 'fixed';
saveEventButton.style.top = '50px';
saveEventButton.style.left = '20px';
updateButtonText();


saveEventButton.addEventListener('click', () => {
    console.log('events before', eventsMap);

    if (eventsMap.has(eventId)) {
        eventsMap.delete(eventId);
        console.log('removed event', eventId);
    }
    else {
        const eventObj = {
            id: eventId,
            link: eventLink,
            artistName,
            date,
            venue,
            address,
            mapsLink
        };

        eventsMap.set(eventId, eventObj);
        console.log(`added event with id ${eventId}`, eventObj);
    }

    console.log('events after', eventsMap);

    GM_setValue(eventsLabel, JSON.stringify(Array.from(eventsMap.values())));
    updateButtonText();
});



function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}



const downloadButton = document.createElement('button');
downloadButton.innerText = 'download events as CSV';
downloadButton.style.position = 'fixed';
downloadButton.style.top = '100px';
downloadButton.style.left = '20px';

downloadButton.addEventListener('click', () => {
    const events = Array.from(eventsMap.values());
    console.log(events);

    if (events.length > 0) {
        const eventPropNames = Object.getOwnPropertyNames(events[0]);
        let str = '';
        str += eventPropNames.join('#');
        str += '\n';
        const arrOfArrsOfEventPropVals = events.map(ev => eventPropNames.map(prop => ev[prop]));
        str += arrOfArrsOfEventPropVals.map(evPropValArr => evPropValArr.join('#')).join('\n');
        console.log(str);

        download('events.csv', str);
    }
    else {
        alert('You have not added any events to your bookmarks yet!');
    }
});


if (eventId) {
    document.body.appendChild(saveEventButton);
}
else {
    console.warn('oeticket event bookmarker could not get event ID: Probably you are currently not on an event page');
}

document.body.appendChild(downloadButton);