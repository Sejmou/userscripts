// ==UserScript==
// @name         MDN German to English switcher
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Makes sure that you ALWAYS get redirected to the English page for any given article
// @author       You
// @match        https://developer.mozilla.org/de/*
// @grant        none
// ==/UserScript==

const href = window.location.href;
window.location.href = href.replace('/de/', '/en-US/');
