(function() {
  'use strict';
  angular
    .module('openAngel')
    .controller('closedCaptionListCtrl', function(videoStateService, $scope, $filter) {
      let vm = this;
      vm.entries = videoStateService.currentStatus().closedCaptionList;
      vm.autoScroll = false;
      let dt = null;

      $(document).off('click','.skipLink').on('click','.skipLink',function(){
        let skipTime = $(this).data('ccskip');
        parent.postMessage({ action: 'moveToTime', from: 'openangel', 'time': skipTime}, '*');
      });

      dt = $('#closedCaptionTable').dataTable({
        data: vm.entries,
        ordering: false,
        rowId: 'id',
        columns: [
          {data:null, render: function(data){
            return `<a class="skipLink" data-ccskip="${data.start}">Skip to</a>`;
          }},
          {data:null, render: function(data){
            return `<a href="#!/filterHelper/${data.id}">Open in filter helper</a>`;
          }},
          {data: 'caption'},
          {data: 'start', render: $filter('formatSeconds')},
          {data: 'end', render: $filter('formatSeconds')},
          {data: 'wouldAutoMute', render: x => x ? 'Yes' : 'No'}
        ]
      });

      $scope.$watch('vm.autoMute', function(){
        if (vm.autoMute) {
          dt.api().column(5).search('Yes').draw();
        }
        else{
          dt.api().column(5).search('').draw();
        }
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
