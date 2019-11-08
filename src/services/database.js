const mongoose = require('mongoose')


const connectDB = async () => {
    const mongodbURL = process.env.node_env === "production"
        ? process.env.mongodbURL
        : process.env.DB_DATABASE
    try {
        await mongoose.connect(mongodbURL, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        })
        console.log('connected database');
    } catch (err) {
        console.log(err.message)
        process.exit(1)
    }
}

module.exports = connectDB;
