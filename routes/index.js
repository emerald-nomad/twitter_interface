const express = require('express');
const router = express.Router();
const twit = require('./twit.js');
let Twit_routes = new twit;

router.get('/', (req,res) => {
    Twit_routes.getData().then(data => res.render('app',data));
});

router.post('/tweet', (req, res) => {
    let tweet = req.body.tweet;
    
    Twit_routes.postTweet(tweet).then(data => res.send(data));
});

module.exports = router;