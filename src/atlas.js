/*  
 *            $$\     $$\                     
 *            $$ |    $$ |                    
 *  $$$$$$\ $$$$$$\   $$ | $$$$$$\   $$$$$$$\ 
 *  \____$$\\_$$  _|  $$ | \____$$\ $$  _____|
 *  $$$$$$$ | $$ |    $$ | $$$$$$$ |\$$$$$$\  
 * $$  __$$ | $$ |$$\ $$ |$$  __$$ | \____$$\ 
 * \$$$$$$$ | \$$$$  |$$ |\$$$$$$$ |$$$$$$$  |
 *  \_______|  \____/ \__| \_______|\_______/
 *
 *  Kevin Wang: https://github.com/wangkevin1
 *
 */

var Atlas = angular.module('Atlas', ['ui.router']);

//////////////
//PRODUCTION//
//////////////

Atlas.config(['$compileProvider',
    function ($compileProvider) {
        $compileProvider.debugInfoEnabled(false);
    }
]);

///////////////
//MAIN ROUTER//
///////////////

Atlas.provider('atRouter', ['$urlRouterProvider',
    function ($urlRouterProvider) {

        var defaultRoute = function (route) {
            $urlRouterProvider.otherwise(route);
        };

        var $get = function () {
            return {

            };
        };

        return {
            $get: $get,
            defaultRoute: defaultRoute
        };
    }
]);

/////////
//BLOGS//
/////////

Atlas.provider('atBlog', ['$stateProvider',
    function ($stateProvider) {
        var _blogs = {};

        var BlogMeta = function (aData, aPrefix, aPostArray) {
            return {
                data: aData,
                prefix: aPrefix,
                postArray: aPostArray
            };
        };

        $stateProvider.state('blog', {
            abstract: true,
            url: '/blog',
            views: {
                'root@': {
                    templateUrl: 'vendor/atlas/templates/atBlog.html',
                    controller: ['$state', '$scope', 'atBlog',
                        function ($state, $scope, atBlog) {
                            $scope.getPost = function (blog, post) {
                                atBlog.getPostJson(blog, post, function (data) {
                                    $scope.atPost = data;
                                });
                            };
                            $scope.getArray = function (blog) {
                                atBlog.getPostArray(blog, function (data) {
                                    $scope.blogNav = data;
                                });
                            };
                        }
                    ]
                }
            }
        });

        var createBlog = function (name, aData, aPrefix, aPostArray) {
            _blogs[name] = new BlogMeta(aData, aPrefix, aPostArray);
            $stateProvider.state('blog.' + name, {
                url: '/' + name + '/:postId',
                views: {
                    'post@blog': {
                        templateUrl: 'vendor/atlas/templates/atBlogPost.html',
                        controller: ['$state', '$scope',
                            function ($state, $scope) {
                                $scope.getPost(name, $state.params.postId);
                            }
                        ]
                    },
                    'nav@blog': {
                        templateUrl: 'vendor/atlas/templates/atBlogNav.html',
                        controller: ['$scope',
                            function ($scope) {
                                $scope.blog = name;
                                $scope.getArray(name);
                        }]
                    }
                }
            });
            return this;
        };

        var $get = ['$http',
            function ($http) {
                var blogs = _blogs;

                var getPostJson = function (blogName, postId, callback) {
                    if (postId == '') {
                        getPostArray(blogName, function (data) {
                            postId = data[0].id;
                            var blog = blogs[blogName];
                            $http.get(blog.data + '/' + blog.prefix + postId + '.json')
                                .success(function (data, status, headers, config) {
                                    if (callback) {
                                        callback(data);
                                    }
                                }).error(function (data, status, headers, config) {
                                    console.error('atlas failed to retrieve: ' + blog.prefix + postId + '.json', '\nstatus: ' + status);
                                });
                        });
                    } else {
                        var blog = blogs[blogName];
                        $http.get(blog.data + '/' + blog.prefix + postId + '.json')
                            .success(function (data, status, headers, config) {
                                if (callback) {
                                    callback(data);
                                }
                            }).error(function (data, status, headers, config) {
                                console.error('atlas failed to retrieve: ' + blog.prefix + postId + '.json', '\nstatus: ' + status);
                            });
                    }
                };

                var getPostArray = function (blogName, callback) {
                    $http.get(blogs[blogName].postArray).success(function (data, status, headers, config) {
                        if (callback) {
                            callback(data);
                        }
                    });
                };

                return {
                    getPostJson: getPostJson,
                    getPostArray: getPostArray
                };
            }
        ];

        return {
            $get: $get,
            createBlog: createBlog
        };
    }
]);


////////////////
//POST CREATOR//
////////////////

Atlas.config(['$stateProvider',
    function ($stateProvider) {
        //static site engine data creator
        $stateProvider.state('atlas', {
            url: '/atlas',
            views: {
                'root@': {
                    templateUrl: 'vendor/atlas/templates/atlas.html'
                }
            }
        });
    }
]);

Atlas.constant('AT_POST_SECTION_TYPE', {
    text: 0x0010,
    image: 0x0020,
    video: 0x0030
});

Atlas.factory('FAtPostSection', ['AT_POST_SECTION_TYPE',
    function (AT_POST_SECTION_TYPE) {
        var PostSection = function (aType, aContent, aCaption) {
            aContent = aContent || '';
            switch (aType) {
            case AT_POST_SECTION_TYPE.text:
                return {
                    type: 'text',
                    content: aContent
                };
                break;
            case AT_POST_SECTION_TYPE.image:
                aCaption = aCaption || '';
                return {
                    type: 'image',
                    content: aContent,
                    caption: aCaption
                };
                break;
            case AT_POST_SECTION_TYPE.video:
                return {
                    type: 'video',
                    content: aContent,
                };
                break;
            }
        };
        return PostSection;
}]);

