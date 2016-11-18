(function(angular) {

  var module = angular.module('pockeyt.controllers.events', ['pockeyt.repositories.events', 'pockeyt.services.my-pockeyt', 'pockeyt.services.bookmark']);

  var EventsController = function($scope, allPartners, repository, MyPockeyt, Bookmark) {
    if(typeof analytics !== "undefined") { analytics.trackView("Events View"); }
    this.partners = {};

    $scope.loadDate= function(n) {
    	$scope.selectedDate = n;
    	repository.loadSelectedDate($scope.selectedDate);
    };

    $scope.parentToggleBookmark = function(top) {
      var partner = top;
      return Bookmark.toggleBookmark(partner);
    };

    $scope.parentIsBookmark = function(top) {
      var partner = top;
      return $scope.isBookmark = Bookmark.isBookmark(partner);
    };

    $scope.parentShareContent = function(top) {
      if(typeof analytics !== "undefined") { analytics.trackEvent("Share Button", "Events", top.title, top.id); }
      this.window.plugins.socialsharing.shareViaSMS('I found this on Pockeyt http://pockeytbiz.com/posts/' + top.id);
    };

    this.update(allPartners);

    $scope.$watch(function() {return repository.allCached();}, function(val) {
      this.update(val);
    }.bind(this), true);

    $scope.loadMore = function() {
      repository.loadMore();
    };

    $scope.isLoading = function() {
      return repository.isLoading;
    };

  };

  EventsController.prototype.update = function(partners) {
    this.partners.all = partners;
  };

  module.controller('EventsController', ['$scope', 'allPartners', 'eventsRepository', 'MyPockeyt', 'Bookmark', EventsController]);

})(angular);