(function(angular) {

  var module = angular.module('pockeyt.controllers.pay', ['pockeyt.services.api']);

  var PayController = function($scope, api) {
    if(typeof analytics !== "undefined") { analytics.trackView("Pay View"); }

    $scope.openPayForm = function() {
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
					    }
					});

    		})
    		.catch(function(response) {
    			console.log(response);
    		});
		};
		$scope.openPayForm();
  };

  module.controller('PayController', ['$scope', 'PockeytApi', PayController]);
})(angular);