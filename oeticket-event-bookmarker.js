// ==UserScript==
// @name         oeticket event bookmarker
// @namespace    http://tampermonkey.net/
// @version      0.2.1
// @description  try to take over the world!
// @author       Samo Kolter
// @match        https://www.oeticket.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @noframes
// ==/UserScript==

//Note: @noframes was necessary as the script fired multiple times for some reason?

// ----------------- Config --------------
//set to true if you want to remove all the events you have added before
const clearEventStore = false;

//if true, automatically adds the event of the current page to the bookmarks as soon as the page loads
const autoAdd = false;



// -------------------Code----------------

class EventStore {
    //Note: apparently specifying properties with leading '#' makes them private (new JavaScript feature? https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields )
    #eventsLabel = 'events'; // the key under which this script stores the bookmarked events in the "GreaseMonkey storage"
    #eventsMap;

    constructor() {
        const eventsArr = JSON.parse(GM_getValue(this.#eventsLabel)) || [];
        const eventsKeyValuePairs = eventsArr.map(event => [event.id, event]);
        this.#eventsMap = new Map(eventsKeyValuePairs);
    }

    addEvent(eventObj) {
        this.#eventsMap.set(eventObj.id, eventObj);
        console.log(`added event with id ${eventObj.id}`, eventObj);

        this.#updateEventsInGMStorage();
    }

    removeEvent(eventId) {
        const elementRemoved = this.#eventsMap.delete(eventId);

        if (elementRemoved) {
            console.log('removed event', eventId);

            this.#updateEventsInGMStorage();
        }
        else console.log(`no event with ID ${eventId} found`);
    }

    clear() {
        this.#eventsMap = new Map();
        GM_setValue(this.#eventsLabel, null);
        console.log('cleared event store');
    }

    contains(eventId) {
        return this.#eventsMap.has(eventId);
    }

    #updateEventsInGMStorage() {
        GM_setValue(this.#eventsLabel, JSON.stringify(this.events));
        console.log('events', this.events);
    }

    get eventFromCurrentPage() {
        const artistName = document.querySelector('.stage-headline')?.innerText;
        const [weekDay, date] = document.querySelector('time')?.innerText.split(',').map(str => str.trim());
        const venueEl = document.querySelector('a[href="#venueInformation"]');
        const venue = venueEl?.innerText;

        const eventURLStr = 'https://www.oeticket.com/event/';
        const url = window.location.href;
        const onEventURL = window.location.href.indexOf(eventURLStr) === 0;
        const urlAfterEventURL = url.substring(eventURLStr.length);
        const eventId = onEventURL ? urlAfterEventURL.substring(0, urlAfterEventURL.indexOf('/')) : undefined;

        const eventLink = eventId ? `${eventURLStr}${eventId}/` : undefined;
        const address = document.querySelector('.venue-address p')?.innerText.split('\n')[0].trim();
        const mapsLink = document.querySelector('.venue-address p a')?.href;

        return {
            id: eventId,
            link: eventLink,
            artistName,
            weekDay,
            date,
            venue,
            address,
            mapsLink
        };
    }

    get events() {
        return Array.from(this.#eventsMap.values());
    }
}







function createEventBookmarkButton() {
    const evtBookmarkBtn = document.createElement('button');
    evtBookmarkBtn.style.position = 'fixed';
    evtBookmarkBtn.style.top = '50px';
    evtBookmarkBtn.style.left = '20px';
    evtBookmarkBtn.innerText = eventStore.contains(eventStore.eventFromCurrentPage.id) ? 'remove event from bookmarks' : 'add event to bookmarks';


    evtBookmarkBtn.addEventListener('click', () => {

        if (eventStore.contains(eventStore.eventFromCurrentPage.id)) eventStore.removeEvent(eventStore.eventFromCurrentPage.id);
        else eventStore.addEvent(eventStore.eventFromCurrentPage);

        evtBookmarkBtn.innerText = eventStore.contains(eventStore.eventFromCurrentPage.id) ? 'remove event from bookmarks' : 'add event to bookmarks';
    });

    return evtBookmarkBtn;
}







function createDownloadButton() {
    const downloadButton = document.createElement('button');
    downloadButton.innerText = 'download events as CSV';
    downloadButton.style.position = 'fixed';
    downloadButton.style.top = '100px';
    downloadButton.style.left = '20px';

    downloadButton.addEventListener('click', () => {
        const events = eventStore.events;
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

    return downloadButton;
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}







const eventStore = new EventStore();
if (clearEventStore) eventStore.clear();

//update event if it is already in bookmarks
if (eventStore.contains(eventStore.eventFromCurrentPage.id)) eventStore.addEvent(eventStore.eventFromCurrentPage);

if (eventStore.eventFromCurrentPage?.id) {
    if (autoAdd) eventStore.addEvent(eventStore.eventFromCurrentPage);
    document.body.appendChild(createEventBookmarkButton());
}
else {
    console.warn('oeticket event bookmarker could not get event ID: Probably you are currently not on an event page');
}

document.body.appendChild(createDownloadButton());