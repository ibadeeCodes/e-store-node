const express = require('express')

const path = require('path')
const bodyParser = require('body-parser')
var colors = require('colors')
const nodemailer = require('nodemailer')
const session = require('express-session')
const dotenv = require('dotenv')
const flash = require('connect-flash')
const multer = require('multer')
// Load env vars
dotenv.config({ path: './config/config.env' })
const fs = require('fs')

// Event Emitter..
const EventEmitter = require('events')
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter()

const { errorHandler } = require('./util/ErrorHandler')

const errorController = require('./controllers/error')

const User = require('./models/user')

const app = express()
const connectDB = require('./util/db')
connectDB()

app.set('view engine', 'ejs')
app.set('views', 'views')

const adminRoutes = require('./routes/admin')
const shopRoutes = require('./routes/shop')
const auth = require('./routes/auth')

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname)
  },
})

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(multer({ storage: fileStorage, fileFilter }).single('image'))

app.use(express.static(path.join(__dirname, 'public')))
app.use('/images', express.static(path.join(__dirname, '/images')))

// const checkUser = async (req, res, next) => {
//   try {
//     const user = await User.findById('5e9348ff62f1e0438042c72e')
//     console.log(user)
//     console.log('hello world')
//     req.user = user
//     console.log(req)
//     next()
//   } catch (err) {
//     console.log(err)
//   }
// }
// // Running middleware!!
// checkUser()
app.use(
  session({
    secret: 'my secret key',
    resave: false,
    saveUninitialized: false,
  })
)
app.use(flash())

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error')
  next()
})

app.use((req, res, next) => {
  User.findById('5e9348ff62f1e0438042c72e')
    .then((user) => {
      req.user = user
      next()
    })
    .catch((err) => {
      console.log(err)
    })
})

app.use((req, res, next) => {
  myEmitter.on('error', () => {
    res.redirect('/500')
  })
  next()
})

app.get('/500', (req, res, next) => {
  res.render('500')
})

app.get('/errortest', (req, res, next) => {
  myEmitter.emit('error')
})

// app.use(async (req, res, next) => {
//   try {
//     const user = await User.findById('5e9348ff62f1e0438042c72e')
//     console.log(user)
//     console.log('hello world')
//     req.user = user
//     next()
//   } catch (err) {
//     console.log(err)
//   }
// })

app.use('/admin', adminRoutes)
app.use(shopRoutes)
app.use('/auth', auth)

app.use(errorHandler)

app.use(errorController.get404)

// Testing Some Streams...//

async function logChunks(readable) {
  for await (const chunk of readable) {
    console.log(chunk)
  }
}

const readable = fs.createReadStream(path.join('util', 'chunk.txt'), {
  encoding: 'utf-8',
})

logChunks(readable)

// Simple readfile method . It consoles the buffer..
// fs.readFile(path.join('util', 'chunk.txt'), (err, data) => {
//   if (err) {
//     console.log(err)
//   }
//   console.log(data)
// })

app.listen(3000, console.log('server started at port: 3000'))
