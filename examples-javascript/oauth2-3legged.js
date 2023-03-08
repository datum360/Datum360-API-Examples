const passport = require('passport')
const OAuth2Strategy = require('passport-oauth2');
const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('./config.json');

const app = express();

app.use(passport.initialize())
app.use(passport.session())

//replace URLs with the URLs for your system, these can be found on the api docs page
//username and password required for clientID and clientSecret
//replace callbackURL with a URL to your application
//replace scopes with the servics you are trying to authenticate with
passport.use(new OAuth2Strategy({
    authorizationURL: config.authorizeUrl,
    tokenURL: config.tokenUrl,
    clientID: config.clientId,
    clientSecret: config.clientSecret,
    callbackURL: 'http://localhost:8000/',
    scope: [config.pimScope, config.clsScope]
},
    (accessToken, refreshToken, profile, cb) => {
        const decoded = jwt.decode(accessToken, {complete: true});

        return cb(null, decoded["payload"]["user"])
    }
))

passport.serializeUser((user, done) => {
    done(null, user)
  })
  passport.deserializeUser(async (user, done) => {
    done(null, user)
  })

app.get("/", passport.authenticate('oauth2', {failureRedirect: '/fail'}), (req, res) => {
    res.send("success")
})

app.get("/fail", (req, res) => {
    res.send("failure")
})




app.listen(8000, () => {
    console.log("app listenting");
})