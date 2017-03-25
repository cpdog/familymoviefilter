(function() {
  'use strict';
  angular
    .module('openAngel')
    .controller('NavbarCtrl', function() {
      var vm = this;
      vm.email='tim@tim.com';
      vm.filters = {};
      vm.playPauseClicked = function() {
        console.log('local event');
        parent.postMessage({ action: 'playPauseClicked', from: 'openangel'}, '*');
      };
    });
})();
