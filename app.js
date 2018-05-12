const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/static', express.static('public'));

app.set('view engine', 'pug');

app.listen(3000, () => console.log('The application is running on localhost:3000.'));