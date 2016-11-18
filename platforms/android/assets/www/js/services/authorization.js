(function(angular) {

  var module = angular.module('pockeyt.services.authorization', ['pockeyt.services.user-service']);

  var AuthorizationFactory = [
    '$rootScope',
    '$state',
    '$location',
    'UserService',
    function($rootScope, $state, $location, UserService) {

      var authorize = function() {
        console.log(UserService.identity());
        return UserService.identity()
          .then(function() {
            var isAuthenticated = UserService.isAuthenticated();
            if (!isAuthenticated) {
              $rootScope.returnToState = $rootScope.toState;
              $rootScope.returnToStateParams = $rootScope.toStateParams;
              if (UserService.hasErrorResponse() === "token_not_provided") {
                $state.go('main.signup');
              } else {
                $state.go('main.login');
              }
            }
            console.log(UserService.setUser());
            return UserService.setUser();
          });
      };
      return {
        authorize: authorize
      };
    }];
  module.factory('Authorization', AuthorizationFactory);
})(angular);
