(function(){
  'use strict';
  angular.module('openAngel').config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/home');
    //return;
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
        templateUrl: 'views/closedCaptions.html',
        controller: 'closedCaptionsCtrl as vm',
        url:'/closedcaptions'
      }).state('app.filterList', {
        templateUrl: 'views/filterList.html',
        controller: 'filterListCtrl as vm',
        url:'/filterList'
      });
  });
})();
