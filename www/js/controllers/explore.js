(function(angular) {

  var module = angular.module('pockeyt.controllers.explore', ['pockeyt.repositories.partners', 'pockeyt.services.my-pockeyt', 'pockeyt.services.bookmark']);

  var ExploreController = function($scope, allPartners, repository, MyPockeyt, Bookmark) {
    if(typeof analytics !== "undefined") { analytics.trackView("Explore View"); }
    this.partners = {};

    $scope.parentShareContent = function(top) {
      if(typeof analytics !== "undefined") { analytics.trackEvent("Share Button", "Explore", top.title, top.id); }
      this.window.plugins.socialsharing.shareViaSMS('I found this on Pockeyt http://pockeytbiz.com/posts/' + top.id);
    };

    $scope.parenttoggleFavorite = function(top) {
      var partner = top;
      return MyPockeyt.toggleFavorite(partner);
    };

    $scope.parentIsFavorite = function(top) {
      var partner = top;
      return MyPockeyt.isFavorite(partner);
    };

    $scope.parentToggleBookmark = function(top) {
      var partner = top;
      return Bookmark.toggleBookmark(partner);
    };

    $scope.parentIsBookmark = function(top) {
      var partner = top;
      return $scope.isBookmark = Bookmark.isBookmark(partner);
    };

    $scope.parentSearchActive = function() {
      return repository.searchActive;
    };

    this.update(allPartners);

    $scope.$watch(function() {return repository.allCached();}, function(val) {
      this.update(val);
    }.bind(this), true);

    $scope.loadMore= function() {
      repository.loadMore();
    };

    $scope.isLoading = function() {
      return repository.isLoading;
    };

    $scope.noResults = function() {
      return repository.noResults;
    };

  };

  ExploreController.prototype.update = function(partners) {
    this.partners.all = partners;
  };

  module.controller('ExploreController', ['$scope', 'allPartners', 'partnersRepository', 'MyPockeyt', 'Bookmark', ExploreController]);

})(angular);