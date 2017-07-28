(function(angular) {

  var module = angular.module('pockeyt.services.bg-geolocate', ['pockeyt.services.geolocation-auth', 'pockeyt.services.api', 'pockeyt.services.notify-service']);

  var bgGeolocateFactory = [
    '$rootScope',
    '$auth',
    'geolocationAuth',
    'PockeytApi',
    'NotifyService',
    function($rootScope, $auth, geolocationAuth, api, NotifyService) {
        var bgGeo = window.BackgroundGeolocation;
        $rootScope.userAcceptGeo = geolocationAuth.loadGeoAcceptedFromStorage();
        var userStationarySet = false;
        var geoFences;
        var processing = false;
        var initialLoad = false;
        var toggleOn = false;
        var _currentLocations = [];

        var inLocations = function() {
            return _currentLocations;
        };

        var getGeoState = function() {
            bgGeo.getState(function(state) {
            });
        };

        var geoFenceAction = function(params, taskId) {
            var payload = params.location;
            if (params.action === 'ENTER') {
                if (params.location.is_moving === false) {
                    var currentLocation = {
                        'location_id': payload.geofence.extras.location_id,
                        'business_logo' : payload.geofence.extras.business_logo
                    }
                    addCurrentLocations(currentLocation);
                    if (!userStationarySet) { setStationaryConfig(); }
                    
                }
            } else if (params.action === 'EXIT') {
                removeCurrentLocations(payload.geofence.extras.location_id);
                
                if (params.location.is_moving === false && userStationarySet) {
                    if (_currentLocations.length == 0) {
                        removeStationaryConfig();
                    }
                }
            }
            bgGeo.finish(taskId);
        };

        var onMotionChange = function(isMoving, location, taskId) {
            if (toggleOn) {
                geolocationAuth.setGeoAccepted(toggleOn);
                toggleOn = false;
                NotifyService.notify();
            }
            if (!processing) {
                if (initialLoad) {
                    initialLoad = false;
                } else {
                    if(!isMoving && _currentLocations.length !== 0) {
                        if (!userStationarySet) {
                            setStationaryConfig();
                        }
                    } else if (!isMoving && _currentLocations.length === 0) {
                        if (userStationarySet) {
                            removeStationaryConfig();
                        }
                    }
                }
            }
        };

        var setStationaryConfig = function() {
            return bgGeo.setConfig({
                preventSuspend: true,
                heartbeatInterval: 60,
            }, function(){
                return userStationarySet = true;
            }, function() {
                return console.log("error setting stationary");
            });
        };

        var removeStationaryConfig = function() {
            return bgGeo.setConfig({
                preventSuspend: false,
                heartbeatInterval: undefined,
            }, function(){
                return userStationarySet = false;
            }, function() {
                return console.log("error removing stationary");
            });
        }

        var config = function() {
            bgGeo.configure({
                desiredAccuracy: 10,
                distanceFilter: 20,
                stationaryRadius: 50,
                locationUpdateInterval: 1000,
                fastestLocationUpdateInterval: 1000,
                locationAuthorizationAlert: {
                    titleWhenNotEnabled: "Location Services DISABLED!",
                    titleWhenOff: "Location Services OFF!",
                    instructions: "Location Services REQUIRED for payments. Please enable 'Always' in location-services",
                    cancelButton: "Cancel",
                    settingsButton: "Settings"
                },

                // Activity Recognition config
                activityType: 'Other',
                activityRecognitionInterval: 30000,
                stopTimeout: 5,

                // Application config
                debug: false,
                stopOnTerminate: true,
                startOnBoot: false,

                geofenceProximityRadius: 1000,
                geofenceInitialTriggerEntry: true,

                // HTTP / SQLite config
                url: 'https://pockeytbiz.com/api/geo',
                method: 'POST',
                autoSync: true,
                maxDaysToPersist: 1,
                headers: {
                    'Authorization': 'Bearer' + $auth.getToken()
                }
            }, function(state) {
                return getGeoFences(state);
            });
        };


    	var initGeo = function() {
			return config();
    	};

        var getGeoFences = function(state) {
            processing = true;
            initialLoad = true;
            return api.request('/geo/fences', 'GET')
                .then(function(response) {
                    geoFences = response.data;
                    bgGeo.addGeofences(geoFences);;
                    if(!state.enable) {
                        bgGeo.startGeofences(function(state) {
                            getCurrentPosition();
                            processing = false;
                        });
                    }
                })
                .catch(function(err) {
                    processing = false;
                });
        };

        var sendStationaryLocation = function(params) {
            var data = params.location;
            if (angular.isDefined(data)) {
                params = data;
            }
            api.request('/geo', params, 'POST')
                .then(function(response) {
                    if (response.data.length == 0) {return;}
                    if (response.data === 'none') {
                        _currentLocations = [];
                        if (userStationarySet) {
                            removeStationaryConfig();
                        }
                    } else if (response.data !== 'none') {
                        var _locations = response.data;
                        for(var i = 0; i < _locations.length; i++) {
                           addCurrentLocations(_locations[i]);
                        }
                        for(var i = 0; i < _currentLocations.length; i++) {
                           var index = removeSavedLocationIndex(_locations, _currentLocations[i]);
                           if (index == -1) {
                                _currentLocations.splice(i, 1);
                           }
                        }
                        if (!userStationarySet) {
                            setStationaryConfig();
                        }
                    }
                })
                .catch(function(err) {
                    console.log(err);
                });
        };

        var sendStationaryFail = function(response) {
            var status = response.status;
            var responseText = response.responseText;
        };

        var startGeolocation = function() {
            bgGeo.stop();
            return bgGeo.start(function(state) {
                return toggleOn = true;
            });
        };

        var stopGeolocation = function() {
            return bgGeo.stop(function(state) {
                geolocationAuth.toggleGeoAccepted();
            });
        };

        var setLocationSettings = function(provider) {
            geolocationAuth.setGeoAccepted(provider.enabled);
        };

        var getCurrentPosition = function() {
            bgGeo.getCurrentPosition(function(location, taskId) {
                sendStationaryLocation(location);
                bgGeo.finish(taskId);
            }, function(errorCode) {
                console.log(errorCode);
            }, {
                timeout: 30,
                maximumAge: 5000,
                desiredAccuracy: 0,
                samples: 3,
            });
        };

        var addCurrentLocations = function(location) {
            if (_currentLocations.length > 0) {
                var locationIndex = searchCurrentLocations(location.location_id);
                if (locationIndex == -1) {
                    return _currentLocations.push(location);
                } else {
                    return;
                }
            } else {
                return _currentLocations.push(location);
            }
        };

        var removeCurrentLocations = function(locationId) {
            if (_currentLocations.length > 0) {
                var locationIndex = searchCurrentLocations(locationId);
                if (locationIndex != -1) {
                    return _currentLocations.splice(locationIndex, 1);
                } else {
                    return;
                }
            } else {
                return;
            }
        };

        var removeSavedLocationIndex = function(_locations, currentLocation) {
             for(var i = 0; i < _locations.length; i++) {
              if(_locations[i].location_id == currentLocation.location_id) return i;
            }
            return -1;
        }

        var searchCurrentLocations = function(locationId) {
            for(var i = 0; i < _currentLocations.length; i++) {
              if(_currentLocations[i].location_id == locationId) return i;
            }
            return -1;
        };

        bgGeo.on('geofence', geoFenceAction);
        bgGeo.on('motionchange', onMotionChange);
        bgGeo.on('heartbeat', sendStationaryLocation, sendStationaryFail);
        bgGeo.on('providerchange', setLocationSettings);

    	return {
            sendStationaryFail: sendStationaryFail,
            sendStationaryLocation: sendStationaryLocation,
            setStationaryConfig: setStationaryConfig,
            removeStationaryConfig: removeStationaryConfig,
            getGeoFences: getGeoFences,
    		config: config,
    		initGeo: initGeo,
    		geoFenceAction: geoFenceAction,
            onMotionChange: onMotionChange,
            startGeolocation: startGeolocation,
            stopGeolocation: stopGeolocation,
            setLocationSettings: setLocationSettings,
            getCurrentPosition: getCurrentPosition,
            inLocations: inLocations,
            getGeoState: getGeoState,
            addCurrentLocations: addCurrentLocations,
            removeCurrentLocations: removeCurrentLocations,
            removeSavedLocationIndex: removeSavedLocationIndex,
            searchCurrentLocations: searchCurrentLocations

    	};

    }];
  module.factory('bgGeolocate', bgGeolocateFactory);
})(angular);