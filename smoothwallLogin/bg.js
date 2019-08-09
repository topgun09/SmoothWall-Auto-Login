const href = 'https://ls.zebras.net:442/clogin';
const acceptText =
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8';
const filter = [
    "http://ls.zebras.net/*",
    "http://ls.zebras.net:442/*",
    "https://ls.zebras.net/*",
    "https://ls.zebras.net:442/*"
];

let cookieCache = null; 

let n = localStorage.getItem('n');
let p = localStorage.getItem('p');


if(n === null || p === null){
    chrome.browserAction.setPopup({popup:'singin.html'});
}
else{
    chrome.browserAction.setPopup({popup:''});
}

chrome.runtime.onMessage.addListener(msg=>{
    if(!msg.hasOwnProperty('event')) return;
    let event = msg.event;
    if(event === 'signin') firstSignin(msg.usr, msg.pwd);
})

async function firstSignin(usr,pwd){
    n = usr;
    p = pwd;
    let result = await signIn();
    if(!result)return;
    localStorage.setItem('n', usr)
    localStorage.setItem('p', pwd);
    chrome.browserAction.setPopup({popup:''});
}

chrome.browserAction.onClicked.addListener(signIn);

chrome.webRequest.onBeforeSendHeaders.addListener(modifyHeaders,
    { urls: filter }, ["blocking", "requestHeaders"]);

async function checkLoginStatus() {
    const response = await fetch(href),
        dp = new DOMParser(),
        dom = dp.parseFromString(await response.text(), 'text/html');
    if (dom.forms.LOGINFORM === undefined) signedIn();
    else {
        signedOut();
        signIn();
    }
}

chrome.webRequest.onHeadersReceived.addListener(getCookies,
    { urls: filter }, ["responseHeaders"]);

function signedIn() {
	chrome.browserAction.setIcon({ path : "icon.png" });
    //chrome.browserAction.setBadgeText({ text: 'IN' });
    //chrome.browserAction.setBadgeBackgroundColor({ color: '#066800' });
}

function signedOut() {
	chrome.browserAction.setIcon({ path : "out.png" });
    //chrome.browserAction.setBadgeText({ text: 'OUT' });
    //chrome.browserAction.setBadgeBackgroundColor({ color: '#680000' });
}

async function signIn() {
    if(n === null || p === null) return;
    const dp = new DOMParser(),
        url = new URL(href);
    url.searchParams.set("USERNAME", n);
    url.searchParams.set("PASSWORD", p);
    url.searchParams.set("ACTION", "Login");

    const submit = await fetch(href, {
        credentials: "include",
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: url.searchParams.toString()
    });

    const dom = dp.parseFromString(await submit.text(), "text/html");

    if (dom.forms.LOGINFORM === undefined) {
        signedIn();
        keepSignedIn();
        return true;
    }
    signedOut();
    return false;
}

function keepSignedIn() {
    const minutes = 5;
    const total = minutes * 60 * 1000;
    setInterval(checkLoginStatus, total);
}

function modifyHeaders(details) {
    if (details.url) {

    }
    let origin = details.requestHeaders.findIndex(x => x.name === 'Origin');
    let accept = details.requestHeaders.findIndex(x => x.name === 'Accept');
    let cache = details.requestHeaders.findIndex(x => x.name === 'Cache-Control');
    if (origin === -1) {
        details.requestHeaders.push({
            name: 'Origin',
            value: 'https://ls.zebras.net:442/'
        });
    }
    else {
        details.requestHeaders[origin].value = 'https://ls.zebras.net:442/';
    }

    if (accept === -1) {
        details.requestHeaders.push({
            name: 'Accept',
            value: acceptText
        });
    }
    else {
        details.requestHeaders[accept].value = acceptText;
    }

    if(cache === -1){
        details.requestHeaders.push({
            name: 'Cache-Control',
            value: 'max-age=0'
        });
    }

    if(cookieCache !== null){
        details.requestHeaders.push({
            name: 'Cookie',
            value: cookieCache
        });
    }

    details.requestHeaders.push({
        name: 'Upgrade-Insecure-Requests',
        value: '1'
    });
    details.requestHeaders.push({
        name: 'Referer',
        value: href
    });
    return { requestHeaders: details.requestHeaders };
}

function getCookies(details) {
    let cookie = details.responseHeaders.find(x=>x.name === 'Set-Cookie');
    if(cookie == undefined) return;
    const val = cookie.value.split('=')[1].split(';')[0];
    let cookieData = {
        url: 'https://ls.zebras.net:442/',
        name: 'SecureLogin',
        value: val,
        domain: 'ls.zebras.net',
    }
    cookieCache = cookie.value;
    chrome.cookies.set(cookieData);
}

async function init(){
    const response = await fetch(href),
        dp = new DOMParser(),
        dom = dp.parseFromString(await response.text(), 'text/html');
    if (dom.forms.LOGINFORM === undefined) signedIn();
    else {
        signedOut();
    }
}

init();

chrome.contextMenus.create({
    title: "clear credentials",
    contexts: ["browser_action"],
    onclick: function() {
        n = null;
        p = null;
        localStorage.removeItem('n');
        localStorage.removeItem('p');
    }
});