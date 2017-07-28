(function(angular) {

  var module = angular.module('pockeyt.services.notification', ['pockeyt.services.api', 'LocalStorageModule']);

  module.constant('PUSH_TOKEN_KEY', 'pockeyt.services.notification');
  module.constant('PUSH_TOKEN_LOADED_EVENT', 'pockeyt.services.notification-loaded');

  var NotificationFactory = [
  	'PUSH_TOKEN_KEY',
  	'PUSH_TOKEN_LOADED_EVENT',
  	'$state',
  	'$rootScope',
    'PockeytApi',
    'localStorageService',
    '$q',
    '$auth',
    function(PUSH_TOKEN_KEY, PUSH_TOKEN_LOADED_EVENT, $state, $rootScope, api, storage, $q, $auth) {
		 	$rootScope.notifOpenApp = false;
		 	var billWaitingApproval = undefined;
		 	var user = undefined;
	    var transaction = undefined;
	    var profile = undefined;
	    var loadCheck = true;
	    var isLoading = false;
	  	var init = function() {
	  		var push = PushNotification.init({
	        "android": {
	          "senderID": "906488292868"
	        },
	        "ios": {
	          "sound": true,
	          "vibration": true,
	          "alert": true,
	          "categories": {
	            "payment": {
	              "yes": {
	                "callback": "acceptChargeBackground", "title": "Confirm", "foreground": false, "destructive": false
	              },
	              "no": {
	                "callback": "declineCharge", "title": "Reject", "foreground": false, "destructive": true
	              },
	              "maybe": {
	              	"callback": "changeTip", "title": "Custom Tip", "foreground": true, "destructive": false
	              }
	            },
	            "default": {
	            	"yes": {
	            		"callback": "confirmPayAvailable", "title": "Got it!", "foreground": false, "destructive": false
	            	}
	            }
	          }
	        }
	      });

	      push.on('registration', function(data) {
	      	var payload = {
	      		push_token: data.registrationId,
	      		device_type: device.platform
	      	};
	        api.request('/token/push', payload, 'POST')
	      		.then(function(response) {
	      			console.log(response);
	      		})
	      		.catch(function(err) {
	      			console.log(err);
	      		});
	      		saveTokenToStorage(data.registrationId);
	      });

	      push.on('notification', function(data) {
	      	if (data.additionalData.category === 'payment') {
	      		billWaitingApproval = data.additionalData.businessId;
	      		return navigator.notification.confirm(
	         		data.additionalData.inAppMessage,
	         		function(buttonIndex) {
	         			getUserSelection(buttonIndex, data);
	         		},
	         		'Confirm Payment',
	         		['Accept', 'Decline', 'Custom Tip']
		        );
	      	} else {
	      		return navigator.notification.confirm(
	         		data.additionalData.inAppMessage,
	         		null,
	         		'Pockeyt Notification',
	         		['Got it!']
		        );
	      	}
	      });

	      push.on('error', function(e) {
	        console.log(e.message);
	      });

	      getUserSelection = function(buttonIndex, data) {
	      	switch(buttonIndex) {
         		case 1:
	         		acceptCharge(data);
	         		break;
	         	case 2:
	         		declineCharge(data);
	         		break;
	         	case 3:
	         		changeTip(data);
	         		break;
         	}
	      };

	      confirmPayAvailable = function(data) {
	      	push.finish(function() {
	            console.log('accept callback finished');
	        }, function() {
	            console.log('accept callback failed');
	        }, data.additionalData.locKey);
	        return;
	      };

	      changeTip = function(data) {
	      	billWaitingApproval = data.additionalData.businessId;
	      	$rootScope.notifOpenApp = true;

	      	var payload = {
	      		tipSet: false,
	      		transactionId: data.additionalData.transactionId
	      	};
	      	return api.request('/transaction/custom', payload, 'PUT')
	      		.then(function(response){
	      			user = response.data.customer;
	      			transaction = response.data.transaction;
	      			profile = response.data.profile;
	      			push.finish(function(user, transaction, profile) {
			            console.log('accept callback finished');
			        }, function() {
			            console.log('accept callback failed');
			        }, data.additionalData.locKey);
			        return $state.go('main.tip-custom', {user: user, transaction: transaction, profile: profile});
	      		})
	      		.catch(function(err) {
	      			push.finish(function(user, transaction, profile) {
			            console.log('accept callback finished');
			        }, function() {
			            console.log('accept callback failed');
			        }, data.additionalData.locKey);
	      			return console.log(err);
	      		});
	      };

	      declineCharge = function(data) {
	      	billWaitingApproval = undefined;
	        var payload = {
	      		transactionId: data.additionalData.transactionId
	      	};
	      	return api.request('/transaction/decline', payload, 'PUT')
	      		.then(function(response){
	      			push.finish(function() {
			            console.log('accept callback finished');
			        }, function() {
			            console.log('accept callback failed');
			        }, data.additionalData.locKey);
			        return console.log("response");
	      		})
	      		.catch(function(err) {
	      			push.finish(function() {
			            console.log('accept callback finished');
			        }, function() {
			            console.log('accept callback failed');
			        }, data.additionalData.locKey);
			        return console.log(err);
	      		});
	      };

	      acceptChargeBackground = function(data) {
	      	billWaitingApproval = undefined;
	      	var payload = {
	      		transactionId: data.additionalData.transactionId
	      	};
	      	return api.request('/transaction/accept', payload, 'PUT')
	      		.then(function(response){
	      			push.finish(function() {
	      				console.log('accept callback finished');
			        }, function() {
			            console.log('accept callback failed');
			        }, data.additionalData.locKey);
			        return console.log("response");
	      		})
	      		.catch(function(err) {
	      			push.finish(function() {
			            console.log('accept callback finished');
			        }, function() {
			            console.log('accept callback failed');
			        }, data.additionalData.locKey);
			        return console.log(err);
	      		});
	      };

	      acceptCharge = function(data) {
	      	billWaitingApproval = undefined;
	      	var payload = {
	      		transactionId: data.additionalData.transactionId
	      	};
	      	return api.request('/transaction/accept', payload, 'PUT')
	      		.then(function(response){
	      			push.finish(function() {
	      				console.log('accept callback finished');
			        }, function() {
			            console.log('accept callback failed');
			        }, data.additionalData.locKey);
			        return window.plugins.toast.showWithOptions({
                message: "Bill Paid!",
                duration: "short",
                position: "top",
                styling: {
                    backgroundColor: '#20ba12'
                }
            	});
	      		})
	      		.catch(function(err) {
	      			push.finish(function() {
			            console.log('accept callback finished');
			        }, function() {
			            console.log('accept callback failed');
			        }, data.additionalData.locKey);
			        return console.log(err);
	      		});
	      };
	  	};

	  	var checkNotifPermissions = function() {
	  		PushNotification.hasPermission(function(data) {
			    if (!data.isEnabled) {
			      navigator.notification.confirm(
	         		"Notification Services REQUIRED for payments. Please enable in notification-services",
	         		function(buttonIndex) {
	         			if (buttonIndex == 2) {
	         				window.cordova.plugins.settings.open("application_details", function() {
						        },
						        function () {
						          console.log('failed to open settings');
						        }
							    );
	         			}
	         		},
	         		'Notification Services OFF!',
	         		['Cancel', 'Settings']
		        );
			   	}
				});
	  	};

	  	var loadTokenFromStorage = function() {
	  		var savedToken = storage.get(PUSH_TOKEN_KEY);
	  		if(!angular.isString(savedToken)) {
	  			storage.set(PUSH_TOKEN_KEY, '');
	  			$rootScope.$broadcast(PUSH_TOKEN_LOADED_EVENT);
	  			return getToken();
	  		} else {
	  			$rootScope.$broadcast(PUSH_TOKEN_LOADED_EVENT);
	  			return savedToken;
	  		}
	  	};

	  	var getToken = function() {
	  		if (storage.get(PUSH_TOKEN_KEY))
	  			return $q.resolve(storage.get(PUSH_TOKEN_KEY));
	  		else {
	  			return $q(function(resolve, reject) {
	  				var dereg = $rootScope.$on(PUSH_TOKEN_LOADED_EVENT, function() {
    					dereg();
    					resolve(storage.get(PUSH_TOKEN_KEY));
    				});
	  			});
	  		}
	  	};

	  	var saveTokenToStorage = function(token) {
	  		savedToken = loadTokenFromStorage();
	  		if (savedToken !== token) {
	  			storage.set(PUSH_TOKEN_KEY, token);
	  			return token;
	  		} else {
	  			return;
	  		}
	  	};

	  	var setBillWaitingDone = function() {
	  		return billWaitingApproval = undefined;
	  	};

	  	var billWaiting = function() {
	  		console.log($auth.isAuthenticated());
	  		if (!billWaitingApproval && loadCheck && !isLoading && $auth.isAuthenticated()) {
	  			console.log("inside barrier");
	  			isLoading = true;
	      	_token = {Authorization: 'Bearer ' + $auth.getToken()};
	        api.request('/transaction/sent', null, 'GET', _token)
	          .then(function(response) {
	          	if (response.data.noBill) {
	          		loadCheck = false;
	          		isLoading = false;
	      				return billWaitingApproval;
	          	} else {
	          		user = response.data.customer;
	      				transaction = response.data.transaction;
	      				profile = response.data.profile;
	      				loadCheck = false;
	      				isLoading = false;
	      				return billWaitingApproval = profile.id;
	          	}
	          })
	          .catch(function(response) {
	          	isLoading = false;
	          });
	  		} else {
	  			return billWaitingApproval;
	  		}
	  	};

	  	var getUser = function() {
	  		return user;
	  	};
      
	  	var getTransaction = function() {
	  		return transaction;
	  	};

	  	var getProfile = function() {
	  		return profile;
	  	};

	  	var getBillWaiting = function() {
	  		return billWaitingApproval;
	  	};

      return {
      	init: init,
      	saveTokenToStorage: saveTokenToStorage,
      	getToken: getToken,
      	loadTokenFromStorage: loadTokenFromStorage,
      	setBillWaitingDone: setBillWaitingDone,
      	billWaiting: billWaiting,
      	getUser: getUser,
      	getTransaction: getTransaction,
      	getProfile: getProfile,
      	checkNotifPermissions: checkNotifPermissions,
      	getBillWaiting: getBillWaiting
      };
    }];
  module.factory('Notification', NotificationFactory);
})(angular);