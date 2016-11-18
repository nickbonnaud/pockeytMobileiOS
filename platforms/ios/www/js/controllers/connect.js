(function(angular) {

  var module = angular.module('pockeyt.controllers.connect', ['pockeyt.repositories.businesses', 'pockeyt.services.my-pockeyt']);

  var ConnectController = function($scope, allPartners, repository, MyPockeyt) {
    if(typeof analytics !== "undefined") { analytics.trackView("Find View"); }
    this.partners = {};
    this.update(allPartners);

    $scope.$watch(function() {return repository.allCached();}, function(val) {
      this.update(val);
    }.bind(this), true);

    $scope.parenttoggleFavorite = function(top) {
      var partner = top;
      return MyPockeyt.toggleFavorite(partner);
    };

    $scope.parentIsFavorite = function(top) {
      var partner = top;
      return MyPockeyt.isFavorite(partner);
    }

    $scope.loadMoreBizs = function() {
      repository.loadMoreBizs();
    };

    $scope.isLoading = function() {
      return repository.isLoading;
    };

    $scope.noResults = function() {
      return repository.noResults;
    };
  };

  ConnectController.prototype.update = function(partners) {
    this.partners.all = partners;
  };

  module.controller('ConnectController', ['$scope', 'allPartners', 'businessesRepository', 'MyPockeyt', ConnectController]);

})(angular);