var SecurityController = function(app) {
    var express = require('express');
    var passport = require('passport');
    this.router = express.Router();

    /*
     * Login Check Path
     * reutrn the login form as view
     */
    this.router.post('/login', function(req, res, next) {
        passport.authenticate('local', function(err, user, info) {
            req.flash('email', req.body.email);

            if (err) {
                req.flash('errors', err);
                return res.redirect('/security/login');
            }
            if (!user) {
                req.flash('errors', info);
                return res.redirect('/security/login');
            }

            //login the user
            req.logIn(user, function(err) {
                if (err)
                    return next(err);
                res.redirect('/');
            });

        })(req, res, next);
    });

    /*
     * Login Path
     * reutrn the login form as view
     */
    this.router.get('/login', function(req, res) {
        var errors = req.flash('errors');
        var email = req.flash('email');
        return res.render('security/login', {
            title: 'Login',
            errors: errors,
            email: email
        });
    });

    /*
     * Logout Path
     */
    this.router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/security/login');
    });

    return this;
};

module.exports = SecurityController;