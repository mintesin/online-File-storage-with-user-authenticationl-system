require('dotenv').config();
const { application } = require('express');
const parser = require('body-parser')
const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const passport = require('passport')
const mongodb = require('mongodb')
const fs = require('fs')
const passportLocalMongoose = require('passport-local-mongoose');
const { array } = require('mongoose/lib/utils');
const multer = require('multer');
const url = process.env.URI_ONE
var user;

const app = express()
app.use(parser.urlencoded({
    extended: true
}))
app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'))
//SESSION
app.use(session({

    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}))
//INITIALIZING PASSPORT 
app.use(passport.initialize())
app.use(passport.session())

//DB connection
mongoose.connect(url);

// var gfs = Grid(mongoose.connect(url), mongodb)


const userSchema = new mongoose.Schema({
    username: String,
    firstName: String,
    lastName: String,
    files: []

})

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model('User', userSchema)

passport.use(User.createStrategy())

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


// SETTING UP MULTER
// var upload = multer({ dest: './uploads' })
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }

})

var upload = multer({
    storage: storage,

})





app.get('/', function (req, res) {
    res.render('home')
})
app.get('/register', function (req, res) {
    res.render('register')
})
// REGISTRATION FO THE USER WITH IN THE DATABSE
app.post('/register', function (req, res) {
    const newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        files: []

    })

    User.register(newUser, req.body.password
        , function (err, user) {
            if (err) {
                console.log(err)
                console.log(req.body.username)
                res.redirect('/register')


            }
            else {
                res.redirect('/login')

            }
        })

})
app.get('/files', function (req, res) {

    res.render('dashboard', { fullname: user.firstName, files: user.files })
})
app.get('/login', function (req, res) {
    res.render('login')
})

// AUTHENTICATION AND AUTHORIZATION OF USER BASED ON HIS CREDENTIAL
app.post('/login', function (req, res) {
    const newUser = new User({
        username: req.body.username,
        password: req.body.password,

    })
    User.findOne({ username: newUser.username }, function (err, result) {
        if (err) { console.log(err) }
        else {
            user = result
        }
    })
    req.login(newUser, function (err) {
        if (err) { console.log(err) }
        else {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/files')
            })
        }
    })
})




app.get('/upload', function (req, res) {
    res.render('upload')
})
app.post('/upload', upload.single('file'), function (req, res, next) {

    const file = req.file.originalname

    User.updateOne({ username: user.username },
        { $addToSet: { files: file } }, function (err, docs) {
            if (err) { console.log(err) }
            else { console.log('yes') }
        }
    )

    User.findOne({ username: user.username }, function (err, docs) {
        if (err) { res.send("There is an error") }
        else {



            console.log(docs.files)
        }
    }
    )

})
app.get("/download/:name", function (req, res) {
    const file = './uploads/' + req.params.name
    console.log(file)
    res.download(file) // Set disposition and send it.
});
app.get('/logout', function (req, res, next) {
    req.logout(function (err) {
        if (err) { return next(err) }
    })
    res.redirect('/')
})





app.listen(process.env.PORT, () => {
    console.log("the server is running on port 3000")
})