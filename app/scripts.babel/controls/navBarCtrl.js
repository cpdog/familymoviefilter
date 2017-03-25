(function() {
  'use strict';
  angular
    .module('openAngel')
    .controller('NavbarCtrl', function($window, _, $scope) {
      var vm = this;
      vm.currentStatus = {};
      vm.email='tim@tim.com';
      vm.filters = {};
      vm.playPause = function() {
        parent.postMessage({ action: 'playPauseClicked', from: 'openangel'}, '*');
      };

      vm.fastForward = function(){
        parent.postMessage({ action: 'fastForwardClicked', from: 'openangel'}, '*');
      };

      vm.fastBackward = function(){
        parent.postMessage({ action: 'fastBackwardClicked', from: 'openangel'}, '*');
      };

      $window.addEventListener('message', evt => {
        if (evt.data.from !== 'openangel'){
          return;
        }

        if (!_.isEqual(vm.currentStatus, evt.data.status)){
          vm.currentStatus = evt.data.status;
          $scope.$apply();
        }

        vm.getCurrentStatus = function (){
          return vm.currentStatus;
        };

        //console.log(evt.data);
      });

    });
})();
