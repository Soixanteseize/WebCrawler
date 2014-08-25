var util = require('util');
var debug = require('debug')('crawler');
var EventEmitter = require('events').EventEmitter;
var async = require('async');
var request = require('request');
var http = require('http');
var UrlCrawler = function(urls, limit) {
    var me = this;
    this.limitSync = limit;
    http.globalAgent.maxSockets = this.limitSync;

    this.executedCount = 0;
    this.errorCount = 0;
    this.remainingCount = urls.length;
    this.startDate = null;

    this.calculPercent = function() {
        var percent = parseFloat((me.executedCount + me.errorCount) * 100 / urls.length);
        return percent.toFixed(2);
    };
    this.fetch = function() {

        this.startDate = new Date();
        this.remainingCount = urls.length;
        //async.eachLimit(urls, me.limitSync, me.fetchUrl, function(err, errorProcess, url) {
        debug('Fetching ' + this.remainingCount + ' files, grouped by ' + this.limitSync);

        /*var q = async.queue(this.fetchUrl, this.limitSync);
         urls.forEach(function(url) {
         q.push(url);
         });*/
        async.mapLimit(urls, me.limitSync, me.fetchUrl, function(err, errorProcess, url) {
            if (err) {
                console.log(err);
            }
            if (me.executedCount + me.errorCount === urls.length) {
                debug('End Job');
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
                remainingCount: me.remainingCount,
                startTime: me.startTime
            };
            if (!error && response.statusCode !== 200) {
                me.errorCount++;
                var error = url + ' can\'t be fetched code: ' + response.statusCode;
                returnResponse.error = error;
                returnResponse.errorCount = me.errorCount;
                debug('Fetching error: ' + error);
                me.emit('error', returnResponse);
                cb(null, error);
            } else if (error) {
                me.errorCount++;
                returnResponse.errorCount = me.errorCount;
                returnResponse.error = error;
                debug('Fetching error: ' + error);
                me.emit('error', returnResponse);
                cb(error);
            } else {
                me.executedCount++;
                returnResponse.executedCount = me.executedCount;
                returnResponse.url = url;
                me.emit('success', returnResponse);
                debug('Fetching success: ' + url);
                cb(null, null, url);
            }
        });
    };
};
util.inherits(UrlCrawler, EventEmitter);
module.exports = UrlCrawler;