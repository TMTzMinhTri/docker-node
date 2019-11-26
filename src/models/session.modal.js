const mongoose = require('mongoose')

const SessionSchema = new mongoose.Schema({
    session_id: {
        type: String
    },
    verify_code: {
        type: String

    }
});

module.exports = Session = mongoose.model("session", SessionSchema, "session")
