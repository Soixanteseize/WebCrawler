'use strict';

var Socket = function() {
    //this.socket = io('http://kookai-pprod.soixanteseize-lab.com:3001');
    this.socket = io();
    return this.socket;
};
var socket = new Socket();

var app = angular.module('app', [
    'ngRoute',
    'app.filters',
    'app.services',
    'app.directives',
    'app.controllers'
]);
app.socket = socket;


app.config(['$routeProvider',
    function($routeProvider) {

    }
]);

var appControllers = angular.module('app.controllers', []);
appControllers.controller('appCtrl', [
    '$scope',
    '$http',
    function($scope, $http) {
        $scope.errors = [];
        $scope.logs = [];
        $scope.percent = 0;
        $scope.executedCount = 0;
        $scope.remainingCount = 0;
        $scope.errorCount = 0;
        app.socket.on('errorCrawler', function(data) {
            $scope.errors.push(data.error.toString());
        });
        app.socket.on('startCrawler', function(data) {
            $scope.percent = data.percent;
            $scope.$apply();
        });
        app.socket.on('errorFileCrawler', function(data) {
            $scope.logs.push({
                type: 'error',
                message: data.error
            });
            $scope.percent = data.percent;
            $scope.errorCount =  data.errorCount;
            $scope.executedCount = data.executedCount;
            $scope.remainingCount = data.remainingCount;
            $scope.$apply();
        });
        app.socket.on('successFileCrawler', function(data) {
            $scope.logs.push({
                type: 'success',
                message: data.url
            });
            $scope.errorCount =  data.errorCount;
            $scope.executedCount = data.executedCount;
            $scope.remainingCount = data.remainingCount;
            $scope.percent = data.percent;
            $scope.$apply();
        });
    }
]);

var appDirectives = angular.module('app.directives', []);

appDirectives.directive('startCrawler', [
    function() {
        return function($scope, $element, attrs) {
            $element.submit(function() {
                var sitemapUrl = $element.find('.sitemapUrl').val();
                var offset = $element.find('.offset').val();
                if (offset === '') {
                    offset = 0;
                }
                offset = parseInt(offset);
                if (sitemapUrl === '') {
                    var error = new Error('The sitemap url is empty');
                    $scope.errors = [];
                    $scope.errors.push(error.toString());
                    $scope.$apply();
                    return;
                }
                //send to seocketF
                app.socket.emit('newCrawler', {sitemapUrl: sitemapUrl, offset: offset});
                //console.log(app);
            });
        };
    }
]);
var appFilters = angular.module('app.filters', []);
var appServices = angular.module('app.services', []);
