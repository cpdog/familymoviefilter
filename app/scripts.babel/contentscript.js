'use strict';

chrome.runtime.onMessage.addListener(function (request) {
  if (request.action === 'reloadme') {
    window.postMessage({action: 'reload', from: 'openangel'}, '*');
  }
  else if (request.action === 'closedCaptionUrl') {
    window.postMessage({action: 'closedCaptionUrl', from: 'openangel', url: request.url}, '*');
  }
  else if (request.action === 'settingschanged') {
    chrome.storage.sync.get({enableFilters: true, showConsole: true}, function (settings) {
      window.postMessage({action: 'loadsettings', from: 'openangel', settings}, '*');
    });
  }
});

let scriptsToInject = ['bower_components/jquery/dist/jquery.js','bower_components/aes-js/index.js', 'scripts/injected/mainNew.js'];
var nextScriptIndex = 0;
function loadScript() {
  let s = document.createElement('script');
  s.src = chrome.extension.getURL(scriptsToInject[nextScriptIndex++]);
  s.onload = function () {
    s.remove();
    if (nextScriptIndex < scriptsToInject.length) {
      loadScript();
    }
    else {
      window.postMessage({action: 'setExtensionId', from: 'openangel', extensionId: chrome.runtime.id}, '*');
      chrome.storage.sync.get({enableFilters: true, showConsole: true}, function (settings) {
        window.postMessage({action: 'loadsettings', from: 'openangel', settings}, '*');
      });
    }
  };
  (document.head || document.documentElement).appendChild(s);
}

loadScript();