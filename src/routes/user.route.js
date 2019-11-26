const express = require('express');
const router = express.Router()
const {
  validationResult
} = require('express-validator');
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const randomstring = require('randomstring')

const cloudinary = require('../services/cloudinary.config')
const upload = require('../services/multer.config')
const sendMails = require('../services/sendmails.config')
const {
  hashpassword,
  checkValidFormData,
  checkValidRequest,
  comparePassword,
  createLoginToken
} = require('../services/utils')
const User = require('../models/user.modal')
const Session = require("../models/session.modal")


router.get('/session', async (req, res) => {
  const session_id = randomstring.generate(10)
  session = new Session({ session_id }, { _id: false })
  await session.save()
  res.json({
    data: {
      session_id
    },
    error: null,
    success: true
  })
})


router.post('/', async (req, res) => {
  const { name, email, password } = req.body

  try {
    const exist = await User.exists({ email })
    if (exist === true) {
      return res.status(400).json({
        data: null,
        error: {
          code: 400,
          message: "Email đã có người sử dụng",
        },
        success: false
      })
    }

    else {
      const session_id = randomstring.generate(10)
      user = new User({ name, password, session_id })
      await user.save()
      return res.status(200).json({
        data: {
          session_id
        },
        error: null,
        success: true
      })
    }

  } catch (error) {
    console.error(error.message)
    return res.status(500).send("server error")
  }
})

router.get('/access_email', async (req, res) => {
  const { email } = req.query
  try {
    const session_id = randomstring.generate(10)
    const number_code = randomstring.generate({
      charset: "alphanumeric",
      length: 6
    })
    session = new Session({ session_id, verify_code: number_code }, { _id: false })
    await session.save()
    sendMails(email, number_code).then(rsp => {
      res.json({
        success: true,
        data: {
          session_id
        },
        error: null
      })
    }).catch(e => res.json({
      success: false,
      data: null,
      error: e.message
    }))
  } catch (error) {
    return res.status(500).send("server error")
  }
})

router.get('/verify', async (req, res) => {
  const { verify_code, session_id } = req.query
  try {
    const session = await Session.findOne({ session_id })
    if (session.verify_code === verify_code) {
      res.json({
        success: true,
        data: null,
        error: null
      })
    } else {
      res.json({
        success: false,
        data: null,
        error: null
      })
    }
  } catch (error) {
    return res.status(500).send("server error")
  }
})
router.post('/register', async (req, res) => {
  const { email, password, name, shopName } = req.body;
  try {
    let user = await User.exists({ email })
    if (user === true)
      return res.status(400).json({
        data: null,
        error: {
          code: 400,
          message: "User already exists"
        },
        success: false
      })

    else {
      const avata = gravatar.url(email, { s: '100', r: 'x', d: 'retro' });
      const newpassword = hashpassword(password)

      user = new User({ name, email, password: newpassword, avata, shopName })
      await user.save();
      const token = createLoginToken(user)
      res.json({
        data: {
          token
        },
        error: null,
        success: true
      })
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("server error")
  }
})

router.get("/", checkValidRequest, async (req, res) => {
  let { id } = req.user
  try {
    let user = await User.findById({
      _id: id
    }).select("-password -_id")
    // res.json({ userInfo: user })
    res.redirect('http://google.com')

  } catch (error) {
    console.error(error.message);
    res.status(500).send("server error")
  }
})

router.post('/signin', async (req, res) => {
  try {
    let { email, password } = req.body
    let user = await User.findOne({ email })
    let isMatchPassword = user ? comparePassword(password, user.password) : null
    if (!user || isMatchPassword === false)
      return res.status(400).json({
        data: null,
        error: {
          code: 400,
          message: "Email or password wrong",
        },
        success: false
      })
    if (user.login_token) {
      try {
        jwt.verify(user.login_token, process.env.JWTSECRETKEY);
        res.json({
          data: {
            token: user.login_token,
            shopName: user.shopName,
            apiKey: process.env.API_key
          },
          error: null,
          success: true
        })

      } catch (error) {
        const token = createLoginToken(user)
        await User.findOneAndUpdate({ email }, { login_token: token })
        res.json({
          data: {
            token,
            shopName: user.shopName,
            apiKey: process.env.API_key
          },
          error: null,
          success: true
        })
      }

    }
    else {
      const token = createLoginToken(user)
      await User.findOneAndUpdate({ email }, { login_token: token })
      res.json({
        data: {
          token,
          shopName: user.shopName,
          apiKey: process.env.API_key
        },
        error: null,
        success: true
      })
    }

  } catch (error) {
    console.error(error.message);
    res.status(500).send("server error")
  }
})

router.delete('/signout', checkValidRequest, async (req, res) => {
  const { id } = req.user
  const { login_token } = await User.findById({ _id: id })

  jwt.verify(login_token, process.env.JWTSECRETKEY, function (err, decoded) {
    if (err) console.log(err)
    console.log(decoded)
  });


  // await User.findByIdAndUpdate({ _id: id }, { login_token: '' })
  // res.json({ success: true })
})


router.put('/avata', checkValidRequest, upload.single('avatar'), async (req, res) => {
  req.body.avata = req.file.path
  let currentUser = await User.findById({
    _id: req.user.id
  })
  let imageUrl = await cloudinary.uploader.upload(req.body.avata, {
    tags: 'basic_sample'
  })
  currentUser.avata = imageUrl.secure_url
  await currentUser.save()
  res.json({
    status: true
  })
})


router.get('/check-step', async (req, res) => {
  const { email } = req.query
  console.log(email)
  try {
    const user = await User.findOne({ email })
    res.json({
      success: true,
      error: null,
      data: {
        user
      }
    })
  } catch (error) {
    return res.status(500).send("server error")

  }
})

router.get('/updateStep', async (req, res) => {
  const { id } = req.query
  // const { code, shopName } = req.body
  console.log(id)
  try {
    const user = await User.findByIdAndUpdate({ _id: id }, {
      step: 2
    })
    console.log(user)
    res.json({
      success: true
    })

  } catch (error) {
    return res.status(500).send("server error")
  }
})

module.exports = router
