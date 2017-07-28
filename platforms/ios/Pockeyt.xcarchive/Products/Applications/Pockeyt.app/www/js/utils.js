(function(angular, $) {

  var isEventSupported = window.isEventSupported = (function(){
    var TAGNAMES = {
      'select':'input','change':'input',
      'submit':'form','reset':'form',
      'error':'img','load':'img','abort':'img'
    };
    function isEventSupported(eventName) {
      var el = document.createElement(TAGNAMES[eventName] || 'div');
      eventName = 'on' + eventName;
      var isSupported = (eventName in el);
      if (!isSupported) {
        el.setAttribute(eventName, 'return;');
        isSupported = typeof el[eventName] == 'function';
      }
      el = null;
      return isSupported;
    }
    return isEventSupported;
  })();

  var module = angular.module('pockeyt.utils', ['ui.router']);

  module.directive(
      'target',
      function() {
        return {
          restrict: 'A',
          link: function(scope, $elem, attrs) {
            if((attrs.target === '_blank' || attrs.target === '_system') && attrs.href) {
              $elem.on('click', function(event) {
                event.preventDefault();
                console.log('using window.open with target=_system');
                window.open(attrs.href, '_system');
              });
            }
          }
        };
      }
  );

  module.directive(
      'eveBackgroundImage',
      function() {
        return {
          restrict: 'A',
          scope: {
            image: '=eveBackgroundImage'
          },
          link: function(scope, $elem, attrs) {
            if(typeof scope.image === 'string') {
              $elem.css({
                'background-image': 'url(\'' + scope.image + '\')'
              });
            }
          }
        };
      }
  );

  module.directive(
      'eveHashCatch',
      function() {
        return {
          restrict: 'AC',
          link: function(scope, $elem, attrs) {
            $elem.on('click', 'a', function(event) {
              if($(this).attr('href') === '#') {
                event.preventDefault();
              }
            });
          }
        };
      }
  );

  module.directive(
      'controlItem',
      function() {
        return {
          restrict: 'C',
          link: function(scope, $elem, attrs) {
            $elem.on('click', function(event) {
              event.preventDefault();
            });
          }
        };
      }
  );

  module.filter(
      'url',
      function() {
        return function(url) {
          return typeof url === 'string' ? (((!/^https?:\/\//i.test(url)) ? 'http://' : '') + url) : url;
        };
      }
  );

  module.filter(
      'domain',
      function() {
        return function(url) {
          return typeof url === 'string' ? url.replace(/^https?:\/\//i, '') : url;
        }
      }
  );

  module.filter(
      'shuffle',
      function() {
        return function(arr){
          if(!Array.isArray(arr)) return arr;
          var o = arr.slice();
          for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x) {}
          return o;
        }
    }
  );

  module.filter(
      'reverse',
      function() {
        return function(data){
          if(Array.isArray(data)) {
            var o = data.slice();
            o.reverse();
            return o;
          }
          return data;
        }
    }
  );

})(angular, jQuery);