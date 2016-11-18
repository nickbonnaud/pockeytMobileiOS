(function(angular) {

  var pockeyt = angular.module('pockeyt',
      [
        // Third-party deps
        'ngAnimate',
        'ngSanitize',
        'ui.router',
        'snap',
        'LocalStorageModule',
        'infinite-scroll',
        'angularSpinner',
        'hm.readmore',
        'ct.ui.router.extras',
        'satellizer',

        // App components
        'pockeyt.utils',
        'pockeyt.config',
        'pockeyt.services.api',
        'pockeyt.services.my-pockeyt',
        'pockeyt.services.user-service',
        'pockeyt.services.bookmark',
        'pockeyt.services.geolocate',
        'pockeyt.services.authorization',
        'pockeyt.services.pouch-database',
        //'pockeyt.controllers.left_drawer',
        //'pockeyt.controllers.right_drawer',
        'pockeyt.controllers.login',
        'pockeyt.controllers.partner',
        'pockeyt.controllers.my-pockeyt',
        'pockeyt.controllers.connect',
        'pockeyt.controllers.explore',
        'pockeyt.controllers.referral',
        'pockeyt.controllers.events',
        'pockeyt.controllers.blogs',
        'pockeyt.controllers.bookmark',
        'pockeyt.controllers.main',
        'pockeyt.controllers.profile',
        'pockeyt.controllers.signup',
        'pockeyt.controllers.pay',
        'pockeyt.directives.partner',
        'pockeyt.directives.date-picker',
        'pockeyt.directives.title-search',
        'pockeyt.directives.contact-us',
        'pockeyt.directives.favorite',
        'pockeyt.directives.business',
        'pockeyt.directives.event',
        'pockeyt.directives.blog',
        'pockeyt.directives.bookmark',
        'pockeyt.directives.password-match',
      ]
  );

  pockeyt.config(function($urlRouterProvider) {
    // Don't sync the url till we're ready
    $urlRouterProvider.deferIntercept();
  });

  pockeyt.run(function($rootScope, $state, $q, $urlRouter) {

    function DelayPromise(delay) {  
      //return a function that accepts a single variable
      return function(data) {
        //this function returns a promise.
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            //a promise that is resolved after "delay" milliseconds with the data provided
            resolve(data);
          }, delay);
        });
      }
    };
    // get list of all registered states
    $rootScope.isBooting = true;
    // SpinnerPlugin.activityStart("Loading...");
    $state.get()
       // limit to those with 'state.preload'
      .filter(function(state) { return state.preload; })
      // create a promise chain that goes to the state, then goes to the next one
      .reduce(function (memo, state) {
        // dont update the location (location: false)
        return memo.then(DelayPromise(1000)).then(function() {
          return $state.go(state, undefined, { location: false }); 
        });
      }, $q.when())
      .then(function() {
        // ok, now sync the url
        $urlRouter.listen();
        // SpinnerPlugin.activityStop();
        $rootScope.isBooting = false;
      });
  });

  pockeyt.run(['$rootScope', '$state', '$stateParams', '$log', 'Authorization', 'UserService', 'PouchDatabase', 'PockeytApi',
    function($rootScope,   $state,   $stateParams, $log, Authorization, UserService, PouchDatabase, api) {
      
      PouchDatabase.setDatabase("data");

      $rootScope.$state = $state;
      $rootScope.$stateParams = $stateParams;
      $rootScope.$on('$stateChangeStart', function(event, toState, toStateParams) {
        $rootScope.toState = toState;
        $rootScope.toStateParams = toStateParams;
        if (UserService.isIdentityResolved()) {
          Authorization.authorize();
        }
      });
      // FastClick.attach(document.body);
      PouchDatabase.getUserData();
    }
  ]);

  pockeyt.config(['$stateProvider', '$stickyStateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', '$authProvider', 'localStorageServiceProvider',
    function($stateProvider, $stickyStateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, $authProvider, localStorageServiceProvider) {

      var UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      $urlMatcherFactoryProvider.type('uuid4', {
        encode: function(uuid) {return uuid;},
        decode: function(uuid) {return uuid;},
        is: function(item) {
          return UUID_REGEX.test(item);
        }
      });

      var stateDetailsResolver = ['$state', function($state) {
        return {
          state: $state.current,
          params: $state.params,
          previousName: $state.current.name,
          url: $state.href($state.current.name, $state.params)
        };
      }];

      $stateProvider
          .state('fullscreen', {
            templateUrl: 'templates/layouts/fullscreen.html',
            abstract: true
          })
          .state('main', {
            templateUrl: 'templates/layouts/main.html',
            controller: 'MainController',
            controllerAs: 'main',
            abstract: true,
          })
          /*
          .state('login', {
            parent: 'fullscreen',
            templateUrl: 'templates/login.html',
            controller: 'LoginController',
            controllerAs: 'login',
            url: '/login'
          })*/
          .state('main.explore', {
            parent: 'main',
            views: {
              'explore': {
                templateUrl: 'templates/explore.html',
                controller: 'ExploreController',
                controllerAs: 'explore',
              }
            },
            url: '/explore',
            sticky: true,
            dsr: true,
            preload: true,
            resolve: {
              allPartners: ['partnersRepository', function(partners) {
                return partners.all();
              }]
            }
          })
          .state('main.connect', {
            parent: 'main',
            views: {
              'connect': {
                templateUrl: 'templates/connect.html',
                controller: 'ConnectController',
                controllerAs: 'connect',
              }
            },
            url: '/connect',
            sticky: true,
            dsr: true,
            preload: true,
            resolve: {
              allPartners: ['businessesRepository', function(partners) {
                return partners.allBizs();
              }]
            }
          })
          .state('referral', {
            parent: 'main',
            templateUrl: 'templates/referral.html',
            url: '/referral',
            controller: 'ReferralController',
            controllerAs: 'referral',
          })
          .state('main.events', {
            parent: 'main',
            views: {
              'events': {
                templateUrl: 'templates/events.html',
                controller: 'EventsController',
                controllerAs: 'events',
              }
            },
            url: '/events',
            sticky: true,
            dsr: true,
            preload: true,
            resolve: {
              allPartners: ['eventsRepository', function(partners) {
                return partners.doEvents();
              }]
            }
          })
          .state('main.blogs', {
            parent: 'main',
            views: {
              'blogs': {
                templateUrl: 'templates/blogs.html',
                controller: 'BlogsController',
                controllerAs: 'blogs',
              }
            },
            url: '/blogs',
            sticky: true,
            dsr: true,
            preload: true,
            resolve: {
              allPartners: ['blogsRepository', function(partners) {
                return partners.all();
              }]
            }
          })
          .state('main.my-pockeyt', {
            parent: 'main',
            views: {
              'my-pockeyt': {
                templateUrl: 'templates/my-pockeyt.html',
                controller: 'MyPockeytController',
                controllerAs: 'myPockeyt',
              }
            },
            url: '/my-pockeyt',
            sticky: true,
            dsr: true,
            preload: true,
            resolve: {
              allPartners: ['favoritesRepository', function(partners) {
                return partners.allFavs();
              }]
            }
          })
          .state('main.bookmark', {
            parent: 'main',
            views: {
              'bookmark': {
                templateUrl: 'templates/bookmark.html',
                controller: 'BookmarkController',
                controllerAs: 'bookmark',
              }
            },
            url: '/bookmark',
            sticky: true,
            dsr: true,
            resolve: {
              allPartners: ['bookmarksRepository', function(partners) {
                return partners.allBookmarks();
              }]
            }
          })
          .state('main.login', {
            parent: 'main',
            url: '/login',
            templateUrl: 'templates/login.html',
            controller: 'LoginController',
          })
          .state('main.pay', {
            parent: 'main',
            url: '/pay',
            templateUrl: 'templates/pay.html',
            controller: 'PayController',
          })
          .state('main.signup', {
            parent: 'main',
            url: '/signup',
            templateUrl: 'templates/signup.html',
            controller: 'SignupController',
          })
          .state('main.profile', {
            parent: 'main',
            views: {
              'profile': {
                templateUrl: 'templates/profile.html',
                controller: 'ProfileController',
                controllerAs: 'profile',
              }
            },
            url: '/profile',
            sticky: true,
            dsr: true,
            resolve: {
              authorize: ['Authorization', function(Authorization) {
                console.log(Authorization.authorize());
                return Authorization.authorize();
              }]
            }
          })
          .state('main.profile.edit', {
            parent: 'main',
            url: '/edit',
            templateUrl: 'templates/edit-profile.html',
            controller: 'ProfileController',
            controllerAs: 'profile',
            resolve: {
              authorize: ['Authorization', function(Authorization) {
                return Authorization.authorize();
              }]
            }
          })
          .state('main.explore.partner', {
            parent: 'main',
            templateUrl: 'templates/partner-explore.html',
            controller: 'PartnerController',
            controllerAs: 'partner',
            params: {
              partner: {value: undefined}
            },
            url: '/partner/{partner}',
            resolve: {
              partner: ['$stateParams', 'partnersRepository',
                function($stateParams, partners, $state) {
                  return partners.find($stateParams.partner);
                }
              ]
            },
            
          })
          .state('main.my-pockeyt.favorite', {
            parent: 'main',
            templateUrl: 'templates/partner-my-pockeyt.html',
            controller: 'PartnerController',
            controllerAs: 'partner',
            params: {
              partner: {value: undefined}
            },
            url: '/favorite/{partner}',
            resolve: {
              partner: ['$stateParams', 'favoritesRepository',
                function($stateParams, partners, $state) {
                  return partners.find($stateParams.partner);
                }
              ]
            },
            
          })
          .state('main.bookmark.saved', {
            parent: 'main',
            templateUrl: 'templates/partner-bookmark.html',
            controller: 'PartnerController',
            controllerAs: 'partner',
            params: {
              partner: {value: undefined}
            },
            url: '/saved/{partner}',
            resolve: {
              partner: ['$stateParams', 'bookmarksRepository',
                function($stateParams, partners, $state) {
                  return partners.find($stateParams.partner);
                }
              ]
            },
          })
          .state('main.connect.business', {
            parent: 'main',
            templateUrl: 'templates/partner-find.html',
            controller: 'PartnerController',
            controllerAs: 'partner',
            params: {
              partner: {value: undefined}
            },
            url: '/business/{partner}',
            resolve: {
              partner: ['$stateParams', 'businessesRepository',
                function($stateParams, partners, $state) {
                  return partners.find($stateParams.partner);
                }
              ]
            },
            
          })/*
          .state('my-profile', {
            parent: 'main',
            templateUrl: 'templates/my-profile.html',
            url: '/my-profile'
          })
          .state('payment', {
            parent: 'main',
            templateUrl: 'templates/payment.html',
            url: '/payement'
          })*/
          .state('settings', {
            parent: 'main',
            templateUrl: 'templates/settings.html',
            url: '/settings'
          });

      $urlRouterProvider.otherwise('/my-pockeyt');

      $authProvider.loginUrl = 'http://162.243.168.64/api/authenticate';
      $authProvider.signupUrl = 'http://162.243.168.64/api/register';

      localStorageServiceProvider
          .setPrefix('pockeyt')
          .setStorageType('localStorage')
          .setStorageCookie(0, '/')
          .setStorageCookieDomain('')
          .setNotify(true, true);
    }
  ]);

})(angular);