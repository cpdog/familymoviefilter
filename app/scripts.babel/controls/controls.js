(function() {
  'use strict';
  angular
    .module('openAngel', [
      'ngAnimate',
      'ngResource',
      'ui.router',
      'ui.bootstrap'
    ]).constant('_', window._)
    .filter('formatSeconds', function () {
      return function (seconds) {
        if (seconds === undefined || Number.isNaN(seconds)){
          return '';
        }
        return new Date(seconds * 1000).toISOString().substr(11, 8);
      };
    });
})();
