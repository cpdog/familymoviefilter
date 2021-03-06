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
    return new Promise((resolve, reject) => {

      let $ = window.jQuery;
      $.get(url).then(data => {
        let doc = $.parseXML(data);
        if (url.toLowerCase().indexOf('hulu.com') > -1){
          resolve(ClosedCaptionDownloader.doHuluMapping(doc));
        }
        else{
          resolve(ClosedCaptionDownloader.doDefaultClosedCaptionMapping(doc));
        }
      }, function () {
        reject();
      });
    });
  }

  static doVTTMapping(video) {
    let map = [];
    let cues = video.textTracks[0].cues;
    for (let i=0; i < cues.length; i++){
      map.push({
        caption: cues[i].originalText || cues[i].text,
        start: cues[i].startTime,
        end: cues[i].endTime,
        id: i-1,
        active: false
      });
    }
    return map;
  }

  static doHuluMapping(doc) {

    const key = aesjs.utils.hex.toBytes('4878B22E76379B55C962B18DDBC188D82299F8F52E3E698D0FAF29A40ED64B21');
    const iv = aesjs.utils.hex.toBytes('574137686170374147556b6576757468');
    let allNodes = doc.querySelectorAll('SYNC');
    let map = [];
    for (let i=1; i< allNodes.length; i+=2){

      let startNode =  $(allNodes[i]);
      let endNode =  $(allNodes[i+1]);
      let begin = startNode.attr('start');
      let end = endNode.attr('start');

      begin = parseInt(begin, 10)/1000;
      end = parseInt(end, 10)/1000;


      let text = startNode.text();
      var enc = aesjs.utils.hex.toBytes(text);
      var aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
      var decryptedBytes = aesCbc.decrypt(enc);
      var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes.slice(0,decryptedBytes.length - decryptedBytes[decryptedBytes.length-1]));
      map.push({
        caption: $(decryptedText.replace('/>', '/> ')).text(),
        start: begin,
        end: end,
        id: i-1,
        active: false
      });
    }
     return map;
  }

  static doDefaultClosedCaptionMapping(doc) {
    const re = /(\d+):(\d+):(\d+)\.(\d+)/;
    let id = 1;
    let mapped = $.map(doc.querySelectorAll('p'), function (x) {
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
    return mapped;
  }
}

class OpenAngel {

  constructor(jQuery) {
    this.weirdAmazonBuffer = 0;
    this.jQuery = jQuery;
    this.settings = {};
    this.currentStatus = {};
    this.serviceId = null;
    this.netflix = false;
    this.youtube = false;
    this.hulu = false;
    this.amazon = false;
    this.disneyplus = false;
    this.service = null;
    this.controlsWindow = null;
    this.video = null;
    this.extensionId = null;
    this.closedCaptionUrl = '';
    this.closedCaptionList = [];
    this.entries = [];
    this.autoMuteEnabled = true;
    this.hideToolWindow = false;
    this.playSpeed = 1;
    this.badwordlist = ['OH,? GOD','OH,? MY GOD','^\\s*-?GOD!','BADASS','GODDAMN','DAMN', '\\bHELL\\b', 'JESUS', '\\bCHRIST\\b', '\\(CENSORED\\)', '\\b[A-Z]*SH--', '\\b[A-Z]*FU--', '\\b[A-Z]*FUCK[A-Z]*\\b', '\\b[A-Z]*SHIT[A-Z]*\\b', '\\b[A-Z]*PISS[A-Z]*\\b','DICK(?! VAN)'];
    this.badWordsRegEx = new RegExp(this.badwordlist.join('|'), 'gi');
    this.loopSettings = {enable:false};
    //define escape function for regex which we'll need later
    RegExp.escape = function (value) {
      return value.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
    };
    jQuery.get('https://raw.githubusercontent.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words/master/en').done(data => {
      let badWordsFromWeb = new Set(data.split('\n'));
      let maybeOkWords = new Set(['swastika','voyeur','undressing','tushy','tied up','taste my','tainted love','swinger','snowballing','snatch','smut','nude','nudity','escort','dick','poof']);
      maybeOkWords.forEach(key => badWordsFromWeb.delete(key));

      this.badwordlist = this.badwordlist.concat([...badWordsFromWeb].map(x => '\\b' + RegExp.escape(x) + 's?\\b')).filter(x => x !== '\\bs?\\b' && x !== null);
      this.badWordsRegEx = new RegExp(this.badwordlist.join('|'), 'gi');
    });
  }

  getCurrentTime(){
    if (!this.video){
      return 0;
    }
    if (this.amazon){
      return this.video.currentTime < 10 ? this.video.currentTime : this.video.currentTime - this.weirdAmazonBuffer;
    }
    else{
      return this.video.currentTime;
    }
  }

  fastForward() {
    if (this.video && this.netflix) {
      this.netflixMoveToTime(this.getCurrentTime() + 1);
      //KeyboardHelper.keyPresss(39, false, false, false);
      //KeyboardHelper.keyPresss(32, false, false, false);
    }
    else {
      this.moveToTime(this.getCurrentTime() + 1);
    }
  }

  frameBackward() {
    this.moveToTime(this.getCurrentTime() - this.getFrameMoveAmount() / 24);
  }

  toggleAutoMute(mute){
    this.autoMuteEnabled = mute;
  }

  getFrameMoveAmount(){
    return this.netflix ? 2 : 1;
  }

  frameForward() {
    this.moveToTime(this.getCurrentTime() + this.getFrameMoveAmount() / 24);
  }

  fastBackward() {
    if (this.video && this.netflix) {
      this.netflixMoveToTime(this.getCurrentTime() - 1);
      //KeyboardHelper.keyPresss(37, false, false, false);
      //KeyboardHelper.keyPresss(32, false, false, false);
    }
    else {
      this.moveToTime(this.getCurrentTime() - 1);
    }
  }

  netflixMoveToTime(time){
      const framesPerSecond = 60;
      $('.player-controls-wrapper').removeClass('opacity-transparent display-none');
      $('.playback.container.hidden.klayer-ns.surface').removeClass('hidden'); //kids
      $('.PlayerControls--low-power').removeClass('PlayerControls--low-power');
      let wasHidden = $('.legacy-controls-styles').hasClass('inactive') || $('.PlayerControlsNeo__bottom-controls').hasClass('PlayerControlsNeo__bottom-controls--faded');
      $('.legacy-controls-styles').removeClass('inactive').addClass('active');

      let containerSelector = '#netflix-player .player-controls-wrapper, .row.centered.expanded.buttons-container.klayer-ns.surface, .PlayerControls--bottom-controls, .PlayerControlsNeo__bottom-controls, .PlayerControlsNeo__bottom-controls--faded';
      let oldWidth = $(containerSelector).css('width');
      $(containerSelector).css('width',(this.video.duration * framesPerSecond)  + 'px');

      let scrubber = jQuery('#scrubber-component, .klayer-slider.base.klayer-ns.surface, .scrubber-bar');

      window.clearTimeout(window.netflixTimeout);
      $('.controls, .PlayerControlsNeo__layout').show(); //in case we hid it down below!

      scrubber[0].dispatchEvent(new MouseEvent('mouseover', {
        'bubbles': true,
        'button': 0,
        'screenX': jQuery(window).scrollLeft(),
        'screenY': jQuery(window).scrollTop(),
        'clientX': jQuery(window).scrollLeft(),
        'clientY': jQuery(window).scrollTop(),
        'offsetX': 0,
        'offsetY': 0,
        'pageX': 0,
        'pageY': 0,
        'currentTarget': scrubber[0]
      }));

      let factor = time / this.video.duration;
      let mouseX = scrubber.offset().left + Math.round(scrubber.width() * factor);
      let mouseY = scrubber.offset().top + scrubber.height() / 2;


      let eventOptions = {
        'bubbles': true,
        'button': 0,
        'screenX': mouseX - jQuery(window).scrollLeft(),
        'screenY': mouseY - jQuery(window).scrollTop(),
        'clientX': mouseX - jQuery(window).scrollLeft(),
        'clientY': mouseY - jQuery(window).scrollTop(),
        'offsetX': mouseX - scrubber.offset().left,
        'offsetY': mouseY - scrubber.offset().top,
        'pageX': mouseX,
        'pageY': mouseY,
        'currentTarget': scrubber[0]
      };

      scrubber[0].dispatchEvent(new MouseEvent('mouseover', eventOptions));
      scrubber[0].dispatchEvent(new MouseEvent('mousedown', eventOptions));
      scrubber[0].dispatchEvent(new MouseEvent('mouseup', eventOptions));
      scrubber[0].dispatchEvent(new MouseEvent('click', eventOptions));
      scrubber[0].dispatchEvent(new MouseEvent('mouseout', eventOptions));

      $('.player-controls-wrapper').addClass('opacity-transparent display-none');
      $('.playback.container.hidden.klayer-ns.surface').addClass('hidden'); //kids
      if (wasHidden || true) {
        //alert('now hide!')

        $('.controls, .PlayerControlsNeo__layout').hide();
        window.netflixTimeout = window.setTimeout(function () {
          $('.controls').addClass('inactive').removeClass('active').show();
          $('.PlayerControlsNeo__layout').show();
        },5000); //this should work without the 5 second delay but it still shows the scrubber? css transition delay?
        //.addClass('inactive').removeClass('active');
        $('.legacy-controls-styles').addClass('inactive').removeClass('active');
      }
      $(containerSelector).css('width',oldWidth);
      this.controlsWindow.focus();
  }
  moveToTime(time) {
    time = this.amazon ? time + this.weirdAmazonBuffer : time; //amazon does something WEIRD where there's a 10 seconds difference
    if (this.netflix) {
      this.netflixMoveToTime(time);
    }
    else {
      if (location.href.toLowerCase().indexOf('youtube') > -1 || this.hulu) {
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

    //The other thing we want to do here is that if there is a filter that happens during the current closed caption, then we want to censor that closed caption. This takes care of comments that aren't filtered by being in the bad word list
    //but are filtered out through a user created filter.
    let currentClosedCaptionList = this.closedCaptionList.filter(entry => entry.start <= this.getCurrentTime() && entry.end >= this.getCurrentTime());
    let closedCapationCssQuery = '.timedTextWindow, .player-timedtext-text-container, .caption-segment, .persistentPanel div span';
    if (this.entries.length > 0 && currentClosedCaptionList.length > 0) {

      let minCCEntryTime = currentClosedCaptionList.sort((x,y) => x.start - y.start)[0].start;
      let maxCCEntryTime = currentClosedCaptionList.sort((x,y) => y.start - y.start)[0].end;

      let filtersActiveDuringClosedCaption = this.entries.filter(x => x.enabled && ((x.from >= minCCEntryTime && x.from <= maxCCEntryTime) || (x.to >= minCCEntryTime && x.to <= maxCCEntryTime) || (x.from <= minCCEntryTime && x.to >= maxCCEntryTime)));
      if (filtersActiveDuringClosedCaption.length > 0) {
        //if there's an active filter (which would be for dialog), then we want to hide the closed captions altogether
        this.jQuery(closedCapationCssQuery).contents().each((index, x) => {
          this.jQuery(x).html('(CENSORED)');
        });
      }
    }

    //now do the automuting
    let autoMuteList = this.closedCaptionList.filter(entry => entry.wouldAutoMute && entry.start <= this.getCurrentTime() && entry.end >= this.getCurrentTime());
    if (autoMuteList.length > 0) {
      this.jQuery(closedCapationCssQuery).contents().each((index, x) => {
        let contents = x.innerText;
        let censorMe = contents.match(this.badWordsRegEx) !== null;
        if (censorMe) {
          contents = contents.replace(this.badWordsRegEx, '(CENSORED)');
          this.jQuery(x).html(contents.replace('\n', '<br>'));
        }
      });

      if (this.entries.length > 0) {
        let minCCEntryTime = autoMuteList.sort((x,y) => x.start - y.start)[0].start;
        let maxCCEntryTime = autoMuteList.sort((x,y) => y.start - y.start)[0].end;

        let filters = this.entries.filter(x => x.enabled && ((x.to >= minCCEntryTime && x.to <= maxCCEntryTime) || (x.from >= minCCEntryTime && x.from <= maxCCEntryTime) || (x.from <= minCCEntryTime && x.to >= maxCCEntryTime)));
        if (filters.length > 0) { //there's an active filter in play so don't auto mute
          return false;
        }
      }
    }
    return autoMuteList.length > 0;
  }

  autoMute() {
    this.video.muted = this.closedCaptionCensor() && this.autoMuteEnabled;
  }

  setupControls() {
    if (!this.youtube && !this.netflix && !this.hulu && !this.disneyplus && !(location.href.toLowerCase().indexOf('amazon') !== -1 && this.jQuery('#dv-web-player:visible').length > 0)){
      return;
    }
    if (this.jQuery('#openangelcontrols').length === 0) {
      if (this.netflix || location.href.toLowerCase().indexOf('amazon') > -1 || this.hulu || this.disneyplus) {
        this.jQuery('body').append(`<iframe id='openangelcontrols' src="chrome-extension://${this.extensionId}/html/controls/controls.html"></iframe>`);
        if (this.hulu){
          this.jQuery('#inner-wrap').css({'top': '50px'});
        }
      }
      else if (this.youtube) {
        //this.jQuery('body').append(`<iframe id='openangelcontrols' src="chrome-extension://${this.extensionId}/html/controls/controls.html"></iframe>`);
        //this.jQuery('#watch-header').append(`<iframe id='openangelcontrols' style="width: 100%; margin: 0; padding: 0; border:0; height:80px;" src="chrome-extension://${openAngel.extensionId}/html/controls/controls.html"></iframe>`);
      }
      this.controlsWindow = this.jQuery('#openangelcontrols').get(0).contentWindow;
    }
    else {
      if (this.netflix || this.disneyplus || location.href.toLowerCase().indexOf('amazon') > -1) {
        this.jQuery(this.video).css({height: 'calc(100% - 55px)', top: '55px'});
        this.jQuery('#netflix-player .player-back-to-browsing').css({'top': '1em'});
        this.jQuery('.webPlayer>.overlaysContainer', '').css({'top': '20px'});
        this.jQuery('.playback-longpause-container').css('display','none');
        this.jQuery('#hudson-wrapper').css({'top':'40px'});
      }
      else if (location.href.toLowerCase().indexOf('youtube') > -1) {

      }
    }

    if (this.hideToolWindow){
      this.jQuery('#openangelcontrols').hide();
    }
    else{
      this.jQuery('#openangelcontrols').show();
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
    else if (location.href.toLowerCase().includes('amazon.com/') && location.href.match(/\/(dp|gp\/video\/detail|gp\/product)\/(.+?)(\/|$|\?)/)) {
      let amazonId = location.href.match(/\/(dp|gp\/video\/detail|gp\/product)\/(.+?)(\/|$|\?)/)[2];
      this.amazon = true;
      this.serviceId = amazonId;
      this.service = 'amazonid';
    }
    else if (location.href.toLowerCase().includes('hulu.com/watch')) {
      this.serviceId = location.href.match(/hulu.com\/watch\/(\d+)/)[1];
      this.service = 'huluid';
      this.hulu = true;
    }
    else if (location.href.toLowerCase().includes('disneyplus.com/video/')) {
      this.serviceId = location.href.match(/disneyplus.com\/video\/([a-z0-9-]+)/)[1];
      this.service = 'disneyId';
      this.disneyplus = true;
    }
    else if (location.href.toLowerCase().includes('youtube.com/watch')) {
      //this.serviceId = location.href.match(/hulu.com\/watch\/(\d+)/)[1];
      this.service = 'youtube';
      this.youtube = true;
    }


    if (this.serviceId !== '') {

      $(() => {
        let allIds = new Set(); //amazon has more than one ID per movie for different qualities etc.
        allIds.add(this.serviceId);
        if (this.amazon){
          $('.mwtw-wrapper input[data-asin]').each(function(){
            allIds.add($(this).data('asin'));
          });
        }
        let allIdString = [...allIds].join(',');
        this.jQuery.ajax({
          url: `//ms001592indfw0001.serverwarp.com/cgi-bin/filter/filterservice.cgi/special/filterservice?${this.service}=${allIdString}`,
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
            this.comment = data.comment;
            console.log('Found filters for this title');

            this.loadLocalFilterOverride();
          }
          else {
            console.log('No entries found for this title');
          }
        });
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

    this.video = this.video || (this.hulu ? this.jQuery('#content-video-player').get(0) : this.jQuery('video:last').get(0));

    if (!this.video) {
      return;
    }
    else if (this.getCurrentTime() === 0) {
      this.video = (this.hulu ? this.jQuery('#content-video-player').get(0) : this.jQuery('video:last').get(0));
    }

    this.webVTTCheck();

    this.currentStatus = {
      currentTime: this.getCurrentTime(),
      paused: this.video.paused,
      duration: this.video.duration,
      entries: this.entries,
      amazon: this.amazon,
      netflix: this.netflix,
      closedCaptionUrl: this.closedCaptionUrl,
      closedCaptionList: this.closedCaptionList,
      autoMuteEnabled: this.autoMuteEnabled,
      serviceId: this.serviceId,
      comment: this.comment
    };

    if (this.controlsWindow) {
      this.controlsWindow.postMessage({
        action: 'currentStatus',
        from: 'openangel',
        status: this.currentStatus
      }, '*');
    }
    this.setupControls();

    if (this.loopSettings && this.loopSettings.enable) {
      this.video.playbackRate = this.loopSettings.halfSpeed ? 0.5 : 1;
      if (this.getCurrentTime() >= this.loopSettings.filterStart && this.getCurrentTime() <= this.loopSettings.filterEnd && this.loopSettings.enableFilter){
        this.video.muted = true;
      }
      else{
        this.video.muted = false;
      }

      if (this.getCurrentTime() >= this.loopSettings.loopEnd && !this.video.paused){
        this.moveToTime(this.loopSettings.loopStart);
      }
      return;
    }

    let filters = this.entries.filter(x => x.from <= this.getCurrentTime() && x.to >= this.getCurrentTime() && x.enabled);
    if (filters.length > 0) {
      if (!filters[0].active) {
        filters[0].active = true;
        this.video.muted = true;
        if (filters[0].type === 'video') {
          if (this.netflix) {
            this.netflixMoveToTime(filters[0].to);
          }
          else {
            if (location.href.toLowerCase().indexOf('youtube') > -1) {
              this.video.currentTime = filters[0].to;
            }
            else {
              this.video.pause();
              this.video.currentTime = parseFloat(filters[0].to) + (this.amazon ? this.weirdAmazonBuffer : 0);
              this.video.play();
            }
          }
        }
      }
      this.closedCaptionCensor();
      console.log('in a filter');
      this.jQuery('#whattime').text(this.getCurrentTime());
    }
    else {
      let activeFilters = this.entries.filter(x => x.active);
      if (activeFilters.length > 0) {
        activeFilters[0].active = false;
        this.video.muted = false;
        this.video.playbackRate = this.playSpeed;
        if (this.netflix) {
          this.jQuery(this.video).show();
          this.jQuery('#censorme').remove();
        }
      }
      else {
        this.autoMute();
      }

      if (this.settings.showConsole) {
        console.log(this.getCurrentTime());
      }
    }
  }

  setPlaySpeed(speed){
    this.playSpeed=speed;
    this.video.playbackRate = speed;
  }

  blurVideo(blurAmount) {
    this.video.style.setProperty('filter', `blur(${blurAmount}px)`, 'important');
  }


  togglePlayPause() {
    if (this.video) {
      if (this.netflix){
        if ($('.button-nfplayerPlay, .button-nfplayerPause').length > 0){
          $('.button-nfplayerPlay, .button-nfplayerPause').click();
        }
        else {
          KeyboardHelper.keyPresss(32, false, false, false);
          $('.player-controls-wrapper').addClass('opacity-transparent display-none');
        }
      }
      else {
        if (this.video.paused) {
          this.video.play();
        }
        else {
          this.video.pause();
        }
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
              this.normalizeClosedCaptions(data);
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
        case 'hideToolWindow':
          this.hideToolWindow = true;
          break;
        case 'playSpeed':
          this.setPlaySpeed(evt.data.playSpeed);
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
        case 'setFilterLoopOptions':
          this.loopSettings = evt.data.loopSettings;
          break;
        case 'expandPopup':
          this.jQuery('#openangelcontrols').addClass('openangeloverlay');
          this.jQuery('html').data('oldposition', this.jQuery('html').css('position')).css('position', 'static');
          break;
        case 'closePopup':
          this.loopSettings.enable=false;
          this.video.playbackRate = this.playSpeed;
          this.jQuery('#openangelcontrols').removeClass('openangeloverlay');
          this.jQuery('html').css('position', this.jQuery('html').data('oldposition'));
          break;
        default:
          console.log('unknown message:' + evt.data.action);
      }
    });
    jQuery(() => this.resetFilters(false));
  }

  normalizeClosedCaptions(data) {
    data.forEach(ccEntry => {
      let normalizedCaption = ccEntry.caption.replace(/(\(|\[).+?(\]|\))/g, ''); //strip out any words that are in brackets like [GUNSHOT] or (GUNSHOT).
      ccEntry.wouldAutoMute = normalizedCaption.match(this.badWordsRegEx) !== null;
    });

    this.closedCaptionList = data;
  }

  webVTTCheck() {
    if (this.disneyplus && this.video.textTracks.length > 0 && this.closedCaptionList.length !== this.video.textTracks[0].cues.length) {
      this.normalizeClosedCaptions(ClosedCaptionDownloader.doVTTMapping(this.video));
      this.closedCaptionUrl = 'disneyplusVTT';
      for (let i=0; i< this.video.textTracks[0].cues.length; i++){
        let cue = this.video.textTracks[0].cues[i];
        cue.originalText = cue.originalText || cue.text;
        cue.text = cue.text.replace(this.badWordsRegEx, '(CENSORED)');
      }
    }
  }
}

(function (jQuery) {
  'use strict';
  window.openangel = new OpenAngel(jQuery);
  window.openangel.beginFilterCheck();
})(jQuery);
