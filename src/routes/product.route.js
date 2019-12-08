const express = require('express');
const router = express.Router()
const axios = require('axios')
const User = require('../models/user.modal')
const {
  checkValidRequest
} = require('../services/utils')
const cloudinary = require('../services/cloudinary.config')
const upload = require('../services/multer.config')

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


router.get('/orders', checkValidRequest, async (req, res) => {
  const { id } = req.user
  const user = await User.findById({ _id: id })
  console.log(user)
  const path = `https://${user.shopName}.myharavan.com/admin/orders.json`
  axios.get(path, {
    method: "GET",
    headers: {
      Authorization: user.access_token
    }
  }).then(rsp => {
    const orders = rsp.data.orders.map(item => {
      return {
        billing_address: {
          country: item.billing_address.country,
          name: item.billing_address.name,
          phone: item.billing_address.phone,
          province: item.billing_address.province,
          district: item.billing_address.district,
          ward: item.billing_address.ward,
          address1: item.billing_address.address1,
          address2: item.billing_address.address2
        },
        customer: {
          email: item.customer.email,
          orders_count: item.customer.orders_count,
          total_spent: item.customer.total_spent,
          updated_at: item.customer.updated_at,
          birthday: item.customer.birthday,
          gender: item.customer.gender,
          note: item.customer.note
        },
        gateway: item.gateway,
        line_items: item.line_items.map(product => {
          return {
            price: product.price,
            product_id: product.product_id,
            image: product.image,
            name: product.name,
            vendor: product.vendor,
            title: product.title,
            grams: product.grams
          }
        })

      }
    })
    res.json({
      data: orders,
      success: true,
      error: null
    })
  })
})

router.post('/', checkValidRequest, upload.single('image'), async (req, res) => {
  req.body.image = req.file.path
  const { id } = req.user
  const { title, product_type, vendor, variants } = req.body
  try {
    let imageUrl = await cloudinary.uploader.upload(req.body.image, {
      tags: 'images_haravan_product'
    })
    const user = await User.findById({ _id: id })
    const path = `https://${user.shopName}.myharavan.com/admin/products.json`

    axios.post(path, JSON.stringify({
      product: {
        title,
        vendor,
        product_type,
        variants,
        images: [{
          src: imageUrl.secure_url
        }]
      }
    }), {
      headers: {
        'Content-Type': "application/json",
        "Authorization": user.access_token
      }
    }).then(rsp => {
      const data = rsp.data, { product } = data

      res.json({
        data: {
          id: product.id,
          handle: product.handle,
          created_at: product.created_at,
          images: product.images,
          vendor: product.vendor,
          title: product.title,
          variants: product.variants.map(item => {
            return {
              id: item.id,
              price: product.price,
              product_id: product.product_id,
              title: product.title
            }
          })
        },
        error: null,
        success: true
      })
    }).catch(e => res.send(e.message))
  } catch (error) {
    return res.status(500).send(error.message)
  }

})

module.exports = router