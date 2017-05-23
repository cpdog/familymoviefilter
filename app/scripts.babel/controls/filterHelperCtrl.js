(function () {
  'use strict';
  angular
    .module('openAngel')
    .controller('filterHelperCtrl', function (videoStateService, $scope, $stateParams, $rootScope) {
      let vm = this;
      vm.currentStatus = videoStateService.currentStatus();
      vm.loopSettings = {enable: true};

      $rootScope.$on('$stateChangeStart', function () {
        vm.loopSettings.enable = false;
      });

      vm.autoMutes = vm.currentStatus.closedCaptionList.filter(x => x.wouldAutoMute);

      function set() {
        vm.loopSettings.loopStart = vm.closedCaption.start - 2;
        vm.loopSettings.loopEnd = vm.closedCaption.end + 2;
        parent.postMessage({action: 'moveToTime', from: 'openangel', 'time': vm.loopSettings.loopStart}, '*');
      }

      if ($stateParams.ccId) {
        vm.ccId = $stateParams.ccId;
        vm.closedCaption = vm.currentStatus.closedCaptionList.find(x => x.id === vm.ccId);
        set();
      }

      vm.hasNextAutoMute = function () {
        return vm.closedCaption && vm.closedCaption.id !== vm.autoMutes[vm.autoMutes.length-1].id;
      };

      vm.hasPrevAutoMute = function () {
        return vm.closedCaption && vm.closedCaption.id !== vm.autoMutes[0].id;
      };

      vm.nextAutoMute = function () {
        vm.closedCaption = vm.autoMutes.find(x => x.id > vm.closedCaption.id);
        set();
      };

      vm.loopStart = function () {
        vm.loopSettings.loopStart = vm.currentStatus.currentTime;
      };

      vm.loopEnd = function () {
        vm.loopSettings.loopEnd = vm.currentStatus.currentTime;
      };

      vm.filterStart = function () {
        vm.loopSettings.filterStart = vm.currentStatus.currentTime;
      };

      vm.filterEnd = function () {
        vm.loopSettings.filterEnd = vm.currentStatus.currentTime;
      };

      vm.copyFilterStart = function () {
        document.getElementById('filterStart').select();
        document.execCommand('copy');
      };

      vm.copyFilterEnd = function () {
        document.getElementById('filterEnd').select();
        document.execCommand('copy');
      };

      $scope.$watchCollection('vm.loopSettings', function () {
        parent.postMessage({action: 'setFilterLoopOptions', from: 'openangel', loopSettings: vm.loopSettings}, '*');
      });

      videoStateService.subscribe($scope, function () {
        vm.currentStatus = videoStateService.currentStatus();
        $scope.$apply();
      });

    });
})();
