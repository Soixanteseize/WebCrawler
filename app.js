
/**
 * This is an Express app instance, extended by express rapido
 * @type ExpressRapido
 */
var debug = require('debug')('app');
var app = require('./config/expressRapido.js')();
var request = require('request');

//boot the app
app.boot();

//socket
var http = require('http');
var server = app.listen(app.get('port'), function() {
    debug('Express server listening on port ' + server.address().port);
});
app.io = require('socket.io')(server);


//crawler
app.io.on('connection', function(socket) {
    socket.on('newCrawler', function(data) {
        var sitemapUrl = data.sitemapUrl;
        var offset = data.offset;
        request(sitemapUrl, function(error, response, body) {
            if (!error && response.statusCode === 200) {
                var parseString = require('xml2js').parseString;
                parseString(body, function(err, result) {
                    if (err) {
                        socket.emit('errorCrawler', {error: err});
                        console.log(err);
                        return;
                    }
                    if (!result.urlset.url) {
                        var err = new Error('The file seems to not be a valid xml sitemap');
                        socket.emit('errorCrawler', {error: err});
                        console.log(err);
                        return;
                    }
                    //crawl each url
                    var count = result.urlset.url.length - offset;
                    var urls = result.urlset.url.slice(offset, count);
                    socket.emit('startCrawler', {count: count});
                    var crawler = new UrlCrawler(urls, socket);
                    return crawler.crawl();
                });
            } else {
                console.log(error);
                socket.emit('errorCrawler', {error: error});
            }
        });
    });
});
var UrlCrawler = function(urls, socket) {
    var me = this;
    this.crawl = function() {
        var async = require('async');
        async.eachSeries(urls, me.fetchUrl, function(err, errorProcess, url) {
            if (err) {
                console.log(err);
            }
        });
    };

    this.fetchUrl = function(location, cb) {
        var url = location.loc[0];
        request(url, function(error, response, body) {
            if (!error && response.statusCode !== 200) {
                var error = url + ' can\'t be fetched code: ' + response.statusCode;
                cb(null, error);
                console.log(error);
                socket.emit('errorFileCrawler', {error: error});
            } else if (error) {
                console.log(error);
                cb(null, error.toString());
                socket.emit('errorFileCrawler', {error: error.toString()});
            } else {
                console.log(url);
                cb(null, null, url);
                socket.emit('successFileCrawler', {url: url});
            }
        });
    };
};


//register some models
app.registerModel('User', 'user');
app.registerModel('Option', 'option');

//register some controllers
app.registerController('request');
app.registerController('security');
app.registerController('home');
app.registerController('error404');
app.registerController('error');

//register some route
app.registerRouteConfig('', app.getController('request'));
app.registerRouteConfig('/security', app.getController('security').router);
app.registerRouteConfig('/', app.getController('home').router);
app.registerRouteConfig('', app.getController('error404').router);
app.registerRouteConfig('', app.getController('error'));

module.exports = app;