const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const Strategy = require('passport-twitter').Strategy;
const session = require('cookie-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true, });
const routes = require('./routes');
const app = express();

passport.use(new Strategy({
    consumerKey: process.env.CONSUMER_KEY,
    consumerSecret: process.env.CONSUMER_SECRET,
    userAuthorizationURL: 'https://api.twitter.com/oauth/authenticate?force_login=true',
    callbackURL: 'https://jt-twitter-interface.herokuapp.com/login/twitter/return'
    }, (token, tokenSecret, profile, cb) => {
        return cb(null, {token, tokenSecret});
    })
);

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((obj, cb) => {
    cb(null, obj);
});

app.use(compression());
app.use(helmet());
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session);
app.use('/static', express.static('public'));

app.set('view engine', 'pug');

app.use(passport.initialize());
app.use(passport.session());

app.use(routes);

app.use((err, req, res, next) => {
    res.render('error', { message: err.message });
});

app.listen(process.env.PORT || 3000, () => console.log('The application is running on localhost:3000.'));