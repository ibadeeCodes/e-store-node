const fs = require('fs')

exports.deleteFile = (filepath) => {
  fs.unlink(filepath, (err) => {
    if (err) {
      throw new Error('File not deleted')
    }
    console.log('Old image deleted!')
  })
}
