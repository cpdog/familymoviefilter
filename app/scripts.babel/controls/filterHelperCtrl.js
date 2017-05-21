(function() {
  'use strict';
  angular
    .module('openAngel')
    .controller('filterHelperCtrl', function(videoStateService, $scope) {
      let vm = this;
      vm.currentStatus = videoStateService.currentStatus();
      vm.loopSettings = {};

      vm.loopStart = function() {
        vm.loopSettings.loopStart = vm.currentStatus.currentTime;
      };

      vm.loopEnd = function() {
        vm.loopSettings.loopEnd = vm.currentStatus.currentTime;
      };

      vm.filterStart = function() {
        vm.loopSettings.filterStart = vm.currentStatus.currentTime;
      };

      vm.filterEnd = function() {
        vm.loopSettings.filterEnd = vm.currentStatus.currentTime;
      };

      vm.copyFilterStart = function (){
        document.getElementById('filterStart').select();
        document.execCommand('copy');
      };

      vm.copyFilterEnd = function (){
        document.getElementById('filterEnd').select();
        document.execCommand('copy');
      };

      $scope.$watchCollection('vm.loopSettings', function(){
        parent.postMessage({ action: 'setFilterLoopOptions', from: 'openangel', loopSettings: vm.loopSettings}, '*');
      });

      videoStateService.subscribe($scope, function(){
        vm.currentStatus = videoStateService.currentStatus();
        $scope.$apply();
      });

    });
})();
