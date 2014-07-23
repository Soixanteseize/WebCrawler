var LocalPassport = function(app) {
    var LocalStrategy = require('passport-local').Strategy;
    var passport = require('passport');

    passport.serializeUser(function(user, next) {
        next(null, user._id);
    });

    passport.deserializeUser(function(id, next) {
        app.getModel('User').findOne({_id: id}, function(err, user) {
            next(err, user);
        });
    });

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, function(email, password, next) {
        var userReq = {email: email, password: password};
        app.getModel('User').findOne(userReq, function(err, user) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return next(null, false, {message: 'User not found', email: email});
            }
            return next(null, user);
        });
    }));
    return passport;
};
module.exports = LocalPassport;