var net = require('net'),
    sys = require('sys');

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

    // The redis backend we're proxying.
    var connections = config.redis.map(function(r) {
        var redis = net.createConnection(r.port, r.host);
        redis.on('connect', function(){
            sys.puts('+ connected to redis');
        });
        redis.on('data', function(data) {
            sys.puts('# data: ');
            sys.puts(data);
            if (shouldWrite) {
                stream.write(data);
                shouldWrite = false;
            }
        });
        redis.on('error', function(e) {
            sys.puts('- redis error');
            sys.puts(e);
        });
        return redis;
    });

    stream.on('connect', function() {
        sys.puts('+ connection');
    });
    stream.on('data', function(data) {
        sys.puts('* data: ');
        shouldWrite = true;
        sys.puts(data);
        connections.forEach(function(c) {
            c.write(data);
        });
    });
    stream.on('end', function() {
        sys.puts('- end');
        stream.end();
    });
    stream.on('error', function(e) {
        sys.puts('- stream error');
        sys.puts(e);
    });
});
server.listen(config.port, config.host)
server.on('error', function(e) {
    sys.puts('server error: ' + e);
});

sys.puts('proxying ' + config.host + ':' + config.port +
         ' => ' + JSON.stringify(config.redis));
