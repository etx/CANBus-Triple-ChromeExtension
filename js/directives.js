'use strict';

/* Directives */


angular.module('canbusApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]).
  directive('logger', [function(){
    
    return {
      restrict: 'A',
      link: function ($scope, elem, attrs) {
        
        var logger = new Logger(elem);
        
        $scope.$on('cbt-packet', function(event, data){
          logger.handleSerial( data );
        });
        
        /*
document.addEventListener("serialData", function(event){
          logger.handleSerial( event.detail );
        },false);
        
        $scope.$on( "$destroy", function(){
                                    console.log('Cleanup logger listeners');
                                    document.removeEventListener("serialData");
                                    });  
*/
        
      }
    }
    
  }]);


