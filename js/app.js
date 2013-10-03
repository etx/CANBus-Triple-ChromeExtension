'use strict';


// Declare app level module which depends on filters, and services
angular.module('canbusApp', ['canbusApp.filters', 'canbusApp.services', 'canbusApp.directives', 
                             'angular-flash.service', 'angular-flash.flash-alert-directive']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    
    $routeProvider.
      when('/', {
        templateUrl: 'partials/logger.html',
        controller: LoggerCtrl
        }).
      when('/diag', {
        templateUrl: 'partials/diag.html',
        controller: DiagnosticsCtrl
        }).
      when('/settings', {
        templateUrl: 'partials/settings.html',
        controller: SettingsCtrl
        }).
      otherwise({redirectTo: '/'});
    
    // $locationProvider.html5Mode(true);
    
  }]);


$().ready(function(){
  
  
  
});

/*

$('.btn-group > .btn, .btn[data-toggle="button"]').click(function() {
var buttonClasses = ['btn-primary','btn-danger','btn-warning','btn-success','btn-info','btn-inverse'];
var $this = $(this);
    
    if ($(this).attr('class-toggle') != undefined && !$(this).hasClass('disabled')) {
        
        var btnGroup = $this.parent('.btn-group');
        var btnToggleClass = $this.attr('class-toggle');
        var btnCurrentClass = $this.hasAnyClass(buttonClasses);
        
        
        if (btnGroup.attr('data-toggle') == 'buttons-radio') {
            var activeButton = btnGroup.find('.btn.active');
            var activeBtnClass = activeButton.hasAnyClass(buttonClasses);
            
            activeButton.removeClass(activeBtnClass).addClass(activeButton.attr('class-toggle')).attr('class-toggle',activeBtnClass);
            
         
        }

      
            $this.removeClass(btnCurrentClass).addClass(btnToggleClass).attr('class-toggle',btnCurrentClass);
       

    }



});    

$.fn.hasAnyClass = function(classesToCheck) {
  for (var i = 0; i < classesToCheck.length; i++) {
    if (this.hasClass(classesToCheck[i])) {
      return classesToCheck[i];
    }
  }
  return false;
}


*/








