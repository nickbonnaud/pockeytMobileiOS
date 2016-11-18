(function(angular) {

  var module = angular.module('pockeyt.services.my-pockeyt', ['pockeyt.repositories.partners', 'pockeyt.models.partner', 'LocalStorageModule']);

  module.constant('MY_POCKEYT_FAVORITES_KEY', 'pockeyt.services.my-pockeyt.favorites');
  module.constant('FAVORITES_LOADED_EVENT', 'pockeyt.services.my-pockeyt.favorites-loaded');

  var MyPockeytFactory = [
    'MY_POCKEYT_FAVORITES_KEY',
    'FAVORITES_LOADED_EVENT',
    'partnersRepository',
    'Partner',
    '$rootScope',
    '$q',
    'localStorageService',
    function(FAVORITES_KEY, FAVORITES_LOADED_EVENT, partnersRepository, Partner, $rootScope, $q, storage) {

      var _cache = {
        favorites: false
      };

      var _updated = false;

      var getCache = function() {
        return $q.resolve(_cache);
      };

      var getFavorites = function() {
        if(storage.get(FAVORITES_KEY))
          return $q.resolve(storage.get(FAVORITES_KEY));
        else {
          return $q(function(resolve, reject) {
            var dereg = $rootScope.$on(FAVORITES_LOADED_EVENT, function() {
              dereg();
              resolve(storage.get(FAVORITES_KEY));
            });
          });
        }
      };

      var getCachedFavorites = function() {
        return !_cache.favorites ? [] : _cache.favorites;
      };

      var getStoredFavorites = function() {
        return !storage.get(FAVORITES_KEY) ? [] : storage.get(FAVORITES_KEY);
      };

      var loadFavoritesFromStorage = function() {
        var favorites = storage.get(FAVORITES_KEY);
        if(!angular.isArray(favorites)) {
          storage.set(FAVORITES_KEY, []);
          _cache.favorites = [];
          $rootScope.$broadcast(FAVORITES_LOADED_EVENT);
          return getFavorites();
        } else {
          var promises = [];
          angular.forEach(favorites, function(id) {
            promises.push(partnersRepository.find(id, false));
          });
          return $q.all(promises).then(function(favorites) {
            if(!angular.isArray(_cache.favorites))
              _cache.favorites = [];
            favorites = favorites.filter(function(favorite) {return favorite !== null});
            Array.prototype.push.apply(_cache.favorites, favorites);
            return saveFavoritesToStorage().then(function(favorites) {
              $rootScope.$broadcast(FAVORITES_LOADED_EVENT);
              return favorites;
            });
          });
        }
      };

      var fixFavorites = function() {
        var promises = [];
        angular.forEach(_cache.favorites, function(favorite, index) {
          promises.push(partnersRepository.find(favorite.id, false).then(
              function(partner) {
                return $q.resolve({index: index, favorite: favorite, partner: partner == null ? false : partner});
              }
          ));
        });
        return $q.all(promises).then(function(data) {
          var removeIndices = [];
          angular.forEach(data, function(comp) {
            if(!comp.partner)
              removeIndices.push(comp.index);
            else
              _cache.favorites[comp.index] = comp.partner;
          });
          if(removeIndices.length > 0) {
            removeIndices.sort(function(a, b) {
              return b - a;
            });
            angular.forEach(removeIndices, function(k) {
              _cache.favorites.splice(k, 1);
            });
          }
        });
      };

      var saveFavoritesToStorage = function(partner) {
        return getFavorites().then(function(favorites) {
          var ids = [];
          angular.forEach(favorites, function(favorite) {
            ids.push(favorite)
          });

          if (partner) {
            ids.push(partner.business_id);
          };
          return storage.set(FAVORITES_KEY, ids) ? $q.resolve(favorites) : $q.reject(new Error('Failed to store favorites.'));
        });
      };

      var addFavorite = function(partner) {
        var promise = ((angular.isString(partner) || angular.isNumber(partner)) ?
                partnersRepository.find(partner) :
                $q.resolve(partner)
        );

        return promise
            .then(function(partner) {
              if(isFavorite(partner)) {
                return $q.resolve(partner);
              } else {
                return saveFavoritesToStorage(partner).then(function() {
                  return $q.resolve(partner);
                });
              }
            });
      };

      var removeFavorite = function(partner) {
        var promise = ((angular.isString(partner) || angular.isNumber(partner)) ?
                partnersRepository.find(partner) :
                $q.resolve(partner)
        );

        return promise
            .then(function(partner) {
              var removed = false;
              var ids = [];

              angular.forEach(getStoredFavorites(), function(favorite, index) {
                ids.push(favorite);
                if(!removed && favorite === partner.business_id) {
                  ids.splice(index, 1);
                  removed = true;
                }
                return !removed;
              });

              if(removed) {
                return storage.set(FAVORITES_KEY, ids) ? $q.resolve(partner) : $q.reject(new Error('Failed to remove partner'));
              } else {
                return $q.resolve(partner);
              }
            });
      };

      var isFavorite = function(partner) {
        var isFavorite = false;
        angular.forEach(getStoredFavorites(), function(favorite) {
          if(favorite == partner.business_id) {
            isFavorite = true;
            return false;
          }
        });
        return isFavorite;
      };

      var toggleFavorite = function(partner) {
        _updated = true;
        return isFavorite(partner) ? removeFavorite(partner) : addFavorite(partner);
      };

      var checkUpdated = function() {
        return _updated;
      };

      var updateCheck = function() {
        _updated = false;
      };

      $rootScope.$watch(function() {
        return partnersRepository.allCached();
      }, function(val) {
        fixFavorites(val);
      }, true);

      return {
        reload: loadFavoritesFromStorage,
        save: saveFavoritesToStorage,
        allCached: getCache,
        allFavorites: getFavorites,
        allCachedFavorites: getCachedFavorites,
        allStoredFavorites: getStoredFavorites,
        addFavorite: addFavorite,
        removeFavorite: removeFavorite,
        isFavorite: isFavorite,
        toggleFavorite: toggleFavorite,
        checkUpdated: checkUpdated,
        updateCheck: updateCheck
      };

    }];

  module.factory('MyPockeyt', MyPockeytFactory);

  module.run(['MyPockeyt', function(MyPockeyt) {
    MyPockeyt.reload();
  }]);

})(angular);