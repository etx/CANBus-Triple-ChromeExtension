


function Logger( g ){
  
  console.log("New logger instance");
  
  // this.grid = $('#main-grid');
  // this.gridBody = $('#main-grid tbody');
  
  this.grid = g;
  this.gridBody = $(g).find('tbody');
  
  }
  
Logger.prototype.handleSerial = function(packet) {
  
    // Message object?
  if( packet.id ){
    
    if( this.grid.find('#msg'+packet.id).length ){
      
      var row = this.grid.find('#msg'+packet.id);
      var changed = false;
      
      $.each(packet.payload, function(i, v){
      	var cell = row.find('.b'+i);
      	if( cell.html() != v ){
        	  changed = true;
          cell.html(v)
          .css({backgroundColor:'red'})
          .animate({ backgroundColor:'#444' }, 1000);
        }
      });
      
      if( row.find('.buschannel').html() != packet.channel ){
        row.find('.buschannel').html(packet.channel)
        		.css({backgroundColor:'pink'})
          	.animate({ backgroundColor:'#444' }, 1000);;
      }
      
      if(changed){
      	row.find('.string').html( hexArrayToString(packet.payload) );
      	row.find('.aid').css({backgroundColor:'lightblue'})
          			.animate({ backgroundColor:'#444' }, 1000);
      	}
      
    }else{
      this.gridBody.prepend( renderRow(packet) );
    }
 }
 
  // Bus status
  if( packet.status ){
    
    var busDom = $('#channel-'+packet.channel.replace(/\s/g, '').toLowerCase());
    
    if(busDom.length < 1){
      // Add new
      var newDom = getStatusFrag('channel-'+packet.channel.replace(/\s/g, '').toLowerCase(), packet.channel );
      $('.bus-status').append(newDom);
      $("[rel='tooltip']").tooltip();
    }
    
    var leds = busDom.find('.led');
    
    leds.each(function(index, value){
      if( (1 << index) & parseInt(packet.status) ){
        $(value).addClass('on');
      }
    });
    
  }
  
  
  /*
  * Methods
  */
  
  function getStatusFrag(id, label){
    
    return '<div id="'+id+'" class="bus pull-left">'+
      '<p clas="label">'+label+'</p>'+
      '<div rel="tooltip" class="led off pull-left" title="CANINTF.RX0IF">7</div>'+
      '<div rel="tooltip" class="led off pull-left" title="CANINTFL.RX1IF">6</div>'+
      '<div rel="tooltip" class="led off pull-left" title="TXB0CNTRL.TXREQ">5</div>'+
      '<div rel="tooltip" class="led off pull-left" title="CANINTF.TX0IF">4</div>'+
      '<div rel="tooltip" class="led off pull-left" title="TXB1CNTRL.TXREQ">3</div>'+
      '<div rel="tooltip" class="led off pull-left" title="CANINTF.TX1IF">2</div>'+
      '<div rel="tooltip" class="led off pull-left" title="TXB2CNTRL.TXREQ">1</div>'+
      '<div rel="tooltip" class="led off pull-left" title="CANINTF.TX2IF">0</div>'+
    '</div>';
    
  }
  
  function renderRow(obj){
  	var dom = '<tr id="msg'+obj.id+'"><td class="buschannel">'+obj.channel+'</td><td>'+obj.status+'</td><td>'+obj.length
  				+'</td><td class="aid">'+obj.id+'</td><td class="b0">'+
  				obj.payload[0]+'</td><td class="b1">'+
  				obj.payload[1]+'</td><td class="b2">'+
  				obj.payload[2]+'</td><td class="b3">'+
  				obj.payload[3]+'</td><td class="b4">'+
  				obj.payload[4]+'</td><td class="b5">'+
  				obj.payload[5]+'</td><td class="b6">'+
  				obj.payload[6]+'</td><td class="b7">'+
  				obj.payload[7]+'</td><td class="string">'+
  				hexArrayToString(obj.payload)+'</td></tr>';
  	return dom;
  }
  
  
  function hexArrayToString( payload ){
  	return toAscii(payload[0]+":"+payload[1]+":"+payload[2]+":"+payload[3]+":"+
  					payload[4]+":"+payload[5]+":"+payload[6]+":"+payload[7]);
  }
  
  
  function camelToDash( str ){
    return str.replace(/\W+/g, '-')
              .replace(/\s/g, ' ')
              .replace(/([a-z\d])([A-Z])/g, '$1-$2');
  }
  
  
  function dashToCamel(str) {
    return str.replace(/\W+(.)/g,
      function (x, chr) {
        return chr.toUpperCase();
    })
  }
  
  
  function toAscii( valueStr ){
  
    var symbols = " !\"#$%&'()*+,-./0123456789:;<=>?@";
    var loAZ = "abcdefghijklmnopqrstuvwxyz";
    symbols+= loAZ.toUpperCase();
    symbols+= "[\\]^_`";
    symbols+= loAZ;
    symbols+= "{|}~";
  	
  	valueStr = valueStr.toLowerCase();
      var hex = "0123456789abcdef";
  	var text = "";
  	var i=0;
  
  	for( i=0; i<valueStr.length; i=i+2 )
  	{
  		var char1 = valueStr.charAt(i);
  		if ( char1 == ':' )
  		{
  			i++;
  			char1 = valueStr.charAt(i);
  		}
  		var char2 = valueStr.charAt(i+1);
  		var num1 = hex.indexOf(char1);
  		var num2 = hex.indexOf(char2);
  		var value = num1 << 4;
  		value = value | num2;
  
  		var valueInt = parseInt(value);
  		var symbolIndex = valueInt - 32;
  		var ch = '?';
  		if ( symbolIndex >= 0 && value <= 126 )
  		{
  			ch = symbols.charAt(symbolIndex)
  		}
  		text += ch;
  	}
  
  	return text;
  }

  
  
  
  
};








