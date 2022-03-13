
const keys = require('./keys')


// Express App Setup
// Define and setup the express side of the application


const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express(); // This receive and respond to http request coming and going to react application
app.use(cors()); // Wire cors 
app.use(bodyParser.json()); // Parse incoming request from react application and turn body of the post request to json value that express api can work with



// Postgres Client Setup
// Communicate with postgress db

const { Pool } = require('pg')  // Require the Pool module from pg library
const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});

// Create a table in pg
pgClient.on("connect", (client) => {
    client
      .query("CREATE TABLE IF NOT EXISTS values (number INT)")
      .catch((err) => console.error(err));
  });

// Redis client setup
const redis = require('redis');
const redisClient = redis.createClient({
        host: keys.redisHost,
        port: keys.redisPort,
        retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();


// Express route handler 
app.get('/',(req, res) => {
    res.send('Hi');
});

app.get('/values/all', async (req, res ) => {
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);   
});

app.get('/values/current', async (req, res) => {
    redisClient.hgetall('values',(err, values)=> {
        res.send(values);
    });
});


app.post('/values', async (req,res)=> {
    const index = req.body.index;

    if(parseInt(index)>40){
        return res.status(422).send('Index too high');
    }

    redisClient.hset('values',index, 'Nothing yet!');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values (number) VALUES($1)', [index]);
    res.send({ working: true});
});


app.listen(5000, err => {
    console.log('Listening')
});


