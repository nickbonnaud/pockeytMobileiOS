(function(angular) {

  var module = angular.module('pockeyt.controllers.bookmark', ['pockeyt.repositories.bookmarks', 'pockeyt.services.bookmark', 'pockeyt.services.my-pockeyt']);

  var BookmarkController = function($scope, allPartners, repository, $state, Bookmark, MyPockeyt) {

    if(typeof analytics !== "undefined") { analytics.trackView("Bookmark View"); }
    this.partners = {};
    this.update(allPartners);

    $scope.parentShareContent = function(top) {
      if(typeof analytics !== "undefined") { analytics.trackEvent("Share Button", "Bookmark", top.title, top.id); }
      this.window.plugins.socialsharing.shareViaSMS('I found this on Pockeyt http://pockeytbiz.com/posts/' + top.id);
    };

    $scope.parenttoggleFavorite = function(top) {
      var partner = top;
      return MyPockeyt.toggleFavorite(partner);
    };

    $scope.parentIsFavorite = function(top) {
      var partner = top;
      return $scope.isFavorite = MyPockeyt.isFavorite(partner);
    }

    $scope.parentToggleBookmark = function(top) {
      var partner = top;
      return Bookmark.toggleBookmark(partner);
    };

    $scope.parentIsBookmark = function(top) {
      var partner = top;
      return $scope.isBookmark = Bookmark.isBookmark(partner);
    };

    $scope.$watch(function() {return repository.allCached();}, function(val) {
      this.update(val);
    }.bind(this), true);

    $scope.loadMore = function() {
      repository.loadMoreBookmarks();
    };

    $scope.empty = repository.empty;

    $scope.isLoading = function() {
      return repository.isLoading;
    };

    $scope.noResults = function() {
      return repository.noResults;
    };
  };
  
  BookmarkController.prototype.update = function(partners) {
    this.partners.all = partners;
  };

  module.controller('BookmarkController', ['$scope', 'allPartners', 'bookmarksRepository', '$state', 'Bookmark', 'MyPockeyt', BookmarkController]);

})(angular);