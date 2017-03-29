(function() {
  'use strict';
  angular
    .module('openAngel')
    .controller('filterListCtrl', function(videoStateService, $scope, _) {
      let vm = this;
      vm.currentStatus = videoStateService.currentStatus();

      videoStateService.subscribe($scope, function(){
        if (!_.isEqual(angular.toJson(vm.currentStatus.entries), angular.toJson(videoStateService.currentStatus().entries))) {
          vm.currentStatus = videoStateService.currentStatus();
          $scope.$apply();
        }
      });
    });
})();
