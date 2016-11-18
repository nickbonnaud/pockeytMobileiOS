(function(angular) {

  var module = angular.module('pockeyt.controllers.main', ['pockeyt.services.my-pockeyt', 'pockeyt.services.bookmark', 'pockeyt.services.user-service', 'pockeyt.services.geolocate']);

  var MainController = function($rootScope, $scope, $state, $auth, MyPockeyt, Bookmark, UserService, Geolocate) {

    $scope.myPockeytCheck = function() {
      return MyPockeyt.checkUpdated();
    };

    $scope.updateCheck = function() {
    	MyPockeyt.updateCheck();
    }

    $scope.bookmarkCheck = function() {
      return Bookmark.checkUpdated();
    };

    $scope.updateBookmarkCheck = function() {
    	Bookmark.updateCheck();
    };

    $scope.isBooting = function() {
      return $rootScope.isBooting;
    };

    // $scope.isAuthenticated = function() {
    //   facebookConnectPlugin.getLoginStatus(function(response) {
    //     if (response.status === 'connected') {
    //       console.log(response.status);
    //       return true;
    //     } else {
    //       console.log('inside manual');
    //       return $auth.isAuthenticated();
    //     }
    //   })
    // };

    // $scope.tokenPresent = function() {
    //   return true;
    // };

    $scope.checkIfPartnerState = function() {
      var state = $state.current.name;
      if ((state == 'main.explore.partner') || (state == 'main.my-pockeyt.favorite') || (state == 'main.connect.business') || (state == 'main.profile.edit')) {
        return $scope.isPartner = true;
      } else {
        return $scope.isPartner = false;
      }
    };
    $scope.geoTrack = function() {
      if (angular.isDefined($rootScope.userId)) {
        console.log("is Defined");
        Geolocate.begin();
      }
      console.log("not defined");
    };
    $scope.geoTrack();
  };

  module.controller('MainController', ['$rootScope', '$scope', '$state', '$auth', 'MyPockeyt', 'Bookmark', 'UserService', 'Geolocate', MainController]);

})(angular);