var request = require('request');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var UrlCrawler = require('./urlCrawler.js');
var CrawlerFactory = function() {
    this.create = function(data) {
    	this.data = data;
        var startTime = new Date();
        var me = this;
        this.offset = data.offset;
        if(this.data.mysql){
        	var host = data.host;
        	var mysql      = require('mysql');
			var connection = mysql.createConnection(this.data.mysqlOptions);
			connection.connect();
			connection.query('SELECT request_path as path FROM enterprise_url_rewrite where store_id=1', function(err, rows, fields) {
			  		if (err) {
                        me.emit('error', {error: err});
                        return;
                    }
                    var urls = [];
					rows.forEach(function(row){
						var url = host + '/' + row.path;
						urls.push(url);
					});
					urls = urls.slice(me.offset, urls.length);
					var count = urls.length;
					console.log('Crawling ' + count + ' urls');
					var crawler = new UrlCrawler(urls, 5);
					me.emit('create', {percent: crawler.calculPercent(), crawler: crawler, startTime: startTime});
			});
			connection.end();
        }else{
        	this.sitemapUrl = data.sitemapUrl;

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
						urls.forEach(function(row){
							var url = row.loc[0];
							urls.push(url);
							console.log('add url' + url);
						});
						var count = urls.length;
						var crawler = new UrlCrawler(urls, 20);
						me.emit('create', {percent: crawler.calculPercent(), crawler: crawler, startTime: startTime});
						return;
					});
				} else {
					me.emit('errorCrawler', {error: error});
				}
			});
        }
        return this;
    };
};
util.inherits(CrawlerFactory, EventEmitter);
module.exports = CrawlerFactory;