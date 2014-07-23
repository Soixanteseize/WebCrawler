var ExpressRadido = function() {
    require('colors');

    var bootLog = require('debug')('boot');
    bootLog('Booting Application');

    var log = require('debug')('app');
    var express = require('express');
    var app = express();

    this.use = function(key, usage) {
        app.use(key, usage);
    };

    /**
     * Boot the app
     * @returns {Express Object}
     */
    var me = this;
    app.boot = function() {
        //extend the app with rapido tools MVC
        me.extendApp();
        me.init();
        return app;
    };

    /**
     * Init the application, 
     * @returns {AppBoot}
     */
    this.init = function()
    {
        bootLog('Init');
        var mongoose = require('mongoose');
        var me = this;

        //init some middleware, maybe should be extended
        app.initAppSettings();

        //init db and rest
        this.initDb();
        this.initViews();
        this.i18nInit();

        //on db init, if success, init the rest, if not, see in error initDB callback
        mongoose.connection.on('open', function() {
            app.mongoose = mongoose;
            me.initSession();
            me.initSecurity();
            app.initRouteconfig();
        });

        return this;
    };


    /**
     * Connect to mongodb database using mongoose
     * Defalt connect to mongodb://localhost/[appDbName] on default mongodb port
     * @returns {AppBoot}
     */
    this.initDb = function()
    {
        var me = this;
        var mongoose = require('mongoose');
        var mongoUrl = 'mongodb://localhost/' + app.get('appDbName');
        bootLog('Init Database connection to :', mongoUrl);
        mongoose.connect(mongoUrl, function(err) {
            if (err) {
                bootLog('Can\'t connect to %s database', mongoUrl);
                bootLog('Init Route config Now, because mongodb callback will not be called', mongoUrl);
                me.initSession();
                me.initSecurity();
                app.initRouteconfig();
                return;
            }
        });
        return this;
    };

    /**
     * Init the session storage, and the mongo session storage
     * It will use the default database, and create a table called session by default
     * @returns {AppBoot}
     */
    this.initSession = function()
    {
        bootLog('Init Session');
        var session = require('./security/session')();
        var MongoStore = require('connect-mongo')(session);
        var store = null;
        if (app.mongoose) {
            store = new MongoStore({
                db: app.mongoose.connection.db
            });
        }

        this.use(session({
            cookie: {maxAge: 60000 * 60 * 24}, //1 day
            secret: app.get('sessionSecret'),
            store: store
        }));

        return this;
    };

    /**
     * Init the default passport local
     * @returns {undefined}
     */
    this.initSecurity = function()
    {
        bootLog('Init Security');
        var passportLocal = require('./security/local')(app);
        this.use(passportLocal.initialize());
        this.use(passportLocal.session());
    };

    /**
     * Init the views middle ware as static path
     * @returns {AppBoot}
     */
    this.initViews = function()
    {
        bootLog('Init views');
        var path = require('path');

        //support Twig and jade templating
        if (app.get('view engine') === 'twig') {
            app.set('views', path.join(path.dirname(__dirname), 'views/twig'));
        } else {
            app.set('views', path.join(path.dirname(__dirname), 'views/jade'));
        }

        //declare dir public as static content.
        this.use(express.static(path.join(path.dirname(__dirname), 'public')));

        return this;
    };

    /**
     * Init the i18n translate tools
     * @returns {undefined}
     */
    this.i18nInit = function()
    {
        bootLog('Setup i18n : %s', 'Ok');
        var i18n = require("i18n");
        i18n.configure({
            defaultLocale: 'en',
            locales: ['en'],
            directory: __dirname + '/locales',
            updateFiles: false
        });
        this.use(i18n.init);
    };

    /**
     * Extend the Express 4 application
     * @returns {AppBoot}
     */
    this.extendApp = function()
    {
        /**
         * Controllers
         */
        app.controllers = {};

        /**
         * Models
         */
        app.models = {};

        /**
         * Routes configuration
         */
        app.routesConfig = [];

        /**
         * Mongoose Object
         */
        app.mongoose = null;

        /**
         * Init application settings and middle ware
         * @returns {undefined}
         */
        app.initAppSettings = function()
        {
            var favicon = require('static-favicon');
            var logger = require('morgan');
            var cookieParser = require('cookie-parser');
            var bodyParser = require('body-parser');
            var flash = require('connect-flash');
            var limits = require('limits');

            this.use(favicon());
            this.use(logger('dev'));
            this.use(bodyParser.json());
            this.use(bodyParser.urlencoded());
            this.use(cookieParser());
            this.use(flash());
            this.use(limits('2Mo'));
            app.enable('trust proxy');

            var sessionSecret = process.env.npm_package_config_session_secret_key || 'session_secret_key';
            app.set('sessionSecret', sessionSecret);

            var appDbName = process.env.npm_package_config_app_db_name || 'application';
            app.set('appDbName', appDbName);

            var port = process.env.PORT || process.env.npm_package_config_port || null;
            app.set('port', port);

            var host = process.env.npm_package_config_host || null;
            app.set('host', host);

            app.set('view engine', 'jade');
        };

        /**
         * Register a Controller on the app
         * @param {String} key
         * @param {Express Router} controller
         * @returns {AppBoot.app}
         */
        app.registerController = function(key)
        {
            bootLog('Registering controller : %s', key);
            var Ctrl = require('../controllers/' + key);
            app.controllers[key] = new Ctrl(app);


            return app;
        };

        /**
         * Get a Controller
         * @param {String} key
         * @returns {AppBoot.app.controller}
         */
        app.getController = function(key)
        {
            return app.controllers[key];
        };

        /**
         * Register a Model on the app
         * @param {type} key
         * @param {type} model
         * @returns {AppBoot.app}
         */
        app.registerModel = function(key, model)
        {
            bootLog('Registering model : %s', key);
            app.models[key] = require('../models/' + model);
            return app;
        };

        /**
         * Register a Route on a Controller
         * @param {String} key
         * @returns {app.models|exportsmodule.exports.models}Get the model
         * @returns {AppBoot.app.model}
         */
        app.getModel = function(key)
        {
            return app.models[key];
        };

        /**
         * Register a Route on a Controller
         * @param {type} path
         * @param {type} controller
         * @returns {AppBoot.app}
         */
        app.registerRouteConfig = function(path, controller)
        {
            bootLog('Registering route : %s', path);
            app.routesConfig.push({
                path: path,
                controller: controller
            });
            return app;
        };

        /**
         * Register a Route on a Controller
         * @param {String} path
         * @returns {Object}
         */
        app.getRouteConfig = function(key)
        {
            return app.routesConfig[key];
        };

        /**
         * Init all middle ware
         * @returns {AppBoot.app}
         */
        app.initRouteconfig = function()
        {
            for (var key in app.routesConfig) {
                var route = app.getRouteConfig(key);
                bootLog('Listen for Route : %s', route.path);
                this.use(route.path, route.controller);
            }
            return app;
        };

        /**
         * Set an option, store it in Database
         * @param {String} name
         * @param {String|Mixed} value
         * @returns {Object}
         */
        app.setOption = function(name, value) {
            var done = function(err, option) {
                if (err) {
                    log('Cannot save option in database cause: %s', err.message);
                    return false;
                }
                log('Option saved in database: %s', option.name);
            };
            return app.getModel('Option').findOneAndUpdate({name: name}, {name: name, value: value}, {upsert: true}, done);
        };

        return this;
    };
    return app;
};
module.exports = ExpressRadido;
