(function(angular) {

  var module = angular.module('pockeyt.models.generic', []);

  module.factory('Generic', function() {
    var Generic = function(attributes) {
      this.fillAll(attributes);
    };
    Generic.prototype = {
      fillAll: function(attributes) {
        if(typeof attributes === 'object') {
          for(var attribute in attributes) {
            if(attributes.hasOwnProperty(attribute)) {
              this[attribute] = attributes[attribute];
            }
          }
        }
      }
    };
    return Generic;
  });
  
})(angular);