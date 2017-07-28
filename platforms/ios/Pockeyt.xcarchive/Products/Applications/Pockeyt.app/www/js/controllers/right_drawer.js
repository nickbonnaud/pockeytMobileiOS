(function(angular) {
  var pockeyt = angular.module('pockeyt.controllers.right_drawer', ['pockeyt.services.api', 'pockeyt.services.whitelabel']);

  var RightDrawerController = function($scope, partners, whitelabel) {
    this.loading = true;
    this.unlockedPartners = [];
    this.whitelabel = whitelabel;

    partners.fixAll().then(function() {
      $scope.$watch(function() {return partners.allUnlocked();}, function(newVal) {this.unlockedPartners = newVal;}.bind(this));
      this.loading = false;
    }.bind(this));
  };

  RightDrawerController.prototype = {
    logout: function() {
      this.whitelabel.logout();
    }
  };

  pockeyt.controller('RightDrawerController', ['$scope', 'partnersRepository', 'whitelabel', RightDrawerController]);
})(angular);