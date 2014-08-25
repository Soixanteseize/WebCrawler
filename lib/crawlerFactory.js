var request = require('request');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var UrlCrawler = require('./urlCrawler.js');
var CrawlerFactory = function() {
    this.create = function(data) {
        var me = this;
        this.sitemapUrl = data.sitemapUrl;
        this.offset = data.offset;
        request(me.sitemapUrl, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                var parseString = require('xml2js').parseString;
                parseString(body, function(err, result) {
                    if (err) {
                        me.emit('error', {error: err});
                        return;
                    }
                    if (!result.urlset.url) {
                        var err = new Error('The file seems to not be a valid xml sitemap');
                        me.emit('error', {error: err});
                        return;
                    }
                    var urls = result.urlset.url.slice(me.offset, count);
                    var count = urls.length;
                    var crawler = new UrlCrawler(urls);
                    me.emit('create', {percent: crawler.calculPercent(), crawler: crawler});
                    return;
                });
            } else {
                me.emit('errorCrawler', {error: error});
            }
        });
        return this;
    };
};
util.inherits(CrawlerFactory, EventEmitter);
module.exports = CrawlerFactory;