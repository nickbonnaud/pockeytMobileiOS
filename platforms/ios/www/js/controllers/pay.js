(function(angular) {

  var module = angular.module('pockeyt.controllers.pay', ['pockeyt.services.api']);

  var PayController = function($scope, api) {
    if(typeof analytics !== "undefined") { analytics.trackView("Pay View"); }

    $scope.sendPaymentMethod = function() {

    };

    $scope.focusField = function() {
    	field.focus();
    };

    const form = SecureForm.create('sandbox', function(state) {
    	console.log(state);
    });

    form.field('#cc-number .fake-input', {
		  type: 'card-number',
		  name: 'number',
		  successColor: 'green',
		  errorColor: 'red',
		  placeholder: '4111 1111 1111 1111',
		  validations: ['required', 'validCardNumber'],
		});

		form.field('#cc-cvc .fake-input', {
		  type: 'card-security-code',
		  name: 'security_code',
		  placeholder: '344',
		  successColor: 'green',
		  errorColor: 'red',
		  validations: ['required', 'validCardSecurityCode'],
		});

		form.field('#cc-expiration-month .fake-input', {
		  type: 'text',
		  name: 'expiration_month',
		  placeholder: '01',
		  successColor: 'green',
		  errorColor: 'red',
		  validations: ['required']
		});
		form.field('#cc-expiration-year .fake-input', {
		  type: 'text',
		  name: 'expiration_year',
		  placeholder: '2020',
		  successColor: 'green',
		  errorColor: 'red',
		  validations: ['required']
		});
  };

  module.controller('PayController', ['$scope', 'PockeytApi', PayController]);
})(angular);