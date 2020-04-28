const mongoose = require('mongoose')
const User = require('../models/user')

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(
      'mongodb+srv://ibad:ibad@cluster0-uyliu.mongodb.net/test?retryWrites=true&w=majority',
      {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      }
    )
    console.log('MongoDB Connected Successfuly')
    User.findOne().then((user) => {
      if (user) {
        console.log('already there is a user')
      } else {
        User.create({
          name: 'Ibad',
          email: 'ibadee@gmail.com',
          cart: {
            items: [],
          },
        })
      }
    })

    // const user = await User
  } catch (err) {
    console.log(err)
  }
}

module.exports = connectDB
