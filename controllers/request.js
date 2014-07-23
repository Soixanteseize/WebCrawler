var RequestController = function(app) {
    return function(req, res, next)
    {
        //code here some middle ware to modify the requ or response
        return next();
    };
};

module.exports = RequestController;