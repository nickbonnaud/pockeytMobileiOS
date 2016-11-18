(function(angular) {

  var module = angular.module('pockeyt.controllers.referral', ['pockeyt.services.user-service']);

  var ReferralController = function($scope, $q, $state, $filter, UserService) {

		this.isLoggedIn =  UserService.getUser('facebook');


		$scope.facebookSignOut = function() {
			facebookConnectPlugin.logout(function(){
				window.localStorage.clear();
				Branch.logout();
	      $state.go("my-pockeyt");
      },
      function(fail){
      });
		};

		var fbLoginSuccess = function(response) {
	    if (!response.authResponse){
	      fbLoginError("Cannot find the authResponse");
	      return;
	    }

	    var authResponse = response.authResponse;

	    getFacebookProfileInfo(authResponse)
	    .then(function(profileInfo) {
	      // For the purpose of this example I will store user data on local storage

        UserService.setUser({
        	authResponse: authResponse,
        	userID: profileInfo.id,
        	name: profileInfo.name,
        	email: profileInfo.email
        });

        if (!UserService.getUser('facebook').email) {
        	Branch.setIdentity(UserService.getUser('facebook').name).then(function (res) {
				  // Success Callback
				  console.log(res);
					}).catch(function (err) {
					  // Error Callback
					  console.error(err);
					});
        } else {
        	Branch.setIdentity(UserService.getUser('facebook').email).then(function (res) {
				  // Success Callback
					  console.log(res);
					}).catch(function (err) {
					  // Error Callback
					  console.error(err);
					});
        }

        $state.reload();
	    }, function(fail){
	      // Fail get profile info
	      console.log('profile info fail', fail);
	    });
	  };
	  // This is the fail callback from the login method
	  var fbLoginError = function(error){
	    console.log('fbLoginError', error);
	  };
	   // This method is to get the user profile info from the facebook api
	  var getFacebookProfileInfo = function (authResponse) {
	    var info = $q.defer();

	    facebookConnectPlugin.api('/me?fields=email,name&access_token=' + authResponse.accessToken, null,
	      function (response) {
					console.log(response);
	        info.resolve(response);
	      },
	      function (response) {
					console.log(response);
	        info.reject(response);
	      }
	    );
	    return info.promise;
	  };
	  //This method is executed when the user press the "Login with facebook" button
	  $scope.facebookSignIn = function() {
	    facebookConnectPlugin.getLoginStatus(function(success){
	      if(success.status === 'connected'){
	        // The user is logged in and has authenticated your app, and response.authResponse supplies
	        // the user's ID, a valid access token, a signed request, and the time the access token
	        // and signed request each expire
	        console.log('getLoginStatus', success.status);

	    		// Check if we have our user saved

	    		if(!UserService.getUser('facebook').userID){
						getFacebookProfileInfo(success.authResponse)
						.then(function(profileInfo) {
							// For the purpose of this example I will store user data on local storage
							UserService.setUser({
								authResponse: success.authResponse,
								userID: profileInfo.id,
								name: profileInfo.name,
								email: profileInfo.email
							});
							
			        if (!UserService.getUser('facebook').email) {
			        	Branch.setIdentity(UserService.getUser('facebook').name).then(function (res) {
							  // Success Callback
							  console.log(res);
								}).catch(function (err) {
								  // Error Callback
								  console.error(err);
								});
			        } else {
			        	Branch.setIdentity(UserService.getUser('facebook').email).then(function (res) {
							  // Success Callback
								  console.log(res);
								}).catch(function (err) {
								  // Error Callback
								  console.error(err);
								});
			        }

							$state.reload();
						}, function(fail){
							// Fail get profile info
							console.log('profile info fail', fail);
						});
					} else {
						$state.reload();;
					}
	      } else {
	        // If (success.status === 'not_authorized') the user is logged in to Facebook,
					// but has not authenticated your app
	        // Else the person is not logged into Facebook,
					// so we're not sure if they are logged into this app or not.

					console.log('getLoginStatus', success.status);

					// Ask the permissions you need. You can learn more about
					// FB permissions here: https://developers.facebook.com/docs/facebook-login/permissions/v2.4
	        facebookConnectPlugin.login(['email', 'public_profile'], fbLoginSuccess, fbLoginError);
	      }
	    });
	  };

	  $scope.referFriends = function() {

      var branchUniversalObj = null;

      Branch.createBranchUniversalObject({
        canonicalIdentifier: 'referral program',
        title: 'Download Pockeyt',
        contentDescription: 'Your friend has invited you to download Pockeyt',
        contentMetadata: {
          'userId': UserService.getUser('facebook').userID,
          'userName': UserService.getUser('facebook').name,
          'email': UserService.getUser('facebook').email
        }
      }).then(function (newBranchUniversalObj) {

        branchUniversalObj = newBranchUniversalObj;
        
        if (device.platform == "iPhone" || device.platform == "iOS") {
	        branchUniversalObj.showShareSheet({
	          // put your link properties here
	          "feature" : "referral program",
	          "channel" : "referral",
	          "duration" : 1,
	        }, {
	          // put your control parameters here
	        });
	      }
	      if (device.platform == "Android") {
	      	branchUniversalObj.generateShortUrl({
					  // put your link properties here
					  "feature" : "referral program",
	          "channel" : "referral",
	          "duration" : 1,
					}, {
					  // put your control parameters here
					}).then(function (res) {
					    // Success Callback
					    console.log(res.generatedUrl);
					}, function (err) {
					    // Error Callback
					    console.error(err);
					});
					branchUniversalObj.showShareSheet({
					  // put your link properties here
					  "feature" : "referral program",
	          "channel" : "referral",
					  "duration" : 1,
					}, {
					  // put your control parameters here
					});
					branchUniversalObj.onShareSheetLaunched(function () {
					  console.log('Share sheet launched');
					});
					branchUniversalObj.onShareSheetDismissed(function () {
					  console.log('Share sheet dimissed');
					});
					branchUniversalObj.onLinkShareResponse(function (res) {
					  console.log('Share link response: ' + JSON.stringify(res));
					});
					branchUniversalObj.onChannelSelected(function (res) {
					  console.log('Channel selected: ' + JSON.stringify(res));
					});
	      }
      });
    };
  };
  module.controller('ReferralController', ['$scope', '$q', '$state', '$filter', 'UserService', ReferralController]);
})(angular);