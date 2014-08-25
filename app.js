
/**
 * This is an Express app instance, extended by express rapido
 * @type ExpressRapido
 */
var app = require('./config/expressRapido.js')().boot();
var server = app.listen(app.get('port'));
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var request = require('request');
var async = require('async');
app.io = require('socket.io')(server);

var UrlCrawler = function(urls) {
    var me = this;
    this.limitSync = 100;
    this.executedCount = 0;
    this.errorCount = 0;
    this.remainingCount = urls.length;
    this.calculPercent = function() {
        var percent = parseFloat((me.executedCount + me.errorCount) * 100 / urls.length);
        return percent.toFixed(2);
    };
    this.fetch = function() {
        async.eachLimit(urls, me.limitSync, me.fetchUrl, function(err, errorProcess, url) {
            if (err) {
                console.log(err);
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
        request(url, function(error, response, body) {
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
var CrawlerFactory = function() {

    /**
     * 
     * @param {Object} data
     * @returns {CrawlerFactory}
     */
    this.create = function(data) {
        var me = this;
        var sitemapUrl = data.sitemapUrl;
        var offset = data.offset;
        request(sitemapUrl, function(error, response, body) {
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
                    var urls = result.urlset.url.slice(offset, count);
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


//Init
var socketInstance = null;
var crawlerFactory = new CrawlerFactory();
crawlerFactory.on('error', function(data) {
    console.log(data.error);
});
crawlerFactory.on('create', function(data) {
    app.io.emit('startCrawler', {percent: data.percent});
    data.crawler.fetch();
    data.crawler.on('success', function(data) {
        console.log(data.url);
        app.io.emit('successFileCrawler', data);
    });
    data.crawler.on('error', function(data) {
        console.log(data);
        app.io.emit('errorFileCrawler', data);
    });
});

//crawler from socket
app.io.on('connection', function(socket) {
    socketInstance = socket;
    socket.on('newCrawler', function(data) {
        crawlerFactory.create(data);
    });
});


app.crawlerFactory = crawlerFactory;

var args = process.argv.slice(2);
//running from cli
var fromCli = args[0] || null;
if (fromCli === 'fromCli') {
    crawlerFactory.create({
        sitemapUrl: "http://kookai-pprod.soixanteseize-lab.com/sitemap.xml",
        offset: 0
    });
}
//register some models
//app.registerModel('User', 'user');
//app.registerModel('Option', 'option');

//register some controllers
app.registerController('request');
//app.registerController('security');
app.registerController('home');
app.registerController('error404');
app.registerController('error');

//register some route
app.registerRouteConfig('', app.getController('request'));
//app.registerRouteConfig('/security', app.getController('security').router);
app.registerRouteConfig('/', app.getController('home').router);
app.registerRouteConfig('', app.getController('error404').router);
app.registerRouteConfig('', app.getController('error'));

module.exports = app;