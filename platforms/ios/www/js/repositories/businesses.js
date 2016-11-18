(function(angular, moment) {

  var module = angular.module('pockeyt.repositories.businesses', ['pockeyt.models.partner', 'pockeyt.services.whitelabel', 'pockeyt.services.api']);

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

  module.factory('businessesRepository', ['$q', '$rootScope', 'Partner', 'whitelabel', 'PockeytApi', function($q, $rootScope, Partner, whitelabel, api) {

    var repository = {
      _stale: true,
      _cache: [],
      _unlocked: [],
      page: 1,
      hasMore: true,
      isLoading: false,
      search: null,
      noResults: false,

      doSearch: function (search) {
        this.hasMore = true;
        this.page = 1;
        this._cache = [];
        this.search = search.input;
        this.loadSearch(search);
      },

      _transformFeed: function(posts) {
        return {
          id: posts.id,
          date: moment.utc(posts.published_at).local().toDate(),
          title: posts.title,
          body: posts.formatted_body,
          photo_url: posts.photo_path
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
          return this.loadBizs().then(function() {
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

      loadBizs: function() {
        if (this.hasMore && !this.isLoading) {
          this.isLoading = true;
          var page = this.page;

          return api.request('/profilesv1?page=' + page).then(function(response) {
            if (!response.data.meta.pagination.links.next) {
              this.hasMore = false;
             }
            var promises = response.data.data
                .map(this._transformProfile.bind(this))
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

      loadMoreBizs: function() {
        if (repository.hasMore && !repository.isLoading) {
          this.page += 1;
          if(this.search === null || this.search === "") {
            this.loadBizs();
          } else {
            return this.loadSearch(this.search);
          }
        }
      },

      loadSearch: function(search) {
        this.noResults = false;
        this.search = search;
        if (search === "") {
          search = null;
          return this.loadBizs();
        }

        if (this.hasMore && !this.isLoading) {
          this.isLoading = true;
          var page = this.page;
          return api.request('/search?input=' + search + '&page=' + page).then(function(response) {
            if (!response.data.meta.pagination.links.next) {
              this.hasMore = false;
              this.search = null;
             }
             if (!response.data.meta.pagination.count) {
              this.noResults = true;
             }
            var promises = response.data.data
                .map(this._transformProfile.bind(this))
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
                  this.isLoading = false;
                  return this._cache;
                }.bind(this));
          }.bind(this));
        }
      },

      allBizs: function() {
        this._cache = [];
        this.page = 1;
        this.hasMore = true;
        return this.loadBizs();
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