(function(angular) {

  var pockeytService = angular.module('pockeyt.services.whitelabel', []);

  pockeytService.factory('whitelabel', ['$rootScope', function($rootScope) {
    if(typeof window.whitelabel === 'undefined') {
      var async_noop = function(val) {
        return function(success, success1, success2) {
          if(typeof success === 'function') success(val);
          else if(typeof success1 === 'function') success1(val);
          else if(typeof success2 === 'function') success2(val);
          else return val;
        }
      };
      return {
        checkForActiveSessions: async_noop({result: true, timestamp: -1}),
        logout: async_noop(),
        pub: async_noop(),
        publish: async_noop(),
        registerUser: async_noop(),
        showLaunchKeyAuthenticationModal: async_noop(),
        showLaunchKeyPairModal: async_noop(),
        showLaunchKeySettingsModal: async_noop(),
        sub: async_noop(),
        subscribe: async_noop(),
        unpair: async_noop(),
        unsub: async_noop(),
        unsubscribe: async_noop()
      };
    }

    var instance = window.whitelabel.getInstance();

    instance.subscribe('logout', function() {
      $rootScope.$broadcast('whitelabel.logout');
    });
    instance.subscribe('unpair', function() {
      $rootScope.$broadcast('whitelabel.unpair');
    });
    instance.subscribe('authentication.success', function() {
      $rootScope.$broadcast('whitelabel.authentication.success');
    });
    instance.subscribe('authentication.failure', function() {
      $rootScope.$broadcast('whitelabel.authentication.failure');
    });

    return instance;
  }]);

})(angular);