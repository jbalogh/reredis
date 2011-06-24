var net = require('net'),
    sys = require('sys');


// The server that listens for redis connections.
var server = net.createServer(function(stream) {

    // The redis backend we're proxying.
    var redis = net.createConnection(6379, 'localhost');
    redis.on('connect', function(){
        sys.puts('+ connected to redis');
    });
    redis.on('data', function(data) {
        sys.puts('# data: ');
        sys.puts(data);
        stream.write(data);
    });
    redis.on('error', function(e) {
        sys.puts('- redis error');
        sys.puts(e);
    });

    stream.on('connect', function() {
        sys.puts('+ connection');
    });
    stream.on('data', function(data) {
        sys.puts('* data: ');
        sys.puts(data);
        redis.write(data);
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
server.listen(6380, 'localhost');
server.on('error', function(e) {
    sys.puts('server error: ' + e);
});

sys.puts('proxying localhost:6380 => localhost:6379');
