const keys = require('./keys');
const redis = require('redis');


const redisClient = redis.createClient({
    host: keys.redisHost,
    port: keys.redisPort,
    retry_strategy: () => 1000  // This will tell redis client, 
                                // if it ever looses connection to redis server, 
                                // attempt conenction after 1000 s
});

const sub = redisClient.duplicate();

const fib = (index) => {
    if (index < 2) return 1;
    return fib(index - 1) + fib( index - 2);
}

// function fib(index) { 
//     if (index < 2) return 1;
//     return fib(index - 1) + fib(index - 2);
// }


// Purposely using recursive so that we can use redis for the slowlessness
sub.on('message',(channel, message) => {
    redisClient.hset('values',message, fib(parseInt(message)));
    // When we receive a new value , calculate a new fib value and insert hash values, with key message, and value ie fib of the given value
});

sub.subscribe('insert'); //Any time someone inserts value in to redis, get that value and attempt to cal fib value and toss that into redis instance
