var util = require('util');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var request = require('request');
var http = require('http');
var UrlCrawler = function(urls) {
    var me = this;
    this.limitSync = 20;
    this.executedCount = 0;
    this.errorCount = 0;
    this.remainingCount = urls.length;

    this.calculPercent = function() {
        var percent = parseFloat((me.executedCount + me.errorCount) * 100 / urls.length);
        return percent.toFixed(2);
    };
    this.fetch = function() {
        http.globalAgent.maxSockets = this.limitSync;
        //async.eachLimit(urls, me.limitSync, me.fetchUrl, function(err, errorProcess, url) {
        async.mapLimit(urls, me.limitSync, me.fetchUrl, function(err, errorProcess, url) {
            if (err) {
                console.log(err);
            }
            if (me.executedCount + me.errorCount === urls.length) {
                me.emit('end');
            }
        });
    };
    this.fetchUrl = function(location, cb) {
        var url = location.loc[0];
        if (url.indexOf('e-boutique') >= 0) {
            var error = url + ' is an e-boutique => do not fetch';
            cb(null, error);
            return;
        }
        request.get(url, function(error, response, body) {
            me.remainingCount--;
            var returnResponse = {
                percent: me.calculPercent(),
                errorCount: me.errorCount,
                executedCount: me.executedCount,
                remainingCount: me.remainingCount
            };
            if (!error && response.statusCode !== 200) {
                me.errorCount++;
                var error = url + ' can\'t be fetched code: ' + response.statusCode;
                returnResponse.error = error;
                returnResponse.errorCount = me.errorCount;
                me.emit('error', returnResponse);
                cb(null, error);
            } else if (error) {
                me.errorCount++;
                returnResponse.errorCount = me.errorCount;
                returnResponse.error = error;
                me.emit('error', returnResponse);
                cb(error);
            } else {
                me.executedCount++;
                returnResponse.executedCount = me.executedCount;
                returnResponse.url = url;
                me.emit('success', returnResponse);
                cb(null, null, url);
            }
        });
    };
};
util.inherits(UrlCrawler, EventEmitter);
module.exports = UrlCrawler;