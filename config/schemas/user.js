var mongoose = require('mongoose');
var forms = require('forms');

var User = mongoose.Schema({
    email: {
        unique: true,
        type: String,
        index: true,
        forms: {
            all: {
                type: 'email',
                validators: [forms.validators.email()]
            }
        }
    },
    password: {
        type: String,
        index: true,
        forms: {
            all: {
                type: 'password'
                        //,validators: [forms.validators.pa()]
            }
        }
    }

}, {
    //versionKey: false
});
module.exports = User;