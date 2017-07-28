(function(angular) {
  var pockeyt = angular.module('pockeyt.controllers.left_drawer', ['pockeyt.services.api', 'pockeyt.services.whitelabel']);

  var LeftDrawerController = function($state, api, whitelabel) {
    this.$state = $state;
    this.api = api;
    this.whitelabel = whitelabel;
  };

  LeftDrawerController.prototype = {

    logout: function() {
      this.api.logout().then(
          function(response) {
            //alert('This device has been unpaired from your account and you have been logged out.');
            this.$state.go('login');
          }.bind(this),
          function() {
            alert('Could not unpair this device and log you out. Try again or contact an administrator.');
          }.bind(this)
      );
    },

    check: function() {
      this.whitelabel.showLaunchKeyAuthenticationModal();
    }

  };

  pockeyt.controller('LeftDrawerController', ['$state', 'PockeytApi', 'whitelabel', LeftDrawerController]);
})(angular);