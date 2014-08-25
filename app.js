
/**
 * This is an Express app instance, extended by express rapido
 * @type ExpressRapido
 */

var app = require('./config/expressRapido.js')().boot();
var server = app.listen(app.get('port'));
app.io = require('socket.io')(server);

//Global crawler
var socketInstance = null;
var CrawlerFactory = require('./lib/crawlerFactory.js');
var crawlerFactory = new CrawlerFactory();
crawlerFactory.on('error', function(data) {
    console.log(data.error);
});

crawlerFactory.on('create', function(data) {
    var crawler = data.crawler;
    app.io.emit('startCrawler', {percent: data.percent});
    crawler.fetch();
    crawler.on('success', function(data) {
        console.log(data.url);
        app.io.emit('successFileCrawler', data);
    });
    crawler.on('error', function(data) {
        console.log(data);
        app.io.emit('errorFileCrawler', data);
    });
    crawler.on('end', function(data) {
        //reset stats data
        crawler.executedCount = 0;
        crawler.errorCount = 0;
        crawler.remainingCount = 0;
        crawler.fetch();
        app.io.emit('startCrawler', {percent: 0});
    });
});

//crawler from socket
app.io.on('connection', function(socket) {
    socketInstance = socket;
    socket.on('newCrawler', function(data) {
        crawlerFactory.create(data);
    });
});

//crawler from cli
var args = process.argv.slice(2);
var fromCli = args[0] || null;
if (fromCli === 'fromCli') {
    crawlerFactory.create({
        sitemapUrl: "http://kookai-pprod.soixanteseize-lab.com/sitemap.xml",
        offset: 0
    });
}

app.registerController('request');
app.registerController('home');
app.registerController('error404');
app.registerController('error');
app.registerRouteConfig('', app.getController('request'));
app.registerRouteConfig('/', app.getController('home').router);
app.registerRouteConfig('', app.getController('error404').router);
app.registerRouteConfig('', app.getController('error'));

module.exports = app;