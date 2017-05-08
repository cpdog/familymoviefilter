class KeyboardHelper {
  static keyPresss(num, ctrlKey, shiftKey, altKey) {
    let element = document.body;

    function keyEvent(el, ev) {
      let eventObj = document.createEvent('Events');
      eventObj.initEvent(ev, true, true);
      eventObj.keyCode = num;
      eventObj.which = num;
      eventObj.ctrlKey = ctrlKey;
      eventObj.shiftKey = shiftKey;
      eventObj.altKey = altKey;

      el.dispatchEvent(eventObj);
    }

    keyEvent(element, 'keydown');
    keyEvent(element, 'keypress');
    keyEvent(element, 'keyup');
  }
}

class ClosedCaptionDownloader {

  static getClosedCaptionDataFromUrl(url) {
    var promise = new Promise((resolve, reject) => {
      const re = /(\d+):(\d+):(\d+)\.(\d+)/;
      let $ = window.jQuery;
      $.get(url).then(data => {
        let doc = $($.parseXML(data));
        let id = 1;
        let mapped = $.map(doc.find('p'), function (x) {
          let el = $(x);
          el.html(el.html().replace('/>', '/> '));
          let begin = el.attr('begin');
          let end = el.attr('end');

          if (begin.indexOf(':') === -1) {
            begin = parseInt(el.attr('begin'), 10) / 10000000;
            end = parseInt(el.attr('end'), 10) / 10000000;
          }
          else {
            let result = re.exec(begin);
            begin = (result[1] * 3600) + (result[2] * 60) + parseInt(result[3], 10) + (result[4] / 1000);

            result = re.exec(end);
            end = (result[1] * 3600) + (result[2] * 60) + parseInt(result[3], 10) + (result[4] / 1000);
          }

          return {
            caption: el.text(),
            start: begin,
            end: end,
            id: id++,
            active: false
          };
        });
        resolve(mapped);
      }, function () {
        reject();
      });
    });
    return promise;
  }
}

class OpenAngel {

  constructor(jQuery) {
    this.jQuery = jQuery;
    this.settings = {};
    this.currentStatus = {};
    this.serviceId = null;
    this.netflix = false;
    this.amazon = false;
    this.service = null;
    this.controlsWindow = null;
    this.video = null;
    this.extensionId = null;
    this.closedCaptionUrl = '';
    this.closedCaptionList = [];
    this.entries = [];
    this.autoMuteEnabled = true;
    this.badwordlist = ['DAMN', '\\bHELL\\b', 'JESUS', '\\bCHRIST\\b', '\\(CENSORED\\)', '\\b[A-Z]*SH--', '\\b[A-Z]*FU--', '\\b[A-Z]*FUCK[A-Z]*\\b', '\\b[A-Z]*SHIT[A-Z]*\\b', '\\b[A-Z]*PISS[A-Z]*\\b'];
    this.badWordsRegEx = new RegExp(this.badwordlist.join('|'), 'gi');

    //define escape function for regex which we'll need later
    RegExp.escape = function (value) {
      return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
    };

    jQuery.get('https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en').done(data => {
      let badWordsFromWeb = new Set(data.split('\n'));
      let maybeOkWords = new Set(['swastika']);
      maybeOkWords.forEach(key => badWordsFromWeb.delete(key));

      this.badwordlist = this.badwordlist.concat([...badWordsFromWeb].map(x => '\\b' + RegExp.escape(x) + 's?\\b')).filter(x => x !== '\\bs?\\b' && x !== null);
      this.badWordsRegEx = new RegExp(this.badwordlist.join('|'), 'gi');
    });
  }

  fastForward() {
    if (this.video && this.netflix) {
      KeyboardHelper.keyPresss(39, false, false, false);
      KeyboardHelper.keyPresss(32, false, false, false);
    }
    else {
      this.moveToTime(this.video.currentTime + 1);
    }
  }

  frameBackward() {
    this.moveToTime(this.video.currentTime - 1 / 24);
  }

