(function(angular) {

  var module = angular.module('pockeyt.services.geolocate', ['pockeyt.services.api']);

  var GeolocateFactory = [
    '$rootScope',
    '$q',
    'PockeytApi',
    function($rootScope, $q, api) {
	    console.log('GeoAlert service instantiated');
		  var interval;
		  var duration = 6000;
		  var processing = false;
		  var userLocation;
		  var prevLocation;

	  	var hb = function() {
	  		console.log('hb running');
	  		console.log($rootScope.userId);
	      if(processing) return;
	      processing = true;
	      navigator.geolocation.getCurrentPosition(function(position) {
	      	userLocation = {
	      		lat: position.coords.latitude,
	      		lng: position.coords.longitude,
	      		accuracy: position.coords.accuracy,
	      		timestamp: position.timestamp,
	      		userId: $rootScope.userId
	      	}
	        console.log(userLocation);
	        sendGeo(userLocation);
	  		});
	  	};

	  	var sendGeo = function(userLocation) {
	  		return api.request('/geo', userLocation, 'PUT')
	  			.then(function(response) {
	  				console.log(response->id);
	  				processing = false;
	  			})
	  			.catch(function(err) {
	  				console.log(err);
	  				processing = false;
	  			});
	  	};
      
      return {
        begin:function() {
        	console.log($rootScope.userId);
        	interval = window.setInterval(hb, duration);
        	hb();
      	},
      	sendGeo: sendGeo
      };
    }];
  module.factory('Geolocate', GeolocateFactory);
})(angular);