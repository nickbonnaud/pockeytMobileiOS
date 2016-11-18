(function(angular) {

  var module = angular.module('pockeyt.controllers.profile', ['pockeyt.services.api', 'pockeyt.services.user-service', 'pockeyt.services.pouch-database']);

  var ProfileController = function($scope, $auth, $state, api, UserService, authorize, PouchDatabase) {
    if(typeof analytics !== "undefined") { analytics.trackView("Profile View"); }

    $scope.getProfile = function() {
      console.log(authorize);
      $scope.user = authorize;
      // return api.request('/authenticate/user')
      //   .then(function(response) {
      //     $scope.user = response.data.user;
      //     console.log(response);
      //   })
      //   .catch(function(response) {
      //     console.log(response.data.message, response.status);
      //   });
    };
    $scope.updateProfile = function() {
      return api.request('/authenticate/user', $scope.user, 'PUT')
        .then(function(response) {
          $scope.user = response.data.dbUser;
          $state.go('main.profile', null, {reload: true})
          console.log('Profile has been updated');
        })
        .catch(function(response) {
          console.log(response, response.status);
        });
    };

    $scope.signOut = function() {
      $auth.logout();
      UserService.signOut();
      $state.go('main.my-pockeyt');
    };

    $scope.openFilePicker = function() {
      console.log('inside file picker function');
        navigator.camera.getPicture(uploadPhoto, function (message) {
          console.log('get picture failed');
          },  {
                quality: 100, 
                destinationType: navigator.camera.DestinationType.FILE_URI,
                sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                targetHeight: 200,
                targetWidth: 200,
                allowEdit: true
              }
        );
    };

    function uploadPhoto(imageURI) {
      var options = new FileUploadOptions();
      var headers = {'Connection': 'close', 'Authorization': 'Bearer ' + $auth.getToken()};
      options.fileKey="file";
      options.fileName=imageURI.substr(imageURI.lastIndexOf('/')+1);
      options.mimeType="image/jpeg";
      console.log(options.fileName);
      options.headers = headers;

      var params = new Object();
      params.value1 = "test";
      params.value2 = "param";

      options.params = params;
      options.chunkedMode = false;

      var ft = new FileTransfer();
      ft.upload(imageURI, encodeURI('http://162.243.168.64/api/authenticate/user/photo'), win, fail, options);
    };

    function win(r) {
      console.log("Code = " + r.responseCode);
      console.log("Response = " + r.response);
      console.log("Sent = " + r.bytesSent);
      $scope.getProfile();
    };

    function fail(error) {
        alert("An error has occurred: Code = " + error.code);
        console.log("upload error source " + error.source);
        console.log("upload error target " + error.target);
    };

    $scope.checkDevice = function() {
      if(device.platform === "iOS") {
        return 'icon ea-icon-ios-back';
      } else {
        return 'icon ea-icon-android-back';
      }
    };

    $scope.addPayment = function() {
      _token = {Authorization: 'Bearer ' + $auth.getToken()};
      return api.request('/token/client')
        .then(function(response) {
          console.log(response.data.clientToken);
          var token = response.data.clientToken;

          BraintreePlugin.initialize(token,
            function () { console.log("init OK!"); },
            function (error) { console.error(error); 
          });

          var options = {
            cancelText: "Cancel",
            title: "Add Card",
            ctaText: "ADD Payment Method",
          };

          BraintreePlugin.presentDropInPaymentUI(options, function (result) {
            console.log('inside UI dropin');
              if (result.userCancelled) {
                console.debug("User cancelled payment dialog.");
              }
              else {
                console.info("User completed payment dialog.");
                console.info("Payment Nonce: " + result.nonce);
                console.debug("Payment Result.", result);

                _nonce = {userNonce: result.nonce};
                return api.request('/customer', _nonce, 'POST', _token)
                  .then(function(response) {
                    console.log(response);
                    $state.go('main.profile', null, {reload: true})
                  })
                  .catch(function(response) {
                    console.log("error in api call")
                    console.log(response);
                  });
              }
          });

        })
        .catch(function(response) {
          console.log(response);
        });
    };

    $scope.editPayment = function() {
      _token = {Authorization: 'Bearer ' + $auth.getToken()};
      return api.request('/token/client')
        .then(function(response) {
          console.log(response.data.clientToken);
          var token = response.data.clientToken;

          BraintreePlugin.initialize(token,
            function () { console.log("init OK!"); },
            function (error) { console.error(error); 
          });

          var options = {
            cancelText: "Cancel",
            title: "Change Card",
            ctaText: "CHANGE Payment Method",
          };

          BraintreePlugin.presentDropInPaymentUI(options, function (result) {
            console.log('inside UI dropin');
              if (result.userCancelled) {
                console.debug("User cancelled payment dialog.");
              }
              else {
                console.info("User completed payment dialog.");
                console.info("Payment Nonce: " + result.nonce);
                console.debug("Payment Result.", result);

                _payload = {
                  userNonce: result.nonce,
                  payToken: $scope.user.cardToken
                };

                return api.request('/customer', _payload, 'PUT', _token)
                  .then(function(response) {
                    console.log(response);
                    $state.go('main.profile', null, {reload: true})
                  })
                  .catch(function(response) {
                    console.log("error in api call")
                    console.log(response);
                  });
              }
          });

        })
        .catch(function(response) {
          console.log(response);
        });
    };
    $scope.getProfile();
  };



  module.controller('ProfileController', ['$scope', '$auth', '$state', 'PockeytApi', 'UserService', 'authorize', 'PouchDatabase', ProfileController]);
})(angular);