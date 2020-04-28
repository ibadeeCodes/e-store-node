const Product = require(`../models/product`)
const Order = require('../models/order')
const path = require('path')
const fs = require('fs')
const ErrorResponse = require('../util/ErrorResponse')
const PDFDocument = require('pdfkit')
const stripe = require('stripe')('your stripe test key')

const ITEMS_PER_PAGE = 1

exports.getProducts = async (req, res, next) => {
  const page = +req.query.page || 1
  // console.log(page)

  const total_items = await Product.find().countDocuments()
  // console.log('Total items : ' + total_items)

  const products = await Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)

  if (products) {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products',
      currentPage: page,
      hasNextPage: page * ITEMS_PER_PAGE < total_items,
      hasPreviousPage: page > 1,
      previousPage: page - 1,
      nextPage: page + 1,
      lastPage: Math.ceil(total_items / ITEMS_PER_PAGE),
    })
  } else {
    console.log('not fetched!')
  }
}

exports.getProduct = async (req, res, next) => {
  try {
    const prodId = req.params.productId
    const product = await Product.findById(prodId)
    if (product) {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      })
    } else {
      console.log('not fetched!')
    }
  } catch (err) {
    console.log(err)
  }
}

exports.getIndex = (req, res, next) => {
  Product.findAll()
    .then((products) => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
      })
    })
    .catch((err) => console.log(err))
}

exports.getCart = (req, res, next) => {
  req.user
    // Used it to get complete product details with the help of => cart.items.productId
    // Thats why jab hum page render karengy to productId ke through product ka name etc with
    // quantity print karengy...
    .populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      let products = user.cart.items
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products,
      })
    })
    .catch((err) => console.log(err))
}

exports.postCart = async (req, res, next) => {
  const prodId = req.body.productId

  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product)
    })
    .then((result) => {
      res.redirect('/cart')
    })
    .catch((err) => console.log(err))
}

exports.postOrder = async (req, res, next) => {
  const token = req.body.stripeToken
  console.log('token: ' + token)

  let totalSum = 0
  req.user
    // Used it(cart.items.productId) to get complete product details with the help of it..
    // Thats why jab hum page render karengy to productId ke through product ka name etc with
    // quantity print karengy...
    .populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      user.cart.items.forEach((p) => {
        totalSum += p.quantity * p.productId.price
      })
      console.log(totalSum)

      let products = user.cart.items.map((i) => {
        // { ...i.productId._doc } without using  spread, it is still working correctly..
        // But deep and shallow ka concept samajh agaya jis ki waja se spread use karna zaroori ha..
        return { product: { ...i.productId._doc }, quantity: i.quantity }
      })
      const order = new Order({
        user: {
          name: req.user.name,
          userId: req.user,
        },
        products: products,
      })
      return order.save()
    })
    .then(async (result) => {
      const charge = await stripe.charges.create({
        amount: totalSum * 100,
        currency: 'usd',
        description: 'Demo Order',
        source: token,
        // Verify your integration in this guide by including this parameter
        metadata: { order_id: result._id.toString() },
      })
      return req.user.EmptyCart()
    })
    .then(() => {
      res.redirect('/orders')
    })
    .catch((err) => console.log(err))
}

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId
  req.user
    .RemoveFromCart(prodId)
    .then((result) => {
      res.redirect('/cart')
    })
    .catch((err) => console.log(err))
}

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .populate('products.product')
    .then((orders) => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      })
    })
    .catch((err) => console.log(err))
}

exports.getCheckout = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      let total = 0
      const products = user.cart.items
      products.forEach((prod) => {
        total += prod.quantity * prod.productId.price
      })
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total,
      })
    })
}

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId
  const invoiceName = 'invoice-' + orderId + '.pdf'
  const invoicePath = path.join('data', 'invoice', invoiceName)

  const pdfDoc = new PDFDocument()
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"')

  Order.findById(orderId)
    .then((order) => {
      let products = order.products

      pdfDoc.pipe(fs.createWriteStream(invoicePath))
      pdfDoc.pipe(res)

      pdfDoc.fontSize(24).text('Order Invoice', { underline: true })
      pdfDoc.text('__________________________________')
      pdfDoc.image(path.join('public', 'img', 'order_invoice.png'), 320, 15, {
        fit: [100, 100],
      })
      var totalPrice = 0
      products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price
        pdfDoc
          .fontSize(15)
          .text(
            prod.product.title +
              '-----------------' +
              prod.quantity +
              'x  $' +
              prod.product.price
          )
      })
      pdfDoc.text('__________________________________')
      pdfDoc.fontSize(22).text('Total: ' + '$' + totalPrice)
      pdfDoc.end()
    })
    .catch((err) => console.log(err))

  // fs.readFile(invoicePath, (err, data) => {
  //   if (err) {
  //     return next(new ErrorResponse('Error while downloading invoice'))
  //   }
  //   console.log('returned ran')
  //   res.setHeader('Content-Type', 'application/pdf')
  //   res.send(data)
  // })

  // const file = fs.createReadStream(invoicePath)
  // res.setHeader('Content-Type', 'application/pdf')
  // res.setHeader(
  //   'Content-Disposition',
  //   'attachment; filename="' + invoiceName + '"'
  // )
  // file.pipe(res)
}
