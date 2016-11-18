(function(angular) {
  var pockeyt = angular.module('pockeyt.controllers.signup', ['pockeyt.services.api', 'pockeyt.services.pouch-database']);

  var SignupController = function($rootScope, $scope, $auth, $state, api, PouchDatabase) {
    $scope.signup = function() {
      var user = {
        first_name: $scope.first_name,
        last_name: $scope.last_name,
        email: $scope.email,
        password: $scope.password
      }
      $auth.signup(user)
        .then(function(response) {
          console.log(response);
          if (response.data.email === undefined) {
            $rootScope.userId = response.data.user.id;
            PouchDatabase.storeData(response.data);
            $auth.setToken(response.data.user.token);
            $state.go('main.profile', {}, {reload: true});
          } else {
            window.plugins.toast.showWithOptions({
              message: "Sorry that email is taken",
              duration: "short",
              position: "center",
              styling: {
                backgroundColor: '#ef0000'
              }
            });
          }
        })
        .catch(function(response) {
          window.plugins.toast.showWithOptions({
            message: "oops! Something went wrong. Try again",
            duration: "short",
            position: "center",
            styling: {
              backgroundColor: '#ef0000'
            }
          });
        });
    };
    
    $scope.facebookSignIn = function() {
      var fbLoginSuccess = function (userData) {
        console.log(userData);
        facebookConnectPlugin.getAccessToken(function(token) {
          $scope.fbToken = { token : token };
          return api.request('/facebook', $scope.fbToken, 'POST')
            .then(function(response) {
              $rootScope.userId = response.data.user.id;
              PouchDatabase.storeData(response.data);
              $auth.setToken(response.data.user.token);
              $state.go('main.profile', {}, {reload: true});
            })
        });
      };

      facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess,
        function loginError (error) {
          console.error(error)
        }
      );
    };
  };
  pockeyt.controller('SignupController', ['$rootScope', '$scope', '$auth', '$state', 'PockeytApi', 'PouchDatabase', SignupController]);
})(angular);