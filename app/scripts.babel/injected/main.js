(function ($) {
  'use strict';
  let openAngel = (window.openAngel = window.openAngel || {});
  openAngel.netflixId=null;
  openAngel.reload=false;
  openAngel.entries = [];
  openAngel.video = null;
  openAngel.togglePlayPause = function() {
    if (openAngel.video) {
      if (openAngel.video.paused) {
        openAngel.video.play();
      }
      else{
        openAngel.video.pause();
      }
    }
  };

  function keyPrs($$num, $$ctrlKey, $$shiftKey, $$altKey) {
    let $$element = document.body;

    function keyEvent($$el, $$ev) {
      let $$eventObj = document.createEvent('Events');
      $$eventObj.initEvent($$ev, true, true);
      $$eventObj.keyCode = $$num;
      $$eventObj.which = $$num;
      $$eventObj.ctrlKey = $$ctrlKey;
      $$eventObj.shiftKey = $$shiftKey;
      $$eventObj.altKey = $$altKey;

      $$el.dispatchEvent($$eventObj);
    }

    keyEvent($$element, 'keydown');
    keyEvent($$element, 'keypress');
    keyEvent($$element, 'keyup');
  }

  openAngel.fastForward = function() {
    if (openAngel.video) {
      keyPrs(39,false,false,false);
      keyPrs(32, false, false, false);
    }
  };

  openAngel.fastBackward = function() {
    if (openAngel.video) {
      keyPrs(37,false,false,false);
      keyPrs(32, false, false, false);
    }
  };

  function startFilters() {
    RegExp.escape = function( value ) {
      return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
    };

    function readyToGo($) {

      openAngel.video = $('video:last').get(0);
      let badwordlist=['DAMN','\\bHELL\\b','JESUS','CHRIST','\\(CENSORED\\)'];
      let badWordsRegEx = new RegExp(badwordlist.join('|'),'gi');

      $.get('https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en').done(function(data){
        let badWordsFromWeb = new Set(data.split('\n'));
        let maybeOkWords = new Set(['swastika']);
        maybeOkWords.forEach(key => badWordsFromWeb.delete(key));

        badwordlist = badwordlist.concat([...badWordsFromWeb].map(x => '\\b' + RegExp.escape(x) + 's?\\b')).filter(x => x!=='\\bs?\\b' && x!==null);
        badWordsRegEx = new RegExp(badwordlist.join('|'),'gi');

      });

      function autoMute() {
        let shouldMute = false;
        $('.timedTextWindow, .player-timedtext-text-container').contents().each((index, x) => {
          let contents = x.innerText;
          let censorMe = contents.match(badWordsRegEx) !== null;
          if (censorMe) {
            contents = contents.replace(badWordsRegEx, '(CENSORED)');
            $(x).html(contents.replace('\n','<br>'));
            openAngel.video.muted = shouldMute = true;
            console.info('MUTE!');
          }
        });
        openAngel.video.muted = shouldMute;
      }

      function doNetflixSkip(filters){
        let numTimesToPressRightArrow = (Math.floor(filters[0].to - filters[0].from)/10) - 1;
        for (let i=0; i<numTimesToPressRightArrow; i++){
          keyPrs(39,false,false,false);
        }
        if (numTimesToPressRightArrow > 0) {
          keyPrs(32, false, false, false);
        }
        let playSpeed = Math.max(Math.min(8, filters[0].to - filters[0].from),2);
        openAngel.video.playbackRate = playSpeed;
        if ($('#censorme').length===0){
          //$('body').append('<div id=\'censorme\' style=\'position:absolute; z-index:999999; background-color:black; color:white; font-size:100px; width:100%; height:100%\'>CENSORING...Skipping: <span id=\'whattime\'></span></div>');
        }
        $('#whattime').text(openAngel.video.currentTime);
      }

      function resetFilters() {
        openAngel.reload = false;
        openAngel.service='';
        openAngel.serviceId='';
        window.clearInterval(openAngel.timer);
        openAngel.video=null;
        openAngel.entries = [];

        if (location.href.toLowerCase().includes('netflix.com/watch/')) {
          var netflixId = location.href.match(/netflix.com\/watch\/(\d+)/)[1];
          openAngel.serviceId = netflixId;
          openAngel.service='netflixid';
        }
        else if (location.href.toLowerCase().includes('amazon.com/') && location.href.match(/\/dp\/(.+?)\//)) {
          var amazonId = location.href.match(/\/dp\/(.+?)\//)[1];
          openAngel.serviceId = amazonId;
          openAngel.service='amazonid';
        }

        if (openAngel.serviceId !== ''){
          $.getJSON(`//ms001592indfw0001.serverwarp.com/cgi-bin/filter/filterservice.cgi/special/filterservice?${openAngel.service}=${openAngel.serviceId}`, data => {
            if (!data.Error) {
              openAngel.entries = data;
              console.log('Found filters for this title');
            }
            else{
              console.log('No entries found for this title');
            }
          });
        }

        openAngel.timer = window.setInterval(filterCheck, 100);
      }

      function setupControls() {
        if ($('#openangelcontrols').length === 0){
          if (location.href.toLowerCase().indexOf('netflix') > -1 || location.href.toLowerCase().indexOf('amazon') > -1) {
            $('body').append(`<iframe id='openangelcontrols' style="position: absolute; top:0; left:0; z-index: 9999; width: 100%; margin: 0; padding: 0; border:0; height:52px; overflow: hidden" src="chrome-extension://${openAngel.extensionId}/html/controls/controls.html"></iframe>`);
          }
          else if (location.href.toLowerCase().indexOf('youtube') > -1) {
            //$('#watch-header').append(`<iframe id='openangelcontrols' style="width: 100%; margin: 0; padding: 0; border:0; height:80px;" src="chrome-extension://${openAngel.extensionId}/html/controls/controls.html"></iframe>`);
          }
          openAngel.controlsWindow = $('#openangelcontrols').get(0).contentWindow;
        }
        else {
          if (location.href.toLowerCase().indexOf('netflix') > -1 || location.href.toLowerCase().indexOf('amazon') > -1) {
            $(openAngel.video).css({height: 'calc(100% - 55px)', top: '55px'});
            $('#netflix-player .player-back-to-browsing').css({'top' : '1em'});
            $('.webPlayer>.overlaysContainer','').css({'top' : '20px'});
          }
          else if (location.href.toLowerCase().indexOf('youtube') > -1) {

          }
        }
      }

      function filterCheck() {
        if (!openAngel.settings.enableFilters){
          return;
        }

        if (openAngel.reload){
          resetFilters();
          return;
        }
        openAngel.video = openAngel.video || $('video:last').get(0);
        if (!openAngel.video) {
          return;
        }
        else if (openAngel.video.currentTime === 0) {
          openAngel.video = $('video:last').get(0);
        }

        openAngel.currentStatus = {currentTime: openAngel.video.currentTime, paused: openAngel.video.paused, duration: openAngel.video.duration};
        if (openAngel.controlsWindow) {
          openAngel.controlsWindow.postMessage({
            action: 'currentStatus',
            from: 'openangel',
            status: openAngel.currentStatus
          }, '*');
        }
        setupControls();

        let filters = openAngel.entries.filter(x => x.from <= openAngel.video.currentTime && x.to >= openAngel.video.currentTime);
        if (filters.length > 0) {
          if (!filters[0].active) {
            filters[0].active = true;
            openAngel.video.muted = true;

            if (filters[0].type === 'video') {
              if (location.href.toLowerCase().indexOf('netflix') > -1) {
                doNetflixSkip(filters);
              }
              else {
                if (location.href.toLowerCase().indexOf('youtube') > -1) {
                  openAngel.video.currentTime = filters[0].to;
                }
                else {
                  openAngel.video.pause();
                  openAngel.video.currentTime = filters[0].to;
                  openAngel.video.play();
                }
              }
              $(openAngel.video).hide();
            }
          }
          console.log('in a filter');
          $('#whattime').text(openAngel.video.currentTime);
        }
        else {
          var activeFilters = openAngel.entries.filter(x => x.active);
          if (activeFilters.length > 0) {
            activeFilters[0].active = false;
            openAngel.video.muted = false;
            openAngel.video.playbackRate = 1;
            $(openAngel.video).show();
            $('#censorme').remove();
          }
          else {
            autoMute();
          }

          if (openAngel.settings.showConsole) {
            console.log(openAngel.video.currentTime);
          }
        }
      }

      resetFilters();
    }
    readyToGo($);
  }

  $(function(){
    startFilters();
  });

  window.addEventListener('message', evt =>{
    if (evt.data.from !== 'openangel'){
      return;
    }

    switch(evt.data.action){
      case 'reload':
        openAngel.reload=true;
        break;
      case 'loadsettings':
        openAngel.settings = evt.data.settings;
        break;
      case 'setExtensionId':
        openAngel.extensionId = evt.data.extensionId;
        break;
      case 'playPauseClicked':
        openAngel.togglePlayPause();
        break;
      case 'fastForwardClicked':
        openAngel.fastForward();
        break;
      case 'fastBackwardClicked':
        openAngel.fastBackward();
        break;
    }
  });

})(jQuery);