Atlas.controller('CPostCreator', ['$scope', 'FAtPostSection', 'AT_POST_SECTION_TYPE',
    function ($scope, PostSection, AT_POST_SECTION_TYPE) {
        this.thePost = {
            prefix: "",
            id: "",
            title: "",
            subtitle: "",
            date: "",
            author: "",
            sections: []
        };

        this.SECTION_TYPE = AT_POST_SECTION_TYPE;

        this.addSection = function (sect) {
            this.thePost.sections.push(new PostSection(sect));
        };

        this.deleteSection = function (sectId) {
            this.thePost.sections.splice(sectId, 1);
        };

        this.dateSetToday = function () {
            $scope.atPost.date.$setViewValue('');
            this.thePost.date = moment().format('YYYYMMDD');
        };

        this.addSection(AT_POST_SECTION_TYPE.text);

        this.exportJson = function () {
            var e = document.createElement('a');
            e.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.thePost)));
            e.setAttribute('download', this.thePost.prefix + 'Post' + this.thePost.id + '.json');
            e.click();
        };
}]);


/////////
//PAGES//
/////////

Atlas.provider('atPage', ['$stateProvider',
    function ($stateProvider) {
        var _pages = {};

        var PageMeta = function (aData) {
            return {
                data: aData
            };
        };

        var createPage = function (name, aData) {
            _pages[name] = new PageMeta(aData);
            $stateProvider.state(name, {
                url: '/' + name + '/:sectionId',
                views: {
                    'root@': {
                        templateUrl: aData,
                        controller: ['$state', '$scope', '$uiViewScroll',
                            function ($state, $scope, $uiViewScroll) {
                                $scope.$on('$stateChangeSuccess', function (e) {
                                    if ($state.params.sectionId == '') {
                                        $('body').animate({
                                            scrollTop: '0'
                                        }, 64);
                                    } else {
                                        $uiViewScroll($('#' + $state.params.sectionId));
                                    }
                                });
                            }
                        ]
                    }
                }
            });
            return this;
        };

        var $get = [

            function () {
                var pages = _pages;

                return {

                };
            }
        ];

        return {
            $get: $get,
            createPage: createPage
        };
    }
]);

//////////////////
//NAVIGATION BAR//
//////////////////

Atlas.provider('atNav', [

    function () {
        var _states = [];

        var addTab = function (aName, aState) {
            _states.push({
                name: aName,
                state: aState
            });
            return this;
        };

        var $get = [

            function () {
                var states = _states;

                var getTabs = function () {
                    return states;
                };

                return {
                    getTabs: getTabs
                };
            }
        ];
        return {
            $get: $get,
            addTab: addTab
        };
    }
]);

Atlas.directive('atNavBar', [

    function () {
        return {
            restrict: 'A',
            scope: {},
            templateUrl: 'vendor/atlas/templates/atNavBar.html',
            controller: ['$scope', 'atNav',
                function ($scope, atNav) {
                    $scope.tabs = atNav.getTabs();
                }
            ]
        };
    }
]);

//////////////
//ATLAS UTIL//
//////////////

Atlas.factory('prependChar', [

    function () {
        var prepend = function (num, char, length) {
            num = '' + num;
            if (num.length >= length) {
                return num;
            } else {
                return prepend(char + num, char, length);
            }
        };

        return prepend;
}]);

Atlas.filter('atDate', [

    function () {
        var atDate = function (date, format) {
            date = date || '';
            date = date.trim();
            format = format || false;
            if (date.length == 8) {
                var m = moment(date, 'YYYYMMDD');
                if (format == 'long') {
                    return m.format('MMMM Do, YYYY');
                } else if (format == 'us') {
                    return m.format('MM-DD-YYYY');
                } else {
                    return m.format('YYYY-MM-DD');
                }
            } else {
                return '0000-00-00';
            }
        };

        return atDate;
    }
]);

Atlas.directive('atCountdown', [

    function () {
        return {
            restrict: 'A',
            scope: {
                end: '@atCountdown',
                postMessage: '@atCountdownPost',
                id: '@atCountdownId'
            },
            template: '<h1 id="{{id}}">{{time}}<br><small>{{postMessage}}</small></h1>',
            controller: ['$scope', '$interval',
                function ($scope, $interval) {
                    var timerDaemon = $interval(function () {
                        $scope.time = moment.duration(moment($scope.end).valueOf() - moment().valueOf()).format('D  |  hh : mm : ss');
                    }, 1000);
        }]
        };
}]);

Atlas.directive('atCarousel', [
    function() {
        
    }
]);

console.log('%c\n' +
    '            $$\\     $$\\                      \n' +
    '            $$ |    $$ |                     \n' +
    '  $$$$$$\\ $$$$$$\\   $$ | $$$$$$\\   $$$$$$$\\  \n' +
    '  \\____$$\\\\_$$  _|  $$ | \\____$$\\ $$  _____| \n' +
    '  $$$$$$$ | $$ |    $$ | $$$$$$$ |\\$$$$$$\   \n' +
    ' $$  __$$ | $$ |$$\\ $$ |$$  __$$ | \\____$$\\  \n' +
    ' \\$$$$$$$ | \\$$$$  |$$ |\\$$$$$$$ |$$$$$$$  | \n' +
    '  \\_______|  \\____/ \\__| \\_______|\\_______/  \n' +
    '\n' +
    'Kevin Wang: https://github.com/wangkevin1                            \n\n ',
    'font-family: Consolas, Monaco, monospace; color: #bc2200');