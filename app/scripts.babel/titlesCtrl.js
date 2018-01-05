(function() {
  'use strict';
  angular
    .module('openAngelTitles',[])
    .controller('titlesCtrl', function($http) {
      let vm = this;
      vm.sort = '-createdate';
      $http.get('https://ms001592indfw0001.serverwarp.com/cgi-bin/filter/filterservice.cgi/special/filterservice?gettitles=true&order=createdate&limit=5000').then(function(data){
        vm.movies = data.data.videos;
      });
    });
})();
