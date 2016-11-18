(function(angular) {
  var pockeyt = angular.module('pockeyt.controllers.login', ['pockeyt.services.api', 'pockeyt.services.pouch-database']);

  var LoginController = function($scope, $auth, $state, api, PouchDatabase) {
    $scope.login = function() {
      $auth.login($scope.user)
        .then(function(response) {
          $rootScope.userId = response.data.user.id;
          PouchDatabase.storeData(response.data);
          $auth.setToken(response.data.user.token);
          $state.go('main.profile', {}, {reload: true});
        })
        .catch(function(error) {
          if (error.status === 401) {
            window.plugins.toast.showWithOptions({
              message: "oops! Your password or email is incorrect",
              duration: "short",
              position: "center",
              styling: {
                backgroundColor: '#ef0000'
              }
            });
          } else {
            window.plugins.toast.showWithOptions({
              message: "oops! Something went wrong. Try again",
              duration: "short",
              position: "center",
              styling: {
                backgroundColor: '#ef0000'
              }
            });
          }
        });
    };
    $scope.authenticateFB = function() {
      facebookConnectPlugin.getLoginStatus(function onLoginStatus(userData) {
        if (userData.status === 'connected') {
          var fbID = { fbID: userData.authResponse.userID};
          return api.request('/authenticate', fbID, 'POST')
            .then(function(response) {
                $rootScope.userId = response.data.user.id;
                PouchDatabase.storeData(response.data);
                $auth.setToken(response.data.user.token);
                $state.go('main.profile', {}, {reload: true});
            })
        } else {
          var fbLoginSuccess = function (userData) {
            console.log(userData);
            facebookConnectPlugin.getAccessToken(function(token) {
              $scope.fbToken = { token : token };
              return api.request('/facebook', $scope.fbToken, 'POST')
                .then(function(response) {
                  console.log(response);
                  $rootScope.userId = response.data.user.id;
                  PouchDatabase.storeData(response.data);
                  auth.setToken(response.data.user.token);
                  $state.go('main.profile', {}, {reload: true});
                })
            });
          };
          facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess,
            function loginError (error) {
              console.error(error)
            }
          );
        }
      });
    };
  };
  pockeyt.controller('LoginController', ['$scope', '$auth', '$state', 'PockeytApi', 'PouchDatabase', LoginController]);
})(angular);