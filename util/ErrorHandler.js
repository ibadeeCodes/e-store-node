exports.errorHandler = (err, req, res, next) => {
  if (err.name === 'MongoError') {
    console.log('Mongo Error occured..')
    console.log(err.name)
  } else {
    console.log('simple error occured..')
    console.log(err.statusCode)
    console.log(err.message)
    console.log(err.name)
  }

  res.status(err.statusCode).redirect('/500')
}
