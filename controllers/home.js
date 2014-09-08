var HomeController = function(app) {
    var express = require('express');
    this.router = express.Router();

    //Listen for route /
    this.router.get('/', function(req, res) {
        //render the index.html.jade
        return res.render('index', {
            title: 'Web crawler'
        });
    });

    return this;
};

module.exports = HomeController;