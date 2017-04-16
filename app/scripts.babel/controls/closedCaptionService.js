(function(){
    'use strict';
    angular
      .module('openAngel')
      .factory('closedCaptionService', ($http, $q) => {
        let lastUrl = null;
        let lastEntries = null;
        const re = /(\d+):(\d+):(\d+)\.(\d+)/;

        return {
          getClosedCaptionDataFromUrl: function(url) {
            var deferred = $q.defer();
            if (lastUrl === url) {
              deferred.resolve(lastEntries);
            }
            else {
              $http.get(url).then(data => {
                let $ = window.jQuery;
                let doc = $($.parseXML(data.data));
                let id = 1;
                let mapped = $.map(doc.find('p'), function (x) {
                  let el = $(x);
                  el.html(el.html().replace('/>', '/> '));
                  let begin = el.attr('begin');
                  let end = el.attr('end');

                  if (begin.indexOf(':') === -1){
                    begin = parseInt(el.attr('begin'),10)/10000000;
                    end = parseInt(el.attr('end'),10)/10000000;
                  }
                  else{
                    let result = re.exec(begin);
                    begin = (result[1] * 3600) +  (result[2] * 60) + parseInt(result[3],10) + (result[4]/1000);

                    result = re.exec(end);
                    end = (result[1] * 3600) +  (result[2] * 60) + parseInt(result[3],10) + (result[4]/1000);
                  }

                  return {
                    caption: el.text(),
                    start: begin,
                    end: end,
                    id: id++,
                    active: false
                  };
                }, function () {
                  deferred.reject();
                });

                lastUrl = url;
                lastEntries = mapped;
                deferred.resolve(mapped);

              });
            }

            return deferred.promise;
          }
        };
      });
})();
