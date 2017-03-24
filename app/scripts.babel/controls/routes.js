'use strict';
(function(){
  angular.module('openAngel').config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/home');
    $stateProvider
      .state('app',{
        abstract: true,
        template:'<ui-view/>'
      })
      .state('app.home', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl as vm',
        url:'/home'
      })
      .state('app.closedCaptions', {
        templateUrl: 'views/kudosCategory/list.html',
        controller: 'closedCaptionsCtrl as vm',
        url:'/closedcaptions'
      });
  });
})();
