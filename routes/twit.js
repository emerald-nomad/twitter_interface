const Twit = require('twit');
const moment = require('moment');
const configs = require('../config.js');

let Twit_routes = class {
    constructor() {
        this.T = new Twit({
            consumer_key: configs.consumer_key,
            consumer_secret: configs.consumer_secret,
            access_token: configs.access_token,
            access_token_secret: configs.access_token_secret,
        });

        this.getAccountUser().then(data => {this.user = data});;
    }

    async getData() {
        let data = {};
        data.account_user = await this.user;
        data.friends = await this.getFriends();
        data.tweets = await this.getTweets();
        data.messages = await this.getMessages();
        
        return Promise.resolve(data);
    }

    getAccountUser() {
        return new Promise((resolve) => {
            this.T.get('account/verify_credentials',(err,data,res) => {
                let user = {};
                
                user.id = data.id;
                user.name = data.name;
                user.screen_name = data.screen_name;
                user.profile_img = data.profile_image_url_https;
                user.profile_banner = data.profile_banner_url;
                user.following = data.friends_count;
                resolve(user);
            });
        })
    }

    getUsers(ids) {
        return new Promise((resolve) => {
            this.T.get('users/lookup',{ user_id: ids}, (err, data, res) => {
                let users = [];

                for (let user of data) {
                    let userInfo = {};

                    userInfo.id = user.id;
                    userInfo.name = user.name;
                    userInfo.profile_img = user.profile_image_url_https;

                    users.push(userInfo);
                }

                resolve(users)
            });
        });

    }

    getFriends() {
        return new Promise((resolve) => {
            this.T.get('friends/list', { count: 5 }, (err, data, res) => {
                let users = [];
                if (err) {
                    console.log(` ERROR ${err.message}`);

                }

                for (let friend of data.users) {
                    let user = {};

                    user.id = friend.id;
                    user.profile_img = friend.profile_image_url_https;
                    user.name = friend.name;
                    user.screen_name = friend.screen_name;

                    users.push(user);
                }

                resolve(users);
            });
        });
    } 
    
    getTweets() {
        return new Promise((resolve) => {
            this.T.get('statuses/home_timeline', { count: 5 }, (err, data, res) => {
                if (err) {
                    console.log(err.message);

                }
                let tweets = [];  

                for (let tweet of data) {
                    let tweetData = {};
                    let date = new Date(tweet.created_at);
                    
                    tweetData.name = tweet.user.name;
                    tweetData.screen_name = tweet.user.screen_name;
                    tweetData.profile_img = tweet.user.profile_image_url_https;
                    tweetData.text = tweet.text;
                    tweetData.favorite_count = tweet.favorite_count;
                    tweetData.retweet_count = tweet.retweet_count;
                    tweetData.date = this.formatDate(date);

                    tweets.push(tweetData);
                }
                resolve(tweets);
            });
        });
    }

    getMessages() {
        return new Promise((resolve) => {
            this.T.get('direct_messages/events/list', (err, data, res) => {
                let users = new Set();
                let conversations = [];

                for (let message of data.events) {
                    let sender = message.message_create.sender_id;
                    let target = message.message_create.target.recipient_id;
                    
                    if (sender != this.user.id) {
                        users.add(sender);
                    } else if (target != this.user.id) {
                        users.add(target);
                    }
                }

                users.forEach(user => {
                    let messageData = {}
                    let conversation = [];
                    
                    for (let message of data.events) {
                        if (conversation.length >= 5) {
                            break;
                        }
                        let sender = message.message_create.sender_id;
                        let target = message.message_create.target.recipient_id;
                        
                        if (user === sender || user === target) {
                            let data = {}
                            let text = message.message_create.message_data.text;
                            let date = new Date(parseInt(message.created_timestamp));
                            this.formatDate(date);
                            data.text = text;
                            data.date = this.formatDate(date);
                            
                            if (user === sender) {
                                data.type = "recieved";
                            } else if (user === target) {
                                data.type = "sent";
                            }
                            
                            conversation.push(data);
                        }
                    }
                    
                    messageData.conversation = conversation.reverse();
                    conversations.push(messageData);
                });

                this.getUsers(Array.from(users))
                    .then(data => {
                        data.forEach((user, index) => {
                            conversations[index].user = user;
                        });
                        resolve(conversations);
                    });
            });
        });
    }

    postTweet(tweet) {
        return new Promise((resolve) => {
            let tweetData = { user: this.user, tweet};
            this.T.post('statuses/update', { status: tweet }, (err, data, res) => {
                resolve(tweetData);
            });
        });
    }

    formatDate(date) {
        let now = new Date();
        let diff = now - date;
        
        if (diff < 86400000) {
            return moment(date).fromNow();
        } else {
            return moment(date).format("MMM D");
        } 
    }
}

module.exports = Twit_routes;