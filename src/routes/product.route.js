const express = require('express');
const router = express.Router()
const axios = require('axios')
const User = require('../models/user.modal')
const {
  checkValidRequest
} = require('../services/utils')


router.get('/', checkValidRequest, async (req, res) => {
  const { id } = req.user
  const user = await User.findById({ _id: id })
  const path = `https://${user.shopName}.myharavan.com/admin/products.json`
  axios.get(path, {
    method: "GET",
    headers: {
      Authorization: user.access_token
    }
  }).then(rsp => {
    const data = rsp.data
    const datasrp = data.products.map(item => {
      return {
        id: item.id,
        handle: item.handle,
        created_at: item.created_at,
        images: item.images,
        title: item.title,
        vendor: item.vendor,
        variants: item.variants.map(variant => {
          return {
            id: variant.id,
            price: variant.price,
            product_id: variant.product_id,
            title: variant.title
          }
        })
      }
    })
    res.json({
      data: datasrp,
      error: null,
      success: true
    })
  })
})

module.exports = router