  toggleAutoMute(mute){
    this.autoMuteEnabled = mute;
  }

  frameForward() {
    this.moveToTime(this.video.currentTime + 1 / 24);
  }

  fastBackward() {
    if (this.video && this.netflix) {
      KeyboardHelper.keyPresss(37, false, false, false);
      KeyboardHelper.keyPresss(32, false, false, false);
    }
    else {
      this.moveToTime(this.video.currentTime - 1);
    }
  }

  moveToTime(time) {
    if (this.netflix) {
      console.log('skpping to' + time);
      let numTimesToPressArrow = (Math.floor(time - this.video.currentTime) / 10) - 1; //this will be negative if we're jumping backwards. If it's negative we need to press left arrow. And since we need to go BACKWARDS, we'll need to press back one extra time.
      for (let i = 0; i < Math.abs(numTimesToPressArrow + (numTimesToPressArrow < 0 ? 1 : 0)); i++) {
        KeyboardHelper.keyPresss(numTimesToPressArrow > 0 ? 39 : 37, false, false, false);
      }
      if (numTimesToPressArrow !== 0) {
        KeyboardHelper.keyPresss(32, false, false, false);
      }
    }
    else {
      if (location.href.toLowerCase().indexOf('youtube') > -1) {
        this.video.currentTime = time;
      }
      else {
        let isPausedNow = this.video.paused;
        this.video.pause();
        this.video.currentTime = time;
        if (!isPausedNow) {
          this.video.play();
        }
      }
    }
  }

  closedCaptionCensor() {
    let foundWords = false;
    this.jQuery('.timedTextWindow, .player-timedtext-text-container').contents().each((index, x) => {
      let contents = x.innerText;
      let censorMe = contents.match(this.badWordsRegEx) !== null;
      if (censorMe) {
        contents = contents.replace(this.badWordsRegEx, '(CENSORED)');
        this.jQuery(x).html(contents.replace('\n', '<br>'));
        foundWords = true;
      }
    });
    return foundWords;
  }

  autoMute() {
    this.video.muted = this.closedCaptionCensor() && this.autoMuteEnabled;
  }

  doNetflixSkip(filters) {
    this.jQuery(this.video).hide();
    let numTimesToPressRightArrow = (Math.floor(filters[0].to - filters[0].from) / 10) - 1;
    for (let i = 0; i < numTimesToPressRightArrow; i++) {
      KeyboardHelper.keyPresss(39, false, false, false);
    }
    if (numTimesToPressRightArrow > 0) {
      KeyboardHelper.keyPresss(32, false, false, false);
    }
    let playSpeed = Math.max(Math.min(8, filters[0].to - filters[0].from), 2);
    this.video.playbackRate = playSpeed;
    if (this.jQuery('#censorme').length === 0) {
      this.jQuery('body').append('<div id=\'censorme\' style=\'position:absolute; z-index:999999; background-color:black; color:white; font-size:100px; width:100%; height:100%\'>CENSORING...Skipping: <span id=\'whattime\'></span></div>');
    }
    this.jQuery('#whattime').text(this.video.currentTime);
  }

  setupControls() {
    if (!this.netflix && location.href.toLowerCase().indexOf('amazon') === -1) {
      return;
    }

    if (this.jQuery('#openangelcontrols').length === 0) {
      if (this.netflix || location.href.toLowerCase().indexOf('amazon') > -1) {
        this.jQuery('body').append(`<iframe id='openangelcontrols' src="chrome-extension://${this.extensionId}/html/controls/controls.html"></iframe>`);
      }
      else if (location.href.toLowerCase().indexOf('youtube') > -1) {
        //this.jQuery('#watch-header').append(`<iframe id='openangelcontrols' style="width: 100%; margin: 0; padding: 0; border:0; height:80px;" src="chrome-extension://${openAngel.extensionId}/html/controls/controls.html"></iframe>`);
      }
      this.controlsWindow = this.jQuery('#openangelcontrols').get(0).contentWindow;
    }
    else {
      if (this.netflix || location.href.toLowerCase().indexOf('amazon') > -1) {
        this.jQuery(this.video).css({height: 'calc(100% - 55px)', top: '55px'});
        this.jQuery('#netflix-player .player-back-to-browsing').css({'top': '1em'});
        this.jQuery('.webPlayer>.overlaysContainer', '').css({'top': '20px'});
      }
      else if (location.href.toLowerCase().indexOf('youtube') > -1) {

      }
    }
  }

