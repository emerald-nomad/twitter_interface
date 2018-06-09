const express = require('express');
const router = express.Router();
const passport = require('passport');
const twit = require('./twit.js');
let Twit_routes;

router.get('/', (req, res) => {
    if (req.user) {
        res.redirect('/home');
    } else {
        res.redirect('/login');
    }
})

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/login/twitter', passport.authenticate('twitter'));

router.get('/login/twitter/return', 
    passport.authenticate('twitter', { failureRedirect: '/login' }),
    (req, res) => {
        Twit_routes = new twit({
            consumer_key: process.env.CONSUMER_KEY,
            consumer_secret: process.env.CONSUMER_SECRET,
            access_token: req.user.token,
            access_token_secret: req.user.tokenSecret,
        });
        console.log("/login/twitter/return",req.user);
        res.redirect('/home');
    }
);

router.get('/logout', (req, res) => {
    console.log("/logout", req.user);
    req.logOut();
    res.redirect('/login');
});

router.get('/home', (req, res, next) => {
    Twit_routes.getData()
        .then(data => {
            res.render('app', data)
        })
        .catch(err => next(err));
});

router.post('/ajax_follow', (req, res) => {
    let id = req.body.id;
    Twit_routes.follow(id).then(message => res.send(message));
});

router.post('/ajax_unfollow', (req, res) => {
    let id = req.body.id;
    Twit_routes.unfollow(id).then(message => res.send(message));
});

router.post('/ajax_tweet', (req, res) => {
    let tweet = req.body.tweet;
    
    Twit_routes.postTweet(tweet).then(data => res.send(data));
});

module.exports = router;