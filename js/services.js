'use strict';
/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('canbusApp.services', []).
  value('version', '0.2.0');


angular.module('canbusApp.services', [])
  .factory('ChromeSerial', function ($rootScope, $q){
    
    var portName;
    var readEnabled = false;
    var readInterval;
    var connectionId;
    var charBuffer = "";
    var portOpen = false;
    var cbtFound = false;
    
    function sendCommand( command, payload ){
      
      if(!(command instanceof Array)) return;
      
      var chunkSize = 32,
          buffer,
          uint8View,
          i = 0;
      
      if( payload instanceof ArrayBuffer ){
        
        var prepChunk = function(i){
          buffer = new ArrayBuffer( command.length + chunkSize + 2 );
          uint8View = new Uint8Array(buffer);
          uint8View.set(command);
          uint8View[command.length] = i;
          uint8View.set( new Uint8Array(payload, chunkSize*i, chunkSize), command.length+1 );
          uint8View[buffer.byteLength-1] = 0xA1; // Check byte
        }
        
        var sendChunk = function(){
          
          prepChunk(i);
          chrome.serial.write(connectionId, buffer, function(writeInfo){
            
            i++;
            if( (i*chunkSize)<payload.byteLength )
              setTimeout( sendChunk, 20 );
              else
              readEnabled = true;
            
          });
        }
        
        readEnabled = false;
        sendChunk();
        
        
      }else{
        buffer = new ArrayBuffer( command.length );
        uint8View = new Uint8Array(buffer);
        uint8View.set(command);
        chrome.serial.write(connectionId, buffer, function(writeInfo){});
      }
      
      
    }
    
    function readPort(){
      
      if(!readEnabled) return;
      
      chrome.serial.read(connectionId, 64, function( readInfo ){
        
        if( readInfo.bytesRead > 0 ){
          // Read line
          // charBuffer += String.fromCharCode.apply(null, new Uint8Array(readInfo.data));
          charBuffer += String.fromCharCode.apply(null, new Uint8Array(readInfo.data.slice(0, readInfo.bytesRead)));
          
          var lineArray = charBuffer.split("\r\n");
          charBuffer = lineArray[lineArray.length-1];
          
          if( lineArray.length-1 > 0 )
            for( var i=0; i<lineArray.length-1; i++ ){
            
              // Parse JSON
              try{
                var obj = jQuery.parseJSON( lineArray[i] );
              } catch(e){
                throw e;
              }
              
              if( !cbtFound && obj.event == "version" ){
                cbtFound = true;
                $rootScope.$broadcast('chromeSerialOpen');
              }
              
              // Dispatch object to app
              if( obj && cbtFound )
              switch( true ){
                case (obj.packet != undefined):
                  $rootScope.$broadcast("cbt-packet", obj.packet );
                break;
                case (obj.event != undefined):
                  $rootScope.$broadcast("cbt-event", obj );
                break;
                default:
                  console.log("Unknown data from CBT");
                  console.log(obj);
                break;
              }
              

            }

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
      
      open: function(name, opts){
        
        var deferred = $q.defer();
        chrome.serial.open(name, opts, function(openInfo){
          connectionId = openInfo.connectionId;
          deferred.resolve(openInfo);
          // set a read interval
          readInterval = setInterval(readPort, 3);
          portOpen = true;
          readEnabled = true;
          
          // Send version command
          sendCommand([0x1, 0x01]);
          
        });
        
        /*
        setTimeout( function(){
          deferred.reject(new Error("Serial port "+name+" timeout."));
        }, 500 );
        */
        return deferred.promise;
        
      },
      close: function(){
        
        var deferred = $q.defer();
        
        if(connectionId !== undefined)
          chrome.serial.close(connectionId, function(bool){
            deferred.resolve(bool);
            connectionId = undefined;
            
            portOpen = false;
            cbtFound = false;
            readEnabled = false;
            clearInterval(readInterval);
            $rootScope.$broadcast('chromeSerialClose');
            
          });
        else
          deferred.resolve(false);
        
        return deferred.promise;
        
      },
      write: function( data ){
        var deferred = $q.defer();
        if(connectionId !== undefined){
          chrome.serial.write(connectionId, data, function(writeInfo){
            deferred.resolve(writeInfo);
          });
        }else
          deferred.resolve(false);
        
        return deferred.promise;
      },
      command: function( data ){
        // sendCommand(data);
        sendCommand.apply(this, arguments);
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
    
  })
  .factory('CBTSettings', function ($rootScope, $q, ChromeSerial){
    
    var eepromBuffer = new ArrayBuffer(512);
    var eepromView = new Uint8Array(eepromBuffer);

    // EEPROM Struct
    var displayEnabled = new Uint8Array(eepromBuffer, 0, 1);
    var firstboot = new Uint8Array(eepromBuffer, 1, 1);;
    /*
    var placeholder2 = new Uint8Array(eepromBuffer, 2, 1);
    var placeholder3 = new Uint8Array(eepromBuffer, 3, 1);
    var placeholder4 = new Uint8Array(eepromBuffer, 4, 1);
    var placeholder5 = new Uint8Array(eepromBuffer, 5, 1);
    var placeholder6 = new Uint8Array(eepromBuffer, 6, 1);
    var placeholder7 = new Uint8Array(eepromBuffer, 7, 1);
    */
    
    var pids = new Array();
    var l = 34;
    for(var i=0; i<8; i++){
      pids.push({
        busId: new Uint8Array(eepromBuffer, 8+(l*i), 1),
        settings: new Uint8Array(eepromBuffer, 9+(l*i), 1),
        value: new Uint8Array(eepromBuffer, 10+(l*i), 2),
        txd: new Uint8Array(eepromBuffer, 12+(l*i), 8),
        rxf: new Uint8Array(eepromBuffer, 20+(l*i), 6),
        rxd: new Uint8Array(eepromBuffer, 26+(l*i), 2),
        mth: new Uint8Array(eepromBuffer, 28+(l*i), 6),
        name: new Uint8Array(eepromBuffer, 34+(l*i), 8)
      });
    }
    
    // var padding = new Uint8Array(eepromBuffer, 40, 32);
    
    
    $rootScope.$on("cbt-event", handleDataEvent);
    
    function handleDataEvent(event, data){
      
      switch(data.event){
        case 'settings':
          var bytes = data.eeprom.split(':');
          bytes.forEach(function(element, index, array){
            eepromView[index] = parseInt(element, 16);
          });
          
          $rootScope.$apply();
          
        break;
        case 'eepromSave':
          console.log(data);
        break;
        case 'eepromData':
          console.log(data);
        break;
      }
      
    }

    
    return {
      pids: pids,
      load: function(){
        // Ask for eeprom
        ChromeSerial.command([0x01, 0x02]);
      },
      debugEeprom: function(){
        console.log( pids );
      },
      sendEeprom: function(){
        ChromeSerial.command([0x01, 0x03] , eepromBuffer );
      }
    }
    
  });

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
