const Product = require('../models/product')
const ErrorResponse = require('../util/ErrorResponse')
const { deleteFile } = require('../util/file')

const ITEMS_PER_PAGE = 1

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
  })
}

exports.postAddProduct = async (req, res, next) => {
  const title = req.body.title
  const image = req.file
  const price = req.body.price
  const description = req.body.description
  console.log(req.file)

  if (!image) {
    next(new ErrorResponse('File upload fail..'))
  }

  const imageUrl = image.path

  try {
    var product = await Product.create({
      title,
      imageUrl,
      price,
      description,
      userId: req.user,
    })
    product
      .save()
      .then((result) => {
        res.redirect('/products')
        console.log('product created!')
      })
      .catch()
  } catch (err) {
    next(new ErrorResponse('post product error', 500, 'Simple Error'))
  }
}

exports.getEditProduct = async (req, res, next) => {
  const editMode = req.query.edit
  if (!editMode) {
    return res.redirect('/')
  }
  const prodId = req.params.productId
  const product = await Product.findById(prodId)
  if (product) {
    try {
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
      })
    } catch (err) {
      console.log(err)
    }
  }
}

exports.postEditProduct = async (req, res, next) => {
  const prodId = req.body.productId
  const updatedTitle = req.body.title
  const updatedPrice = req.body.price
  const image = req.file
  const updatedDesc = req.body.description

  const product = await Product.findById(prodId)

  if (product) {
    try {
      product.title = updatedTitle
      product.price = updatedPrice
      //  If user uploads a new image in that case the product.imageUrl is updated else it remains the same...
      if (image) {
        const Oldimage = product.imageUrl //The old image of this product..
        deleteFile(Oldimage)
        product.imageUrl = image.path
      }
      product.description = updatedDesc
      product.save()
      console.log('product saved!')
    } catch (err) {
      console.log(err)
    } finally {
      res.redirect('/admin/products')
    }
  }
}

exports.getProducts = async (req, res, next) => {
  // const products = await Product.find()
  // Just tested these fetch techniques
  // .populate('userId').select('title -_id')

  // Applying Pagination Login..
  const page = +req.query.page || 1
  // console.log(page)

  const total_items = await Product.find().countDocuments()
  // console.log('Total items : ' + total_items)

  const products = await Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)

  if (products) {
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products',
      currentPage: page,
      hasNextPage: page * ITEMS_PER_PAGE < total_items,
      hasPreviousPage: page > 1,
      previousPage: page - 1,
      nextPage: page + 1,
      lastPage: Math.ceil(total_items / ITEMS_PER_PAGE),
    })
  } else {
    console.log('unable to fetch')
  }
}
exports.DeleteProduct = async (req, res, next) => {
  const prodId = req.params.productId
  try {
    await Product.findByIdAndDelete(prodId)
    console.log('product deleted!')
    res.status(200).json({
      message: 'Success!',
    })
  } catch (err) {
    res.status(500).json({
      message: 'Product Deletion Failed!',
    })
  }
}
