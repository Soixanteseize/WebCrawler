Express Rapido
=========

Express rapido is a little bootstrap to start nodejs applications in MVC.
It uses a number of open source projects to work properly:

* [node.js]
* [Express] - fast node.js network app framework [@tjholowaychuk]
* [Mongoose] - mongodb database mapping
* [jade] - node js templating

Learn more in the package.json present in this repository.

Installation
--------------

```sh
git clone git@github.com:Soixanteseize/express-rapido.git myApp
cd myApp
npm install
```

Start
--------------
```sh
npm start
```
OR
```sh
node ./bin/www
```

Then go to http://localhost:3001 to see your app in action

Debuging
--------------
when you start app, you can define DEBUG level
```sh
DEBUG="boot,app" npm start
```

Coding
--------------
This tool is a simple layer that pre-configure an Express instance.
Since Express 4 was released, you must load some middleware using npm or using your own one. (like express-session)
Everything is done in the **app.js** and **/config/expressRapido.js** file.


### Adding controllers ###
To add controllers, you have to register them in the **/app.js** file.
```javascript
app.registerController('home');
```
Then you must attach a route to the controllers
```javascript
app.registerRouteConfig('/myhomeurl', app.getController('home')(app).router);
```

### Adding models ###
To add models, you have to register them in the **/app.js** file.
```javascript
app.registerModel('Option', 'option');
```

Warnings
--------------
This app use **mongoose (mongodb)** as storage engine. **Session storage** is configured to work with it.
If you disable or do not use mongodb, the session storage will be instance of MemoryStore.

[node.js]:http://nodejs.org
[jQuery]:http://jquery.com
[Mongoose]:http://mongoosejs.com/
[express]:http://expressjs.com
[jade]:http://jade-lang.com/
