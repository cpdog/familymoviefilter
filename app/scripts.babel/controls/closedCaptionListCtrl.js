(function() {
  'use strict';
  angular
    .module('openAngel')
    .controller('closedCaptionListCtrl', function(closedCaptionService, videoStateService, $scope, $filter) {
      let vm = this;
      vm.entries = [];
      vm.autoScroll = false;
      let dt = null;

      vm.url = videoStateService.currentStatus().closedCaptionUrl;

      $(document).off('click','.skipLink').on('click','.skipLink',function(){
        let skipTime = $(this).data('ccskip');
        parent.postMessage({ action: 'moveToTime', from: 'openangel', 'time': skipTime}, '*');
      });

      closedCaptionService.getClosedCaptionDataFromUrl(videoStateService.currentStatus().closedCaptionUrl).then(function (data) {
        vm.entries = data;
        dt = $('#closedCaptionTable').dataTable({
          data: vm.entries,
          ordering: false,
          rowId: 'id',
          columns: [
            {data:null, render: function(data){
              return `<a class="skipLink" data-ccskip="${data.start}">Skip to</a>`;
            }},
            {data: 'caption'},
            {data: 'start', render: $filter('formatSeconds')},
            {data: 'end', render: $filter('formatSeconds')}
          ]
        });
      });

      videoStateService.subscribe($scope, function () {
        if (!dt){
          return;
        }
        let status = videoStateService.currentStatus();
        vm.entries.forEach(entry => {
          let newActive = entry.start <= status.currentTime && entry.end >= status.currentTime;
          if (newActive !== entry.active) {
            if (newActive) {
              $(dt.api().row('#' + entry.id).node()).addClass('warning');
              if (vm.autoScroll) {
                dt.fnDisplayRow(dt.api().row('#' + entry.id).node());
              }
            }
            else {
              $(dt.api().row('#' + entry.id).node()).removeClass('warning');
            }
          }
          entry.active = newActive;
        });
      });
    });
})();
