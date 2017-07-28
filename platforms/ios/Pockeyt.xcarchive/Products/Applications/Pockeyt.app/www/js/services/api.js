(function(angular) {

  var module = angular.module('pockeyt.services.api', ['LocalStorageModule', 'pockeyt.services.whitelabel']);

  var errors = {
    'general': 'Something went wrong and we\'re not quite sure what :-/ Try again or contact an administrator.'
  };

  var apiFactory = [
    '$http', '$injector', '$q', '$log', 'whitelabel', 'localStorageService', 'CONFIG',
    function($http, $injector, $q, $log, whitelabel, storage, CONFIG) {

      var PORTAL_API_BASE_URL = CONFIG.PORTAL_API_BASE_URL,
          AUTH_API_BASE_URL = CONFIG.AUTH_API_BASE_URL,
          AUTH_API_OAUTH_ACCESS_TOKEN_URL = CONFIG.AUTH_API_OAUTH_ACCESS_TOKEN_URL,
          AUTH_API_OAUTH_CLIENT_ID = CONFIG.AUTH_API_OAUTH_CLIENT_ID,
          AUTH_API_OAUTH_CLIENT_SECRET = CONFIG.AUTH_API_OAUTH_CLIENT_SECRET;

      var Api = function() {
        this.access_token = false;
        this._loadAccessTokenFromStorage();
      };

      Api.prototype = {

        _headersFromArray: function(headers) {
          if(!Array.isArray(headers)) throw new TypeError('Api::_headersFromArray\'s first and only argument must be an array.');
          return headers.reduce(function(prev, curr, idx, arr) {
            if(typeof curr === 'function' || (Array.isArray(curr) && typeof curr[curr.length-1] === 'function'))
              curr = $injector.invoke(curr);

            if(typeof curr === 'string') {
              var parts = curr.split(':');
              if(parts.length === 2) {
                prev[parts[0].trim()] = prev[parts[1].trim()];
              }
            }

            return prev;
          }, {});
        },

        _auth_request: function(endpoint, data, method, headers) {
          var conf;

          if(arguments.length === 1 && typeof endpoint === 'object') {
            conf = endpoint;
            if(typeof conf.endpoint === 'string') {
              conf.url = AUTH_API_BASE_URL + conf.endpoint;
            }
          } else {
            conf = {
              url: AUTH_API_BASE_URL + endpoint,
              data: (typeof data === 'undefined') ? {} : data,
              method: (typeof method !== 'string') ? 'GET' : method.toUpperCase(),
              headers: (typeof headers !== 'object') ? {} : (Array.isArray(headers) ? this._headersFromArray(headers) : headers)
            };
          }

          var finish = function(conf, token) {
            if(token)
              conf.headers['Authorization'] = 'Bearer ' + token;

            return $http(conf);
          }.bind(this);

          if(!this._isAccessTokenValid() && this._hasUserCredentials()) {
            var credentials = this._getUserCredentials();
            return this.login(credentials.email, credentials.password).then(
                function() {
                  return finish(conf, this.access_token);
                }.bind(this),
                function() {
                  return finish(conf, false);
                }.bind(this)
            );
          }

          return finish(conf, this.access_token.value);
        },

        _loadAccessTokenFromStorage: function() {
          this.access_token = storage.get('access_token');
          if(!this._isAccessTokenValid()) {
            this.access_token = false;
          }
        },

        _setAccessTokenFromResponse: function(response) {
          this.access_token = {
            value: response.data.access_token,
            expires_at: response.data.expires_at * 1000
          };

          if(!this._isAccessTokenValid()) {
            this.access_token = false;
            return false;
          }

          return storage.set('access_token', this.access_token);
        },

        _isAccessTokenValid: function() {
          return (this.access_token !== null &&
                  typeof this.access_token === 'object' &&
                  typeof this.access_token.value === 'string' &&
                  this.access_token.value &&
                  typeof this.access_token.expires_at === 'number' &&
                  this.access_token.expires_at > Date.now());
        },

        // Currently stores with localStorage. Should store username and password in a more secure, native storage
        // solution. Perhaps adapt to use MD5 hashed password
        _storeUserCredentials: function(email, password) {
          return storage.set('credentials', {email: email, password: password});
        },

        _getUserCredentials: function() {
          return storage.get('credentials');
        },

        _hasUserCredentials: function() {
          var credentials = this._getUserCredentials();
          return (credentials !== null &&
              typeof credentials === 'object' &&
              typeof credentials.email === 'string' &&
              typeof credentials.password === 'string');
        },

        _clearUserCredentials: function() {
          storage.remove('credentials');
        },

        _clearAccessToken: function() {
          this.access_token = false;
          storage.remove('access_token');
        },

        _clear: function() {
          this._clearUserCredentials();
          this._clearAccessToken();
        },

        parseErrorResponse: function(response) {
          if(response !== null && typeof response === 'object' && response.data !== null && typeof response.data === 'object') {
            if(typeof response.data.error === 'string' && typeof errors[response.data.error] === 'string') {
              return errors[response.data.error];
            } else if(typeof response.data.message === 'string') {
              return response.data.message;
            }
          }

          return errors['general'];
        },

        login: function(email, password) {
          return $http({
            url: AUTH_API_OAUTH_ACCESS_TOKEN_URL,
            method: 'GET',
            params: {
              grant_type: 'password',
              client_id: AUTH_API_OAUTH_CLIENT_ID,
              client_secret: AUTH_API_OAUTH_CLIENT_SECRET,
              username: email,
              password: password,
              scope: 'whitelabel.pair'
            }
          }).then(
              function(response) {
                this._setAccessTokenFromResponse(response);
                this._storeUserCredentials(email, password);

                return this._auth_request('/whitelabel/pair').then(
                    function(response) {
                      return $q(function(resolve, reject) {
                        $log.log('Attempting to register whitelabel user with pairing code: ' + response.data.code);
                        whitelabel.registerUser(response.data.code, resolve, reject);
                      }.bind(this)).catch(function(error) {
                        $log.error('Failed to pair with WhiteLabel in the SDK: ', error);
                        this._clear();
                        return $q.reject({data:error});
                      }.bind(this));
                    }.bind(this),
                    function(response) {
                      $log.error('Failed to pair with WhiteLabel on the server: ', response);
                      this._clear();
                      return $q.reject(response);
                    }.bind(this)
                );
              }.bind(this),
              function(response) {
                $log.error('There was an error logging in and getting the access token. Response:', response);
                return $q.reject(response);
              }.bind(this)
          );
        },

        // TODO Hit up the API to validate the token
        isLoggedIn: function() {
          return this._isAccessTokenValid();
        },

        logout: function() {
          this._clear();
          return $q(function(resolve, reject) {
            whitelabel.logout(
                function() {
                  whitelabel.unpair(resolve, reject);
                },
                reject
            );
          }.bind(this)).catch(function() {
            $log.error('Failed to unpair launchkey user: ', arguments);
            return $q.reject();
          });
        },

        request: function(endpoint, data, method, headers) {
          var conf;

          if(arguments.length === 1 && typeof endpoint === 'object') {
            conf = endpoint;
            if(typeof conf.endpoint === 'string') {
              conf.url = PORTAL_API_BASE_URL + conf.endpoint;
            }
          } else {
            conf = {
              url: PORTAL_API_BASE_URL + endpoint,
              data: (typeof data === 'undefined') ? {} : data,
              method: (typeof method !== 'string') ? 'GET' : method.toUpperCase(),
              headers: (typeof headers !== 'object') ? {} : (Array.isArray(headers) ? this._headersFromArray(headers) : headers)
            };
          }

          return $http(conf);
        }

      };

      return $injector.instantiate(Api);
    }
  ];

  module.factory('PockeytApi', apiFactory);

})(angular);