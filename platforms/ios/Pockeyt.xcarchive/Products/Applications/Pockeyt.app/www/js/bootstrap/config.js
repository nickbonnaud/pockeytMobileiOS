(function(angular) {

  var module = angular.module('pockeyt.bootstrap.services.config', []);

  module.factory('pockeytConfig', ['$http', '$timeout', '$q', function($http, $timeout, $q) {
    var pockeytConfig;
    return pockeytConfig = {
      _config: {},
      _readyQueue: [],
      ready: false,

      _load: function() {
        if(!pockeytConfig.ready) {
          $http.get('config.json')
              .then(
                  function(resp) {
                    pockeytConfig._config = resp.data;
                    pockeytConfig.ready = true;

                    while(pockeytConfig._readyQueue.length > 0) {
                      (function() {
                        var waiting = pockeytConfig._readyQueue.shift();
                        pockeytConfig.get.apply(waiting.context, waiting.arguments).then(waiting.deferred.resolve, waiting.deferred.reject);
                      })();
                    }
                  },
                  function(resp) {
                    console.error('Failed to load configuration.', resp);
                    alert('Failed to load configuration. Exiting.');
                    navigator.app.exitApp();
                  }
              );
        }

        return true;
      },

      get: function(key, def) {
        if(pockeytConfig.ready) {
          if(typeof def ==='undefined') def = null;
          var data;
          if(typeof key === 'undefined') {
            data = pockeytConfig._config;
          } else {
            data = (typeof pockeytConfig._config[key] === 'undefined') ? def : pockeytConfig._config[key]
          }
          return $q.resolve(data);
        } else {
          var deferred = $q.defer();
          pockeytConfig._readyQueue.push({deferred: deferred, context: this, arguments: arguments});
          return deferred.promise;
        }
      }
    };
  }]);

  module.run(['pockeytConfig', function(config) {
    config._load();
  }]);

})(angular);