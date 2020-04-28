const sendEmail = require('../util/sendEmail')
const User = require('../models/user')
const { validationResult } = require('express-validator')
const ErrorResponse = require('../util/ErrorResponse')

exports.forgotPassword = async (req, res, next) => {
  const { email, password, password2 } = req.body
  console.log(email)
  console.log(password)
  console.log(password2)
  const errors = validationResult(req)
  const displayErr = []

  if (!errors.isEmpty()) {
    errors.array().forEach(function (err) {
      displayErr.push(err.msg)
    })
    console.log(displayErr)

    displayErr.forEach((err) => {
      req.flash('error_msg', err)
    })
    res.render('auth/resetPage', {
      options: { email, password, password2 },
    })
    // res.redirect('/auth/forgotPassword')
  }
  const user = await User.findOne({ email: req.body.email })

  if (!user) {
    console.log('There is no user with this email...')
  }

  // const ResetToken = user.getResetPasswordToken()

  // const resetUrl = `${req.protocol}://${req.get(
  //   'host'
  // )}/auth/v1/resetPassword/${ResetToken}`

  // const message = `PLease go through this link to reset Password : ${resetUrl}`

  // try {
  //   sendEmail({
  //     email: req.body.email,
  //     subject: 'Password Reset',
  //     message,
  //   })
  //   console.log('Email Sent!')
  // } catch (err) {
  //   console.log(err)
  // }
}

exports.pageRender = (req, res, next) => {
  res.render('auth/resetPage', {
    options: { email: '', password: '', password2: '' },
  })
}

exports.test = async (req, res, next) => {
  try {
    await User.create({
      _id: '5e9348ff62f1e0438042c72e',
      name: 'test',
      email: 'test@yahoo.com',
    })

    // throw new Error('Some Error Occured')
  } catch (err) {
    next(new ErrorResponse('hello', 500, 'MongoError'))
  }
}
