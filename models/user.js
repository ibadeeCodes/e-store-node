const mongoose = require('mongoose')
const crypto = require('crypto')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    required: true,
  },
  cart: {
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
  resetPasswordToken: { type: String },
  resetPasswordExpiry: { type: Date },
})

UserSchema.methods.addToCart = function (product) {
  // It will return the index if the condition is satisfied else it returns -1
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString()
  })
  let newQuantity = 1
  const updatedCartItems = [...this.cart.items]

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1
    updatedCartItems[cartProductIndex].quantity = newQuantity
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
    })
  }
  const updatedCart = {
    items: updatedCartItems,
  }
  this.cart = updatedCart
  return this.save()
}

UserSchema.methods.RemoveFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter((item) => {
    return item.productId.toString() !== productId.toString()
  })

  this.cart.items = updatedCartItems
  return this.save()
}

UserSchema.methods.EmptyCart = function () {
  this.cart = { items: [] }
  return this.save()
}

UserSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex')

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  this.resetPasswordExpiry = Date.now() + 10 * 60 * 1000

  return resetToken
}

// UserSchema.static.getCart = function () {
//   const cart = [...this.cart.items]
//   return cart
// }

module.exports = mongoose.model('User', UserSchema)
