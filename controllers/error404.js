var Error404Controller = function(app) {
    var express = require('express');
    this.router = express.Router();

    //404 handler
    this.router.use(function(req, res, next) {
        var err = new Error("Page not Found");
        err.status = 404;
        next(err);
    });

    return this;
};

module.exports = Error404Controller;