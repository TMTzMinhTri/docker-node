const bcrypt = require('bcryptjs')
const { check } = require('express-validator');
var jwt = require('jsonwebtoken');


module.exports = {
    hashpassword: (password) => {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt)
        return hash
    },
    comparePassword: (rawPassword, password) => {
        return bcrypt.compareSync(rawPassword, password)
    },
    checkValidFormData: (name, email, password) => {
        let arr = []
        if (name)
            arr.push(check(name, "name is required").exists())
        if (email)
            arr.push(check(email, "email is not valid").isEmail())
        if (password)
            arr.push(check(password).isLength({ min: 6 }).withMessage("must be at least 5 chars long"))
        return arr
    },
    checkValidRequest: (req, res, next) => {
        const token = req.header("login_token")
        if (!token) {
            return res.status(401).json({ errors: [{ msg: "no token, authorization denied" }] })
        }
        try {
            const decode = jwt.verify(token, process.env.JWTSECRETKEY);
            req.user = decode.user
            next();
        } catch (error) {
            return res.status(401).json({
                data: null,
                error: {
                    code: 401,
                    message: error.message
                },
                success: false
            }).end()
        }
    },
    createLoginToken: (user) => {
        const payload = {
            user: { id: user._id }
        }
        return jwt.sign(payload, process.env.JWTSECRETKEY, { expiresIn: 60 * 60 * 60 * 60 })
    }
}