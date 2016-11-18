(function(angular) {

  var module = angular.module('pockeyt.controllers.my-pockeyt', ['pockeyt.repositories.favorites', 'pockeyt.services.my-pockeyt', 'pockeyt.services.bookmark']);

  var MyPockeytController = function($scope, allPartners, repository, $state, MyPockeyt, Bookmark) {

    if(typeof analytics !== "undefined") { analytics.trackView("My Pockeyt View"); }
    this.partners = {};
    this.update(allPartners);

    $scope.parentShareContent = function(top) {
      if(typeof analytics !== "undefined") { analytics.trackEvent("Share Button", "My Pockeyt", top.title, top.id); }
      this.window.plugins.socialsharing.shareViaSMS('I found this on Pockeyt http://pockeytbiz.com/posts/' + top.id);
    };

    $scope.parenttoggleFavorite = function(top) {
      var partner = top;
      return MyPockeyt.toggleFavorite(partner);
    };

    $scope.parentIsFavorite = function(top) {
      var partner = top;
      return MyPockeyt.isFavorite(partner);
    }

    $scope.parentToggleBookmark = function(top) {
      var partner = top;
      return Bookmark.toggleBookmark(partner);
    };

    $scope.parentIsBookmark = function(top) {
      var partner = top;
      return Bookmark.isBookmark(partner);
    };


    $scope.$watch(function() {return repository.allCached();}, function(val) {
      this.update(val);
    }.bind(this), true);

    $scope.loadMoreFavs = function() {
      repository.loadMoreFavs();
    };

    $scope.empty = repository.empty;

    $scope.isLoading = function() {
      return repository.isLoading;
    };

  };
  
  MyPockeytController.prototype.update = function(partners) {
    this.partners.all = partners;
  };

  module.controller('MyPockeytController', ['$scope', 'allPartners', 'favoritesRepository', '$state', 'MyPockeyt', 'Bookmark', MyPockeytController]);

})(angular);