  resetFilters(manual) {

    this.service = '';
    this.serviceId = '';

    window.clearInterval(this.timer);
    this.video = null;
    if (!manual) {
      this.closedCaptionUrl = '';
      this.closedCaptionList = [];
    }
    this.entries = [];

    if (location.href.toLowerCase().includes('netflix.com/watch/')) {
      this.serviceId = location.href.match(/netflix.com\/watch\/(\d+)/)[1];
      this.service = 'netflixid';
      this.netflix = true;
    }
    else if (location.href.toLowerCase().includes('amazon.com/') && location.href.match(/\/dp\/(.+?)(\/|$|\?)/)) {
      let amazonId = location.href.match(/\/dp\/(.+?)(\/|$|\?)/)[1];
      this.amazon = true;
      this.serviceId = amazonId;
      this.service = 'amazonid';
    }

    if (this.serviceId !== '') {
      this.jQuery.ajax({
        url: `//ms001592indfw0001.serverwarp.com/cgi-bin/filter/filterservice.cgi/special/filterservice?${this.service}=${this.serviceId}`,
        type: 'get',
        dataType: 'jsonp'
      }).done(data => {
        if (!data.Error) {
          let theFilters = data.filters || data;
          theFilters.forEach(x => {
              x.enabled = x.enabled.toString() === 'true'; //the server returns 'false' (string) instead of false (boolean)
              x.id = x.id || this.serviceId + '_' + x.from + '_' + x.to + x.category; //give a unique id for the time being...
            }
          );
          this.entries = theFilters;
          console.log('Found filters for this title');

          this.loadLocalFilterOverride();
        }
        else {
          console.log('No entries found for this title');
        }
      });

      this.loadAutoMuteSettings();
    }

    this.timer = window.setInterval(() => this.filterCheck(), 100);
  }

  loadAutoMuteSettings() {
    chrome.runtime.sendMessage(this.extensionId, {
      action: 'getLocalStorage',
      keys: 'automute_' + this.serviceId
    }, response => {
        if (response['automute_' + this.serviceId] !== undefined) {
          this.autoMuteEnabled = response['automute_' + this.serviceId];
        }
    });
  }

  loadLocalFilterOverride() {
    chrome.runtime.sendMessage(this.extensionId, {
      action: 'getLocalStorage',
      keys: this.entries.map(x => 'filter_' + x.id)
    }, response => {
      this.entries.forEach(entry => {
        if (response['filter_' + entry.id] !== undefined) {
          entry.enabled = response['filter_' + entry.id];
        }
      });
    });
  }

