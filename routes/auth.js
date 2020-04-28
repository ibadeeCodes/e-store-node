const path = require('path')
const { check, body } = require('express-validator')
const User = require('../models/user')

const express = require('express')

const { forgotPassword, pageRender, test } = require('../controllers/auth')

const router = express.Router()

router
  .route('/forgotPassword')
  .post(
    [
      check('email')
        .isEmail()
        .withMessage('Enter a valid email bruh!')
        .custom((values, { req }) => {
          return User.findOne({ email: req.body.email }).then((userDoc) => {
            if (userDoc) {
              return Promise.reject('Email already exists')
            }
          })
        }),
      body('password', 'password must be 5 characters long').isLength({
        min: 5,
      }),
      body('password2').custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords didnt matched!')
        }
        return true
      }),
    ],
    forgotPassword
  )
  .get(pageRender)

router.route('/test').get(test)

module.exports = router
