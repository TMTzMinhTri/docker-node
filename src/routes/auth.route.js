const express = require('express');
const router = express.Router()
const User = require('../models/user.modal')
const {
  checkValidRequest
} = require('../services/utils')
const axios = require('axios')
const qs = require('qs');


router.get('/callback', (req, res) => {
  const {
    signature,
    shop,
    timestamp
  } = req.query

  const scope = "read_products+write_products+read_orders+read_customers"
  const shopname = shop.split('.')[0]
  const redirect_uri = process.env.redirect_uri
  res.redirect(`https://${shopname}.myharavan.com/admin/oauth/authorize?client_id=${process.env.API_key}&scope=${scope}&redirect_uri=${redirect_uri}&response_type=code`)
})

router.get('/', checkValidRequest, async (req, res) => {
  const { id } = req.user
  console.log(req.query)
  const data = {
    client_id: process.env.API_key,
    client_secret: process.env.secret_key,
    code: req.query.code,
    grant_type: "authorization_code",
    redirect_uri: process.env.redirect_uri
  }
  const user = await User.findById({ _id: id })

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: qs.stringify(data),
    url: `https://${user.shopName}.myharavan.com/admin/oauth/access_token`,
  }
  axios(options).then(rsp => {
    const { access_token, refresh_token, token_type } = rsp.data
    User.findByIdAndUpdate({ _id: id }, { access_token: `${token_type} ${access_token}`, refresh_token }, (err, user) => {
      if (err) {
        res.json({
          data: null,
          error: {
            code: 400,
            message: "cannot save access_token"
          },
          success: false
        })
      }
      res.json({
        data: null,
        error: null,
        success: true
      })
    })
  }).catch(e => {
    res.json({
      data: null,
      error: {
        code: 400,
        message: e.response.data
      },
      success: false
    })
  })

})

module.exports = router
