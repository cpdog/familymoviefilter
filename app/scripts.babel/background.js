'use strict';

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.url){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {action: 'reloadme'});
    });
  }
});

chrome.webRequest.onResponseStarted.addListener(function (details){
  //https://atv-ps.amazon.com/cdp/usage/UpdateStream?deviceID=82165134cc04404bed2baa8bc00e3721fbf4a3746b56e19fb990be10&deviceTypeID=AOAGZA014O5RE&marketplaceId=ATVPDKIKX0DER&asin=B01M31DE5L&event=STOP&timecode=47.693&userWatchSessionId=54c539e2-c15c-4a68-993b-9ebb3df61c75&firmware=1&version=1&format=json&gascEnabled=false&customerID=A29JBGWCSOZYOU&token=c8e99b1af5e8c2053c4eb9ed8ff5c653
  if (details.url.includes('asin=') || details.url.includes('/dp')) {
    console.log(details.url);
  }
}, {urls: ['*://*.amazon.com/*']});
