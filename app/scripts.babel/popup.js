'use strict';

$(function(){
  function save_options() {
    let enableFilters = $('#chkEnableFilters').prop('checked');
    let showConsole = $('#chkShowConsole').prop('checked');
    chrome.storage.sync.set({showConsole,enableFilters}, () => {
      $('#alertMessage').addClass('in');
      chrome.tabs.query({active:true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {action:'settingschanged'});
        window.close();     // Close dialog
      });
    });
  }

  function restore_options() {
    chrome.storage.sync.get({
      enableFilters: true,
      showConsole: true
    }, function(settings) {
      $('#chkEnableFilters').prop('checked',settings.enableFilters);
      $('#chkShowConsole').prop('checked',settings.showConsole);
    });
  }

  restore_options();
  $('#btnSaveOptions').click(save_options);
  $('.close').click( () => $(event.currentTarget).closest('.in').removeClass('in'));
});