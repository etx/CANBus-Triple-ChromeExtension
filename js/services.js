'use strict';
/* Services */

// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('canbusApp.services', []).
  value('version', '0.2.0');


angular.module('canbusApp.services', [])
  .factory('ChromeSerial', function ($rootScope, $q, $timeout){
    
    var portName;
    var readEnabled = false;
    var readInterval;
    var connectionId;
    var charBuffer = "";
    var portOpen = false;
    var cbtFound = false;
    var lastPortName;
    
    
    var openSerial = function(name, opts){
        
        lastPortName = name;
        
        var deferred = $q.defer();
        chrome.serial.open(name, opts, function(openInfo){
          connectionId = openInfo.connectionId;
          deferred.resolve(openInfo);
          // set a read interval
          readInterval = setInterval(readPort, 3);
          portOpen = true;
          readEnabled = true;
          
          // Send version command
          $timeout(function(){
            sendCommand([0x01, 0x01]);
          }, 50);
          
        });
        
        $timeout( function(){
          if(cbtFound == false){
            deferred.reject(new Error("Serial port "+name+" timeout."));
            $rootScope.$broadcast('chromeSerialTimeout', name);
            closeSerial();
          }
        }, 200 );
        
        return deferred.promise;
        
      }
      
      
    var closeSerial = function(){
        
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
        
      }
      
      
    var writeSerial = function( data ){
        var deferred = $q.defer();
        if(connectionId !== undefined){
          chrome.serial.write(connectionId, data, function(writeInfo){
            deferred.resolve(writeInfo);
          });
        }else
          deferred.resolve(false);
        
        return deferred.promise;
      }
    
    
    function sendCommand( command, payload ){
      
      if( !portOpen ){
        $rootScope.$broadcast('chromeSerialCannotSend'); // TODO Handle this
        return;
        }
      
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
    
    
    var reset = function(theSelectedPort){
      
      if(theSelectedPort == undefined)
        theSelectedPort = lastPortName;
      
      closeSerial();
    
      $timeout(function(){
        openSerial(theSelectedPort, {'bitrate':1200});
        $timeout(function(){
          closeSerial();
          $timeout(function(){
            console.log("reconnect");
            openSerial(theSelectedPort, {'bitrate':57600});
          }, 8000);
        }, 30);
      }, 30);

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
      resetHardware: reset,
      open: openSerial,
      close: closeSerial,
      write: writeSerial,
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
    
    
    /*
    *   Human readable object of PIDs for view rendering.
    */                 
    var managedPids = [];
    for(var i=0; i<pids.length; i++)
      managedPids.push({ busId:0,
                        settings: [],
                        value: 0,
                        txd: 'txddd',
                        rxf: 'rxfff',
                        rxd: 'rxddd',
                        mth: 'math',
                        name: 'Name'
                      });
    
    /*
    *   Convert eeprom buffer to managed pid object
    */                 
    var updateManagedPids = function(){
      
      managedPids.forEach(function(element, index, array){
        element.busId = pids[index].busId[0];
        element.settings = pids[index].settings[0];
        // element.value = (pids[index].value[1] << 8) + pids[index].value[0];
        element.value = Util.byteArrayToHex(pids[index].value).toUpperCase();
        element.txd = Util.byteArrayToHex(pids[index].txd).toUpperCase();
        element.rxf = Util.byteArrayToHex(pids[index].rxf).toUpperCase();
        element.rxd = Util.byteArrayToHex(pids[index].rxd).toUpperCase();
        element.mth = Util.byteArrayToHex(pids[index].mth).toUpperCase();
        element.name = Util.byteArrayToString(pids[index].name); 
      });
      
    }
    
    /*
    *   Convert eeprom buffer to managed pid object
    */
    var updateEepromPids = function(){
      
      managedPids.forEach(function(element, index, array){
        pids[index].busId.clear().set( [element.busId] );
        // pids[index].settings.set();
        pids[index].value.clear().set( Util.hexToByteArray( element.value ) );
        pids[index].txd.clear().set( Util.hexToByteArray( element.txd ) );
        pids[index].rxf.clear().set( Util.hexToByteArray( element.rxf ) );
        pids[index].rxd.clear().set( Util.hexToByteArray( element.rxd ) );
        pids[index].mth.clear().set( Util.hexToByteArray( element.mth ) );
        pids[index].name.clear().set( Util.stringToByteArray( element.name ) );
        
      });
      
    }
    
    /*
    *   Events
    */
    $rootScope.$on("cbt-event", handleDataEvent);
    
    function handleDataEvent(event, data){
      
      switch(data.event){
        case 'settings':
          var bytes = data.eeprom.split(':');
          bytes.forEach(function(element, index, array){
            eepromView[index] = parseInt(element, 16);
          });
          
          updateManagedPids();
          $rootScope.$apply();
          
        break;
        case 'eepromSave':
          console.log(data);
          ChromeSerial.resetHardware();
        break;
        case 'eepromData':
          console.log(data);
        break;
      }
      
    }

    
    return {
      pids: managedPids,
      load: function(){
        // Ask for eeprom
        ChromeSerial.command([0x01, 0x02]);
      },
      debugEeprom: function(){
        console.log( pids );
      },
      sendEeprom: function(){
        updateEepromPids();
        ChromeSerial.command([0x01, 0x03] , eepromBuffer );
      }
    }
    
  });

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
