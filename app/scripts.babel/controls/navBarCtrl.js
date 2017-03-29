(function() {
  'use strict';
  angular
    .module('openAngel')
    .controller('NavbarCtrl', function($scope, videoStateService, $state) {
      var vm = this;
      vm.currentStatus = {currentTime: 223.2, entries: [{test:'stuff'}]};
      vm.controlsFullScreen = false;

      vm.getCurrentStatus = function () {
        return vm.currentStatus;
      };

      videoStateService.subscribe($scope, function(){
        vm.currentStatus = videoStateService.currentStatus();
        $scope.$apply();
      });

      vm.playPause = function() {
        parent.postMessage({ action: 'playPauseClicked', from: 'openangel'}, '*');
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

      vm.closePopup = function(){
        vm.controlsFullScreen = false;
        $state.go('app.home');
        parent.postMessage({ action: 'closePopup', from: 'openangel'}, '*');
      };

      vm.expandPopup = function(){
        parent.postMessage({ action: 'expandPopup', from: 'openangel'}, '*');
        vm.controlsFullScreen = true;
      };

      vm.showFilters = function(){
        $state.go('app.filterList');
        vm.expandPopup();
      };
    });
})();
