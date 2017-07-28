(function(angular, moment) {

  var module = angular.module('pockeyt.repositories.blogs', ['pockeyt.models.partner', 'pockeyt.services.whitelabel', 'pockeyt.services.api']);

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

  module.factory('blogsRepository', ['$q', '$rootScope', 'Partner', 'whitelabel', 'PockeytApi', function($q, $rootScope, Partner, whitelabel, api) {

    var repository = {
      _stale: true,
      _cache: [],
      _unlocked: [],
      page: 1,
      hasMore: true,
      isLoading: false,
      search: null,
      noResults: false,
      searchActive: false,

      doSearch: function (search) {
        this.searchActive = true;
        this.hasMore = true;
        this.page = 1;
        this._cache = [];
        this.search = search.input;
        this.loadSearch(search);
      },

      _transformPost: function(post) {
        return {
          id: post.blog_id,
          author: post.author,
          personal_description: post.description,
          blog_title: post.blog_title,
          blog_body: post.blog_body,
          blog_hero_url: post.blog_hero_url,
          blog_profile_url: post.blog_profile_url,
          blog_formatted_body: post.blog_formatted_body,
          date: moment.utc(post.published_at.date).local().toDate(),
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
            return $q(doFind);
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

      reload: function() {
        if (this.hasMore && !this.isLoading) {
          this.isLoading = true;
          var page = this.page;

          return api.request('/blogs?page=' + page).then(function(response) {
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

      loadMore: function() {
        if (repository.hasMore && !repository.isLoading) {
          this.page += 1;
          if(this.search === null || this.search === "") {
            this.reload();
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
          this.searchActive = false;
          return this.reload();
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

      all: function() {
        this._cache = [];
        this.page = 1;
        this.hasMore = true;
        this.searchActive = false;
        return this.reload();
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