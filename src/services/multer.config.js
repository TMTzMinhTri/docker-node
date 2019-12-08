const multer = require('multer')
const upload = multer({ dest: 'uploads/', limits: { fieldSize: 25 * 1024 * 1024 } })
var storage = multer.memoryStorage()

module.exports = upload