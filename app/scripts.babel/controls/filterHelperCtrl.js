(function () {
  'use strict';
  angular
    .module('openAngel')
    .controller('filterHelperCtrl', function (videoStateService, $scope, $stateParams, $rootScope, hotkeys) {
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
        return vm.closedCaption && vm.closedCaption.id < vm.autoMutes[vm.autoMutes.length-1].id;
      };

      vm.hasPrevAutoMute = function () {
        return vm.closedCaption && vm.closedCaption.id > vm.autoMutes[0].id;
      };

      vm.nextAutoMute = function () {
        vm.closedCaption = vm.autoMutes.find(x => x.id > vm.closedCaption.id);
        set();
      };

      vm.prevAutoMute = function () {
        for (let i=vm.autoMutes.length-1; i>=0; i--){
          if (vm.autoMutes[i].id < vm.closedCaption.id){
            vm.closedCaption = vm.autoMutes[i];
            set();
            break;
          }
        }
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

      vm.firstAutoMute = function() {
        vm.closedCaption = vm.autoMutes[0];
        set();
      };

      $scope.$watchCollection('vm.loopSettings', function () {
        parent.postMessage({action: 'setFilterLoopOptions', from: 'openangel', loopSettings: vm.loopSettings}, '*');
      });

      videoStateService.subscribe($scope, function () {
        vm.currentStatus = videoStateService.currentStatus();
        $scope.$apply();
      });

      hotkeys.bindTo($scope)
        .add({
          combo: 'a',
          description: 'Mark filter start',
          callback: vm.filterStart
        })
        .add({
          combo: 's',
          description: 'Mark filter end',
          callback: vm.filterEnd
        })
        .add({
          combo: '2',
          description: 'Toggle 1/2 speed',
          callback: function() {
            vm.loopSettings.halfSpeed = !vm.loopSettings.halfSpeed;
          }
        })
        .add({
          combo: 'c',
          description: 'Copy filter start time to clipboard',
          callback: function (event) {
            event.preventDefault();
            vm.copyFilterStart();
          }
        })
        .add({
          combo: 'v',
          description: 'Copy filter end time to clipboard',
          callback: function (event) {
            event.preventDefault();
            vm.copyFilterEnd();
          }
        })
        .add({
          combo: 'space',
          description: 'Play/pause',
          callback: function () {
            parent.postMessage({ action: 'playPauseClicked', from: 'openangel'}, '*');
          }
        })
      ;
    });
})();
