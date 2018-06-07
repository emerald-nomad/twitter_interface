const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const app = express();

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/static', express.static('public'));

app.set('view engine', 'pug');

app.use(routes);

app.use((err, req, res, next) => {
    res.render('error', { message: err.message });
});

app.listen(3000, () => console.log('The application is running on localhost:3000.'));