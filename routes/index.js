const express = require('express');
const router = express.Router();
const twit = require('./twit.js');
let Twit_routes = new twit;

router.get('/', (req,res,next) => {
    Twit_routes.getData()
        .then(data => res.render('app',data))
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