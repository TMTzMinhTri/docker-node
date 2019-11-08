const nodemailer = require('nodemailer')
const hbs = require('nodemailer-express-handlebars')

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "tmtzminhtri@gmail.com",
        pass: "Tranminhtri456"
    }
})
transporter.use('compile', hbs({
    viewEngine: {
        extName: '.hbs',
        partialsDir: './services/email-template/',
        layoutsDir: './services/email-template/',
        defaultLayout: 'index.handlebars',
    },
    viewPath: './services/email-template/',
}));

module.exports = function (email, name) {
    let mailOptions = {
        from: "tmtzminhtri@gmail.com",
        to: email,
        template: "index",
        context: {
            name: name
        }
    }
    return transporter.sendMail(mailOptions)
}