(function(angular) {

  var module = angular.module('pockeyt.controllers.partner', ['ui.router', 'ngSanitize', 'pockeyt.repositories.partners', 'pockeyt.services.my-pockeyt']);

  /**
   *
   * @param {Partner} partner
   * @param {MyPockeyt} MyPockeyt
   * @param {$state} $state
   * @constructor
   *
   * @property {Partner} entity
   * @property {string} info
   * @property {{date: Date|bool,body:string}[]} feed
   */
  var PartnerController = function(partner, MyPockeyt, $state, $scope) {
    if(typeof analytics !== "undefined") { analytics.trackView("Individual Partner View"); }
    if(partner === null) {alert('Could not find partner.'); $state.go('my-pockeyt');}
    else {
      this.entity = partner;
      this.toggleFavorite = function() {
        return MyPockeyt.toggleFavorite(this.entity);
      };
      this.goUrl = function(partner) {
        window.open($scope.partner.entity.url, '_system', 'location=yes');
      };
      this.goReview = function(partner) {
        window.open($scope.partner.entity.review_url, '_system', 'location=yes');
      };
      this.favorite = MyPockeyt.isFavorite(this.entity);
      $scope.$watch(function() {return MyPockeyt.isFavorite(this.entity);}.bind(this), function(val) {
        this.favorite = val;
      }.bind(this), true);

      $scope.shareContent = function(feedentry) {
        if(typeof analytics !== "undefined") { analytics.trackEvent("Share Button", "Partner Profile", feedentry.title, feedentry.id); }
        window.plugins.socialsharing.shareViaSMS('I found this on Pockeyt http://pockeytbiz.com/posts/' + feedentry.id);
      };

      $scope.checkDevice = function() {
        if(device.platform === "iOS") {
          return 'icon ea-icon-ios-back';
        } else {
          return 'icon ea-icon-android-back';
        }
      };

    }

  };

  module.controller('PartnerController', ['partner', 'MyPockeyt', '$state', '$scope', PartnerController]);

})(angular);