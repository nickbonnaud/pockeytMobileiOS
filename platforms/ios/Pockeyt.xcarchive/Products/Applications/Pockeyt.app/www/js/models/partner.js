(function(angular) {

  var module = angular.module('pockeyt.models.partner', ['pockeyt.models.generic', 'pockeyt.services.whitelabel']);

  module.factory('Partner', ['$q', 'Generic', 'whitelabel', function($q, Generic, whitelabel) {
    /**
     *
     * @constructor
     * @property {string} id
     * @property {string} name
     * @property {string} url
     * @property {string} logo
     * @property {string} hero
     * @property {{date: Date|bool,body:string}[]} feed
     * @property {string} info
     * @property {bool} unlocked
     * @property {bool} connected
     * @property {bool} featured
     * @property {moment|Date} updated_at
     * @property {moment|Date} created_at
     */
    var Partner = function() {
      Generic.apply(this, arguments);

      this.setInfo(this.info);
      // this.setFeed(this.feed);
    };

    Partner.guarded = ['info', 'feed'];

    Partner.prototype = {
      fillAll: Generic.prototype.fillAll,

      fill: function(attributes) {
        var fillableAttributes = {};
        angular.forEach(attributes, function(val, attribute) {
          if(Partner.guarded.indexOf(attribute) === -1)
            fillableAttributes[attribute] = val;
        });
        this.fillAll(fillableAttributes);
        if(typeof attributes.info !== 'undefined')
          this.setInfo(attributes.info);
        if(typeof attributes.feed !== 'undefined')
          this.setFeed(attributes.feed);
      },

      lock: function() {
        return $q(function(resolve, reject) {
          whitelabel.logout(resolve, reject);
        });
      },
      lockIfUnlocked: function() {
        if(this.unlocked) this.lock();
      },
      /**
       *
       * @param {{body: string, date: Date}[]} feed
       */
      setFeed: function(feed) {
        if(!Array.isArray(feed)) feed = [];
        this.feed = feed.reduce(function(carry, item) {
          if(typeof item.body !== 'string' || typeof item.title !== 'string') return carry;
          carry.push({title: item.title, body: item.body, date: (item.date instanceof Date ? item.date : false)});
          return carry;
        }, []);
        this.feed.sort(function(a, b) {
          if(!a.date && !b.date)  return 0;
          else if(!a.date) return -1;
          else if(!b.date) return 1;
          else return a.date.getTime() - b.date.getTime();
        });
      },
      /**
       *
       * @param {string} info
       */
      setInfo: function(info) {
        this.info = typeof info === 'string' ? info : '';
      },
      /**
       * @return {{body: string, date: Date}}
       */
      getTopFeedItem: function() {
        if(this.feed.length == 0) return false;
        else return this.feed[this.feed.length - 1];
      }
    };
    return Partner;
  }]);
  
})(angular);