'use strict';


/* Controllers */

function AppCtrl($scope, $http, $location, ChromeSerial, $timeout) {
  
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
  
  
  
  $scope.portOpen = false;
  
  $scope.$on('chromeSerialOpen', function(){
    console.log("chrome serial open");
    $scope.portOpen = true;
    $scope.$apply();
  });
  $scope.$on('chromeSerialClose', function(){
    console.log("chrome serial close");
    $scope.portOpen = false;
    $scope.$apply();
  });
  $scope.$on('chromeSerialTimeout', function(){
    console.log("chrome serial timed out");
    $scope.portOpen = false;
    $scope.$apply();
  });
  
  
  $scope.loadPorts = function(){
    ChromeSerial.ports().then(function(p){
      $scope.ports = p;
      
      // Select a default
      if( $scope.selectedPort == undefined ){
        var reg = /dev\/cu.usbmodem/;
        p.forEach(function(element, index, array){
          if( reg.test(element) && $scope.selectedPort == undefined){
            $scope.setPort(element);
            // Auto connect if we find usbmodem
            if(!ChromeSerial.portIsOpen()) $scope.portToggle();
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
        ChromeSerial.close();
      }else{
        ChromeSerial.open(theSelectedPort, {'bitrate':57600});
      }
      
  }
  
  $scope.resetHardware = function(){
    ChromeSerial.resetHardware($scope.selectedPort);
  }

  
}

function IndexCtrl($scope, $http, $location) {
  
}
// IndexCtrl.$inject = [];


function LoggerCtrl($scope, $rootScope, ChromeSerial, flash){
  
  $scope.logBtnLabel = "Log Off";
  $scope.activeBusses = [true, true, true];
  $scope.logMode = 0;
  $scope.logFilter = "";
  
  $scope.$on("cbt-event", function(event, data){
    switch(data.event){
      case 'logMode':
        $scope.logMode = data.mode;
        $scope.logFilter = data.filter;
      break;
      case 'logBusFilter':
        for(var i=0; i<$scope.activeBusses.length; i++)
          $scope.activeBusses[i] = ((1 << i) & parseInt(data.mode, 16)) == (1 << i);
      break;
      case 'version':
        flash.success = data.name+" :: "+data.version;
        // if(data.version != version) console.log("Hardware version mismatch "+version);
      break;
      default:
        
      break;
    }
    $scope.$apply();
  });
  
  
  $scope.$on('chromeSerialOpen', function(event){
    $scope.sendBusSettings();
    setTimeout( $scope.sendLogSettings, 120 );    
  });
  
  
  // Bus switches
  $scope.toggleBus = function( i ){
    $scope.activeBusses[i] = !$scope.activeBusses[i];
    $scope.sendBusSettings();
  }
  
  $scope.sendBusSettings = function(){
    var buffer = new ArrayBuffer(2);
    var uint8View = new Uint8Array(buffer);
    uint8View[0] = 0x4;
    uint8View[1] = 0x0;
    
    if( $scope.activeBusses[0] ) uint8View[1] += 0x1;
    if( $scope.activeBusses[1] ) uint8View[1] += 0x2;
    if( $scope.activeBusses[2] ) uint8View[1] += 0x4;
    
    ChromeSerial.write( buffer ).then(function(writeInfo){});
  }
  
  $scope.sendLogSettings = function(){
    // Start logging
    ChromeSerial.command([0x03, !$scope.logMode, 0x00, 0x00 ]);
  }
  
  
}


function SettingsCtrl($scope, ChromeSerial, CBTSettings){
  
  $scope.alerts = [
  ];
  
  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
    $scope.$apply();
  };
  
  $scope.resetStockCmd = function(){
    ChromeSerial.command([0x01, 0x04]);
  }
  
  $scope.init = function(){      
    CBTSettings.load();
  }
  
  $scope.dbg = function(){
    /* CBTSettings.debugEeprom(); */
    console.log( CBTSettings.pids );
  }
  
  $scope.sendEeprom = function(){
    CBTSettings.sendEeprom();
  }

  $scope.pids = CBTSettings.pids;
  
  
  $scope.$on('chromeSerialOpen', function(){
    $scope.init();
  });
  
  $scope.$on("cbt-event", function(event, data){
    switch(data.event){
      case 'eepromSave':
        // Show saved message
        $scope.alerts.push({msg: "Settings Saved", type:'success'});
        $scope.$apply();
      break;
    }
  });
  
  
}


function DiagnosticsCtrl($scope){
  
}