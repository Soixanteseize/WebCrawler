var mongoose = require('mongoose');
var User = require('../config/schemas/user');
module.exports = mongoose.model('User', User);