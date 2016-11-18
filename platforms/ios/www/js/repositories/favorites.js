(function(angular, moment) {

  var module = angular.module('pockeyt.repositories.favorites', ['pockeyt.models.partner', 'pockeyt.services.whitelabel', 'pockeyt.services.api', 'pockeyt.services.my-pockeyt']);

  // module.filter(
  //     'partners_are',
  //     function() {
  //       return function(partners, prop, invert) {
  //         if(typeof prop !== 'string') throw new TypeError('prop argument to partners_are filter must be string');

  //         return partners.filter(function(element, index, arr) {
  //           var is = element[prop];
  //           return (!invert && !!is) || (!!invert && !is);
  //         });
  //       }
  //     }
  // );

  module.factory('favoritesRepository', ['$q', '$rootScope', 'Partner', 'whitelabel', 'PockeytApi', 'MyPockeyt', function($q, $rootScope, Partner, whitelabel, api, MyPockeyt) {

    var repository = {
      _stale: true,
      _cache: [],
      _unlocked: [],
      page: 1,
      hasMore: true,
      isLoading: false,
      empty: false,

      _transformFeed: function(posts) {
        return {
          id: posts.id,
          date: moment.utc(posts.published_at).local().toDate(),
          title: posts.title,
          body: posts.formatted_body,
          photo_url: posts.photo_path
        };
      },

      _transformPost: function(post) {
        return {
          id: post.post_id,
          date: moment.utc(post.published_at.date).local().toDate(),
          title: post.title,
          body: post.body,
          name: post.business_name,
          thumbnail_url: post.thumbnail_url,
          photo_url: post.photo_url,
          business_id: post.id,
          url: post.website,
          review_url: post.review_url,
          review_intro: post.review_intro,
          logo: post.logo ? post.logo : '',
          hero: post.hero ? post.hero : '',
          tags: post.tags,
          connected: false,
          featured: post.featured || false,
          feed: post.posts.map(this._transformFeed.bind(this)),
          info: post.formatted_description,
        };
      },

     _transformProfile: function(profile) {
        return {
          id: profile.id,
          business_id: profile.id,
          name: profile.business_name,
          url: profile.website,
          review_url: profile.review_url,
          review_intro: profile.review_intro,
          logo: profile.logo ? profile.logo : '',
          hero: profile.hero ? profile.hero : '',
          tags: profile.tags,
          connected: false,
          featured: profile.featured || false,
          feed: profile.posts.map(this._transformFeed.bind(this)),
          info: profile.formatted_description,
        };
      },

      _findInCache: function(id) {
        for(var i = 0; i < this._cache.length; i++) {
          if(this._cache[i].id == id) {
            return this.fix(this._cache[i]);
          }
        }

        return null;
      },

      find: function(id, rejectOnNotFound, ignoreStaleness) {
        var doFind = function(resolve, reject) {
          var partner = this._findInCache(id);
          if(partner == null) {
            if(typeof rejectOnNotFound === 'undefined' || !!rejectOnNotFound)
              reject(new Error('Could not find in cache and no remote available.'));
            else
              resolve(null);
          } else {
            resolve(partner)
          }
        }.bind(this);

        if(this._stale && (typeof ignoreStaleness === 'undefined' || !ignoreStaleness)) {
          return this.loadFavs().then(function() {
            return $q(doFind);
          });
        } else {
          return $q(doFind);
        }
      },

      /**
       *
       * @param {Partner} partner
       * @return {$q}
       */
      fix: function(partner) {
        return $q(function(resolve, reject) {
          whitelabel.checkForActiveSessions(function(data) {
            partner.unlocked = data.result;
            resolve(partner);
          }.bind(this), function(message) {
            reject(new Error(message));
          });
        }.bind(this));
      },

      /**
       *
       * @param {Partner} partner
       * @return {$q}
       */
      fixAll: function(partner) {
        var promises = this._cache.reduce(function(previous, current) {
          previous.push(this.fix(current));
          return previous;
        }.bind(this), []);

        return $q.all(promises);
      },

      loadFavs: function() {
        if (this.hasMore && !this.isLoading) {
          this.isLoading = true;
          this.empty = false;
          var page = this.page;

          var favoriteIds = MyPockeyt.allStoredFavorites();
          if (favoriteIds.length === 0) {
            favoriteIds = [5,7,15,20,53];
            this.empty = true;
          };

          return api.request('/favs?profiles=' + favoriteIds + '&page=' + page).then(function(response) {
            if (!response.data.meta.pagination.links.next) {
              this.hasMore = false;
             }
            var promises = response.data.data
                .map(this._transformPost.bind(this))
                .map(function(partnerData) {
                  return this.find(partnerData.id, false, true).then(function(partner) {
                    return $q.resolve({data: partnerData, partner: partner});
                  });
                }.bind(this));
            return $q.all(promises)
                .then(function(descriptors) {
                  angular.forEach(descriptors, function(descriptor) {
                    if(descriptor.partner == null) {
                      this._cache.push(new Partner(descriptor.data));
                    } else {
                      descriptor.partner.fill(descriptor.data);
                    }
                  }.bind(this));
                  this._stale = false;
                  this.isLoading = false;
                  return this._cache;
                }.bind(this));
          }.bind(this));
        }
      },

      loadMoreFavs: function() {
        if (repository.hasMore && !repository.isLoading) {
          this.page += 1;
          this.loadFavs();
        };
      },

      allFavs: function() {
        this._cache = [];
        this.page = 1;
        this.hasMore = true;
        return this.loadFavs();
      },

      allCached: function() {
        return this._cache;
      },

      allUnlocked: function() {
        this._unlocked.length = 0;
        this._cache.forEach(function(partner) {
          if(partner.unlocked === true) this._unlocked.push(partner);
        }.bind(this));
        return this._unlocked;
      }
    };

    $rootScope.$on('whitelabel.logout', repository.fixAll.bind(repository));
    $rootScope.$on('whitelabel.authentication.success', repository.fixAll.bind(repository));
    $rootScope.$on('whitelabel.authentication.failure', whitelabel.logout.bind(whitelabel, repository.fixAll.bind(repository)));

    return repository;

  }]);

})(angular, moment);