const Twit = require('twit');
const moment = require('moment');
const decode = require('unescape');

let Twit_routes = class {
    constructor(args) {
        this.T = new Twit({
            consumer_key: args.consumer_key,
            consumer_secret: args.consumer_secret,
            access_token: args.access_token,
            access_token_secret: args.access_token_secret,
        });

        this.getAccountUser()
            .then(user => this.user = user)
            .catch(err => console.log(err));
    }

    async getData() {
        let data = {};
        try {
            data.account_user = await this.getAccountUser();
            data.friends = await this.getFriends();
            data.tweets = await this.getTweets();
            data.messages = await this.getMessages();
            console.log("getData() Successful");
            return Promise.resolve(data);
        } catch(err) {
            console.log("getData() Unsuccessful");
            return Promise.reject(err);
        }
    }

    getAccountUser() {
        return new Promise((resolve, reject) => {
            this.T.get('account/verify_credentials',(err,data,res) => {
                if (err) {
                    console.log("getAccountUser() Unsuccessful");
                    reject(err);
                } else {
                    let user = {};

                    user.id = data.id;
                    user.name = data.name;
                    user.screen_name = data.screen_name;
                    user.profile_img = data.profile_image_url_https;
                    user.profile_banner = data.profile_banner_url;
                    user.following = data.friends_count;
                    console.log("getAccountUser() Successful");
                    resolve(user);
                }
            });
        })
    }

    getUsers(ids) {
        return new Promise((resolve, reject) => {
            this.T.get('users/lookup',{ user_id: ids}, (err, data, res) => {
                if (err) {
                    reject(err);
                    console.log("getUsers() Unsuccessful");
                } else {
                    let users = [];

                    for (let user of data) {
                        let userInfo = {};

                        userInfo.id = user.id;
                        userInfo.name = user.name;
                        userInfo.profile_img = user.profile_image_url_https;

                        users.push(userInfo);
                    }
                    console.log("getUsers() Successful");
                    resolve(users);
                }// end else
                
            });
        });

    }

    getFriends() {
        return new Promise((resolve, reject) => {
            this.T.get('friends/list', { count: 5 }, (err, data, res) => {
                if (err) {
                    console.log("getFriends() Unsuccessful");
                    reject(err);
                } else {
                    let users = [];

                    for (let friend of data.users) {
                        let user = {};

                        user.id = friend.id;
                        user.profile_img = friend.profile_image_url_https;
                        user.name = friend.name;
                        user.screen_name = friend.screen_name;

                        users.push(user);
                    }
                    console.log("getFriends() Successful");
                    resolve(users);
                }// end else
            });
        });
    } 
    
    getTweets() {
        return new Promise((resolve, reject) => {
            this.T.get('statuses/home_timeline', { count: 5 }, (err, data, res) => {
                if (err) {
                    reject(err);
                    console.log("getTweets() Unsuccessful");
                } else {
                    let tweets = [];

                    for (let tweet of data) {
                        let tweetData = {};
                        let date = new Date(tweet.created_at);
                        tweetData.name = tweet.user.name;
                        tweetData.screen_name = tweet.user.screen_name;
                        tweetData.profile_img = tweet.user.profile_image_url_https;
                        tweetData.text = decode(tweet.text)
                        tweetData.favorite_count = tweet.favorite_count;
                        tweetData.retweet_count = tweet.retweet_count;
                        tweetData.date = this.formatDate(date);

                        tweets.push(tweetData);
                    }
                    console.log("getTweets() Successful");
                    resolve(tweets);
                }// end else
            });
        });
    }

    getMessages() {
        return new Promise((resolve, reject) => {
            this.T.get('direct_messages/events/list', (err, data, res) => {
                if (err) {
                    console.log("getMessages() Unsuccessful");
                    reject(err);
                } else {
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
                            console.log("getMessages() Successful");
                            resolve(conversations);
                        });
                } // end else
            });
        });
    }

    unfollow(id) {
        return new Promise((resolve, reject) => {
            this.T.post('friendships/destroy', {user_id: id}, (err, data, res) => {
                if (err) {
                    console.log("unfollow() Unsuccessful");
                    reject(err);
                } else {
                    console.log("unfollow() Successful");
                    resolve(`You've unfollowed ${data.name}.`);
                }
            });
        });
    }

    follow(id) {
        return new Promise((resolve, reject) => {
            this.T.post('friendships/create', { user_id: id }, (err, data, res) => {
                if (err) {
                    console.log("follow() Unsuccessful");
                    reject(err);
                } else {
                    console.log("follow() Successful");
                    resolve(`You've followed ${data.name}.`);
                }
            });
        });
    }

    postTweet(tweet) {
        return new Promise((resolve, reject) => {
            let tweetData = { user: this.user, tweet};
            this.T.post('statuses/update', { status: tweet }, (err, data, res) => {
                if (err) {
                    console.log("postTweet() Unsuccessful");
                    reject(err);
                } else {
                    console.log("postTweet() Successful");
                    resolve(tweetData);
                }
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