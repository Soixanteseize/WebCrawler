var mongoose = require('mongoose');
var Option = mongoose.Schema({
    name: {
        unique: true,
        type: String,
        index: true
    },
    value: Array
});
module.exports = Option;