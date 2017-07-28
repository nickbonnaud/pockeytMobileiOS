(function(angular) {

  var module = angular.module('pockeyt.directives.partner', []);

  module.directive('partnerListItem', function() {

    return {
      restrict: 'AE',
      scope: {
        partner: '=partnerListItem',
        'shareContent': '&',
        'openMenu': '&',
        'purchasePost': '&'
      },
      templateUrl: 'templates/directives/partner-list-item.html',
      replace: true,
      /**
       *
       * @param {{partner: Partner}} $scope
       * @param {jQuery} $elem
       * @param {Object<string,string>} attrs
       */
      link: function($scope, $elem, attrs) {
        $scope.lockIfUnlocked = function() {
          if($scope.partner.unlocked) $scope.partner.lock();
        };
        $scope.feedentry = (typeof attrs.feedentry !== 'undefined');
      }
    };
  });
})(angular);