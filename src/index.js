const express = require('express')
const app = express()
const http = require('http').createServer(app);
const path = require('path')
const cors = require('cors');
app.use(cors());

const cookieParser = require('cookie-parser')
require('dotenv').config()
require('./services/database')()
// var io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'uploads')));
app.use(express.json())
app.use(cookieParser())
app.disable('x-powered-by')

// io.on('connection', function (socket) {
//   console.log('a user connected');
//   socket.on('change color', () => {
//     console.log('Color Changed to: ')
//   })
//   socket.on("aaa", (data) => {
//     console.log(socket.id + data)
//   })
//   socket.emit('bbb', "minhtri")
//   socket.on("disconnect", () => {
//     console.log(`${socket.id} ngat ket noi`)
//   })
// });

app.use("/api/user", require('./routes/user.route'))
app.use("/api/product", require('./routes/product.route'))
app.use("/auth", require('./routes/auth.route'))

// app.use(express.static(path.join(__dirname, 'client/build')));
app.get('*', function (req, res) {
//   res.sendFile(path.join(__dirname + '/client/build/index.html'));
res.send("heelo")
});
const port = process.env.PORT || 5000
http.listen(port, () => console.log(`Listening on port ${port}`))
