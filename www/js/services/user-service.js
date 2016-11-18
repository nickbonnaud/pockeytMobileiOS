(function(angular) {

  var module = angular.module('pockeyt.services.user-service', ['pockeyt.services.api']);

  var UserServiceFactory = [
    '$q',
    '$auth',
    'PockeytApi',
    function($q, $auth, api) {

      var _identity = undefined,
          _apiResponse = undefined,
          _token = undefined,
          _authenticated =false;

      var isIdentityResolved = function() {
        console.log("inside UserService is identity resolved");
        console.log(angular.isDefined(_identity));
        return angular.isDefined(_identity);
      };

      var isAuthenticated = function() {
        console.log("checking if authenticated after identity returned");
        console.log(_authenticated);
        return _authenticated;
      };

      var hasErrorResponse = function() {
        console.log(_apiResponse);
        return _apiResponse;
      };

      var authenticate = function(identity) {
        _identity = identity
        _authenticated = identity != null;
        console.log(_identity);
        console.log(_authenticated);
      };

      var signOut = function() {
        _identity = undefined;
        _authenticated =false;
        _apiResponse = undefined;
        _token = undefined;
      }

      var identity = function() {
        var deferred = $q.defer();
        if (angular.isDefined(_identity)) {
          deferred.resolve(_identity);
          console.log(_identity);
          console.log(deferred.promise);
          return deferred.promise;
        }
        _token = {Authorization: 'Bearer ' + $auth.getToken()};
        console.log(_token);
        api.request('/authenticate/user', null, 'GET', _token)
          .then(function(response) {
            console.log("setting identity from call to server");
            console.log(response);
            _identity = response.data.user;
            _authenticated = true;
            deferred.resolve(_identity);
          })
          .catch(function(response) {
            console.log("error in api call")
            console.log(response);
            _identity = undefined;
            _authenticated = false;
            _apiResponse = response.data.error;
            deferred.resolve(_identity);
          });
        return deferred.promise;
      };

      var setUser = function() {
        return _identity;
      };

      return {
        isIdentityResolved: isIdentityResolved,
        isAuthenticated: isAuthenticated,
        hasErrorResponse: hasErrorResponse,
        authenticate: authenticate,
        identity: identity,
        signOut: signOut,
        setUser: setUser
      };
    }];
  module.factory('UserService', UserServiceFactory);
})(angular);
