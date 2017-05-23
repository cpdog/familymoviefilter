(function() {
  'use strict';
  angular
    .module('openAngel')
    .controller('NavbarCtrl', function($scope, videoStateService, $state) {
      var vm = this;
      vm.blurAmount = 0;
      vm.playSpeed = 1;
      vm.currentStatus = {currentTime: 223.2, entries: [{test:'stuff'}]};
      vm.controlsFullScreen = false;

      vm.blurVideo = function() {
        vm.blurAmount = vm.blurAmount === 100 ? 0 : vm.blurAmount + 20;
        parent.postMessage({ action: 'blurVideo', from: 'openangel', blur:vm.blurAmount}, '*');
      };

      vm.copyCurrentTime = function (){
        document.getElementById('clipTime').select();
        document.execCommand('copy');
      };

      videoStateService.subscribe($scope, function(){
        vm.currentStatus = videoStateService.currentStatus();
        $scope.$apply();
      });

      vm.playPause = function() {
        parent.postMessage({ action: 'playPauseClicked', from: 'openangel'}, '*');
      };

      vm.togglePlaySpeed = function(){
        vm.playSpeed = vm.playSpeed === 1 ? 2 : vm.playSpeed === 2 ? 0.5 : 1;
        parent.postMessage({ action: 'playSpeed', from: 'openangel', playSpeed:vm.playSpeed}, '*');
      };

      vm.reloadFilters = function(){
        parent.postMessage({ action: 'reload', from: 'openangel'}, '*');
      };

      vm.fastForward = function(){
        parent.postMessage({ action: 'fastForwardClicked', from: 'openangel'}, '*');
      };

      vm.fastBackward = function(){
        parent.postMessage({ action: 'fastBackwardClicked', from: 'openangel'}, '*');
      };

      vm.frameForward = function(){
        parent.postMessage({ action: 'frameForwardClicked', from: 'openangel'}, '*');
      };

      vm.frameBackward = function(){
        parent.postMessage({ action: 'frameBackwardClicked', from: 'openangel'}, '*');
      };

      vm.toggleAutoMute = function() {
        chrome.storage.local.set({['automute_' + vm.currentStatus.serviceId] : !vm.currentStatus.autoMuteEnabled});
        parent.postMessage({ action: 'toggleAutoMute', from: 'openangel', mute: !vm.currentStatus.autoMuteEnabled}, '*');
      };

      vm.closePopup = function(){
        vm.controlsFullScreen = false;
        $state.go('app.home');
        parent.postMessage({ action: 'closePopup', from: 'openangel'}, '*');
      };

      vm.expandPopup = function(){
        parent.postMessage({ action: 'expandPopup', from: 'openangel'}, '*');
        vm.controlsFullScreen = true;
      };

      vm.showClosedCaptionList = function(){
        $state.go('app.closedCaptions');
        vm.expandPopup();
      };

      vm.showFilters = function(){
        $state.go('app.filterList');
        vm.expandPopup();
      };

      vm.showFilterHelper = function(){
        $state.go('app.filterHelper');
        vm.expandPopup();
      };
    });
})();
