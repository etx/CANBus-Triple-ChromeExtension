'use strict';


// Declare app level module which depends on filters, and services
angular.module('canbusApp', ['canbusApp.filters', 'canbusApp.services', 'canbusApp.directives']).
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













