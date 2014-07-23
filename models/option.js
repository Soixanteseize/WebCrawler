var mongoose = require('mongoose');
var Option = require('../config/schemas/option');
module.exports = mongoose.model('Option', Option);