(function(){
    'use strict';
    angular
      .module('openAngel')
      .factory('videoStateService', ($window, _, $rootScope) => {
        let currentStatus = {};
        const gotNewStatus='gotNewStatus';
          $window.addEventListener('message', evt => {
            if (evt.data.from !== 'openangel') {
              return;
            }
            if (!_.isEqual(currentStatus, evt.data.status)) {
              currentStatus = evt.data.status;
              $rootScope.$emit(gotNewStatus);
            }
          });
        return {
          subscribe: function(scope, callback) {
            var handler = $rootScope.$on(gotNewStatus, callback);
            scope.$on('$destroy', handler);
          },

          currentStatus: function(){
            return currentStatus;
          }
        };
      });
})();
