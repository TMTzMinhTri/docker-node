const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avata: {
        type: String
    },
    shopName: {
        type: String,
        required: true
    },
    login_token: {
        type: String,
    },
    access_token: {
        type: String,
    },
    refresh_token: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },

});

module.exports = User = mongoose.model("user", UserSchema, "user")
