'use strict';


/* Controllers */

function AppCtrl($scope, $http, $location, ChromeSerial) {
  
  var theSelectedPort;
  
  
  $scope.appName = "CANBus Triple";
  
  $scope.testButton = function(){
    console.log( $location.url() );
  }
  
  $scope.currentPath = function(){
    return $location.url();
  }
  
  $scope.pagename = function(){
    var s = $location.path();
    return s.substr( 1, s.length );
  }
  
  $scope.navigate = function(path){
    console.log("AppCtrl: navigate to "+path);
    $location.url( path );
  }
  
  
  $('.navbar li a').click(function(e) {
    var $this = $(this);
    if (!$this.hasClass('active')) {
      $this.addClass('active');
    }
    e.preventDefault();
  });
  
  
  // $scope.selectedPort;
  
  $scope.portOpen = false;
  
  $scope.loadPorts = function(){
    ChromeSerial.ports().then(function(p){
      $scope.ports = p;
      
      // Select a default
      if( $scope.selectedPort == undefined ){
        var reg = /dev\/cu.usbmodem/;
        p.forEach(function(element, index, array){
          if( reg.test(element) && $scope.selectedPort == undefined){
            $scope.setPort(element);
          }
        });
      }
      
    });  
  }
  $scope.loadPorts();
  
  $scope.setPort = function(port){
    theSelectedPort = port;
    $scope.selectedPort = port;
  }
  
  $scope.portToggle = function(){
    
    if(ChromeSerial.portIsOpen()){
        $scope.portOpen = false;
        ChromeSerial.close();
      }else{
        $scope.portOpen = true;
        ChromeSerial.open(theSelectedPort);
      }
      
  }

  
}

function IndexCtrl($scope, $http, $location) {
  
}
// IndexCtrl.$inject = [];


function LoggerCtrl($scope, ChromeSerial){
  
  /*
  $scope.$on( "$destroy", function(){
                                  ChromeSerial.close();
                                  });
                                  */
  
}


function SettingsCtrl($scope){
    
}


function DiagnosticsCtrl($scope){
  
}