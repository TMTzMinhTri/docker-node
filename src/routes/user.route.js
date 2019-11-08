const express = require('express');
const router = express.Router()
const {
  validationResult
} = require('express-validator');
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');

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


router.post('/register', async (req, res) => {
  const { email, password, name, shopName } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()
    })
  }

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
      res.json({
        data: {
          status: true
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
router.post("/email", (req, res) => {
  const {
    email
  } = req.body
  try {
    sendMails(email, "Minh Tri").then(value => {
      console.log(value)
      res.json({
        status: true
      })
    }).catch(e => {
      console.log(e)
      res.send(e)
    })
  } catch (error) {
    console.error(error.message);
    res.status(500).send("server error")
  }
})

router.post('/signin', checkValidFormData(null, "email", "password"), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      data: null,
      error: errors.array(),
      success: false
    })
  }

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

module.exports = router
