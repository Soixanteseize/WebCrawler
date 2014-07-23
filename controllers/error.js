var ErrorController = function(app) {


    return  function(err, req, res, next)
    {
        var status = err.status || 500;

        var fs = require('fs');
        var path = require('path');

        var template = 'error';
        var params = {
            message: err.message,
            error: err
        };


        //test template exists
        var templatePath = path.join(path.dirname(__dirname), 'views', 'error' + status + '.jade');

        if (fs.existsSync(templatePath)) {
            template = 'error' + status;
        }


        //display error complete only to dev
        if (req.app.get('env') !== 'development') {
            params.error = {};
        }
        err.status = status;
        res.statusCode = err.status;

        return res.render(template, params);
    };
};

module.exports = ErrorController;