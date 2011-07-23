var dgram = require('dgram'),
    net = require('net'),
    sys = require('sys');

var numConnections = 0,
    numConnectionFailures = 0;
    numFailures = 0,
    numCommands = 0;

// * read from one server
// * health checks
// * return early, watch pipelines

if (process.argv.length != 3) {
    sys.puts('Usage: node reredis.js CONFIG_FILE');
    process.exit();
}
var configFile = process.argv[2],
    prefix = configFile[0] == '/' ? '' : './',
    config = require(prefix + configFile).config;

// The server that listens for redis connections.
var server = net.createServer(function(stream) {

    // Should a redis response be written to the client?
    var shouldWrite;
    // Each redis connection gets a different number. Commands are sent to all
    // connected servers but we only want to relay the response from one.
    // The id derived from this counter lets us remember which one we're
    // talking to.
    var counter = 0;

    // The redis backend we're proxying.
    var connections = config.redis.map(function(r) {
        var redis = net.createConnection(r.port, r.host),
            id = ++counter;
        redis.on('connect', function(){
            numConnections++;
        });
        redis.on('data', function(data) {
            // If shouldWrite == true we just sent a command from the client
            // and are waiting for someone to respond. The first server to
            // respond overwrites shouldWrite with its connection id, so we
            // know to accept further writes from that connection.
            if (shouldWrite === true || shouldWrite === id) {
                try {
                    stream.write(data);
                    shouldWrite = id;
                } catch(e) {
                    numFailures++;
                }
            }
        });
        redis.on('error', function(e) {
            numConnectionFailures++;
        });
        return redis;
    });

    stream.on('data', function(data) {
        shouldWrite = true;
        numCommands++;
        connections.forEach(function(c) {
            try {
                c.write(data);
            } catch(e) {
                numFailures++;
            }
        });
    });
    stream.on('error', function() {
        sys.puts('client error');
    });
    stream.on('end', function() {
        stream.end();
    });
});
server.listen(config.port, config.host)

// Log to statsd every second.
if (config.statsd) {
    var statsd = dgram.createSocket('udp4');
    var send = function(key, value) {
        msg = key + ':' + value + '|c';
        if (statsd.prefix) {
            msg = statsd.prefix + '.' + msg;
        }
        statsd.send(msg, 0, msg.length, config.statsd.port, config.statsd.host);
    }
    setInterval(function(){
        send('redis.connections', numConnections);
        send('redis.connections.failures', numConnectionFailures);
        send('redis.failures', numFailures);
        send('redis.commands', numCommands);
        numConnectionFailures = numFailures = numCommands = 0;
    }, 1000);
}

sys.puts('proxying ' + config.host + ':' + config.port +
         ' => ' + JSON.stringify(config.redis));
