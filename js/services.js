'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('canbusApp.services', []).
  value('version', '0.1');


angular.module('canbusApp.services', [])
  .factory('ChromeSerial', function ($rootScope, $q){
    
    var portName;
    var readInterval;
    var connectionId;
    var charBuffer = "";
    var portOpen = false;
    
    
    function readPort(){
      
      chrome.serial.read(connectionId, 256, function( readInfo ){
        
        if( readInfo.bytesRead > 0 ){
          // Read line
          charBuffer += String.fromCharCode.apply(null, new Uint8Array(readInfo.data));
          
          var lineArray = charBuffer.split("\r\n");
          charBuffer = lineArray[lineArray.length-1];
          
          if( lineArray.length-1 > 0 )
            for( var i=0; i<lineArray.length-1; i++ )
              document.dispatchEvent(new CustomEvent( "serialData", {
                                                  		detail: lineArray[i],
                                                  		bubbles: true,
                                                  		cancelable: true
                                                      }));
        }
        
      });
        
    }
    
    // Return extenal interface
    return {
      
      portIsOpen: function(){
        return portOpen;
      },
      
      ports: function(){
        var deferred = $q.defer();
        chrome.serial.getPorts(function(ports){
          deferred.resolve(ports);
        });
        return deferred.promise;
      },
      
      open: function(name){
        
        var deferred = $q.defer();
        chrome.serial.open(name, {'bitrate':56700}, function(openInfo){
          connectionId = openInfo.connectionId;
          deferred.resolve(openInfo);
          // set a read interval
          readInterval = setInterval(readPort,3);
          portOpen = true;
        });
        
        /*
        setTimeout( function(){
          deferred.reject(new Error("Serial port "+name+" timeout."));
        }, 500 );
        */
        return deferred.promise;
        
      },
      close: function(){
        
        clearInterval(readInterval);
        
        var deferred = $q.defer();
        
        if(connectionId !== undefined)
          chrome.serial.close(connectionId, function(bool){
            deferred.resolve(bool);
            connectionId = undefined;
            portOpen = false;
          });
        else
          deferred.resolve(false);
        
        return deferred.promise;
        
      }
      
    }
    
    
    /*
    chrome.serial.open(portName, {'bitrate':56700}, function(openInfo){
      console.log( openInfo );
      connectionId = openInfo.connectionId;
    
      // Got connection
      console.log('connectionId'+connectionId);  
      chrome.serial.read(connectionId, 256, function( readInfo ){
        console.log( readInfo );
      });
      
    });
    */
    
    
    
  });