  /** This function runs 10 times every second to check to see if we need to filter */
  filterCheck() {
    //this.settings might not be loaded yet when we first start
    if (!this.settings || !this.settings.enableFilters) {
      return;
    }

    this.video = this.video || this.jQuery('video:last').get(0);

    if (!this.video) {
      return;
    }
    else if (this.video.currentTime === 0) {
      this.video = this.jQuery('video:last').get(0);
    }

    this.currentStatus = {
      currentTime: this.video.currentTime,
      paused: this.video.paused,
      duration: this.video.duration,
      entries: this.entries,
      amazon: this.amazon,
      netflix: this.netflix,
      closedCaptionUrl: this.closedCaptionUrl,
      closedCaptionList: this.closedCaptionList,
      autoMuteEnabled: this.autoMuteEnabled,
      serviceId: this.serviceId
    };

    if (this.controlsWindow) {
      this.controlsWindow.postMessage({
        action: 'currentStatus',
        from: 'openangel',
        status: this.currentStatus
      }, '*');
    }
    this.setupControls();

    let filters = this.entries.filter(x => x.from <= this.video.currentTime && x.to >= this.video.currentTime && x.enabled);
    if (filters.length > 0) {
      if (!filters[0].active) {
        filters[0].active = true;
        this.video.muted = true;

        if (filters[0].type === 'video') {
          if (this.netflix) {
            this.doNetflixSkip(filters);
          }
          else {
            if (location.href.toLowerCase().indexOf('youtube') > -1) {
              this.video.currentTime = filters[0].to;
            }
            else {
              this.video.pause();
              this.video.currentTime = filters[0].to;
              this.video.play();
            }
          }
        }
      }
      this.closedCaptionCensor();
      console.log('in a filter');
      this.jQuery('#whattime').text(this.video.currentTime);
    }
    else {
      let activeFilters = this.entries.filter(x => x.active);
      if (activeFilters.length > 0) {
        activeFilters[0].active = false;
        this.video.muted = false;
        this.video.playbackRate = 1;
        if (this.netflix) {
          this.jQuery(this.video).show();
          this.jQuery('#censorme').remove();
        }
      }
      else {
        this.autoMute();
      }

      if (this.settings.showConsole) {
        console.log(this.video.currentTime);
      }
    }
  }

  blurVideo(blurAmount) {
    this.jQuery(this.video).css({filter: `blur(${blurAmount}px)`});
  }

  togglePlayPause() {
    if (this.video) {
      if (this.video.paused) {
        this.video.play();
      }
      else {
        this.video.pause();
      }
    }
  }

  toggleFilterEnabled(id, enabled) {
    this.entries.find(x => x.id === id).enabled = enabled;
  }

  beginFilterCheck() {
    window.addEventListener('message', evt => {
      if (evt.data.from !== 'openangel') {
        return;
      }
      switch (evt.data.action) {
        case 'toggleFilterEnabled':
          this.toggleFilterEnabled(evt.data.filter.id, evt.data.filter.enabled);
          break;
        case 'closedCaptionUrl':
          if (this.closedCaptionUrl !== evt.data.url){
            this.closedCaptionUrl = evt.data.url;
            ClosedCaptionDownloader.getClosedCaptionDataFromUrl(this.closedCaptionUrl).then(data => {
              data.forEach(ccEntry =>{
                ccEntry.wouldAutoMute = ccEntry.caption.match(this.badWordsRegEx) !== null;
              });
              this.closedCaptionList = data;
            });
          }
          break;
        case 'reload':
          this.resetFilters(true);
          break;
        case 'loadsettings':
          this.settings = evt.data.settings;
          break;
        case 'setExtensionId':
          this.extensionId = evt.data.extensionId;
          break;
        case 'playPauseClicked':
          this.togglePlayPause();
          break;
        case 'blurVideo':
          this.blurVideo(evt.data.blur);
          break;
        case 'fastForwardClicked':
          this.fastForward();
          break;
        case 'fastBackwardClicked':
          this.fastBackward();
          break;
        case 'frameForwardClicked':
          this.frameForward();
          break;
        case 'frameBackwardClicked':
          this.frameBackward();
          break;
        case 'toggleAutoMute':
          this.toggleAutoMute(evt.data.mute);
          break;
        case 'moveToTime':
          this.moveToTime(evt.data.time);
          break;
        case 'expandPopup':
          this.jQuery('#openangelcontrols').addClass('openangeloverlay');
          this.jQuery('html').data('oldposition', this.jQuery('html').css('position')).css('position', 'static');
          break;
        case 'closePopup':
          this.jQuery('#openangelcontrols').removeClass('openangeloverlay');
          this.jQuery('html').css('position', this.jQuery('html').data('oldposition'));
          break;
        default:
          console.log('unknown message:' + evt);
      }
    });
    jQuery(() => this.resetFilters(false));
  }
}

(function (jQuery) {
  'use strict';
  window.openangel = new OpenAngel(jQuery);
  window.openangel.beginFilterCheck();
})(jQuery);