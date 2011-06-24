var net = require('net'),
    sys = require('sys');

var serverStream;

// The redis backend we're proxying.
var redis = net.createConnection(6379, 'localhost');
redis.on('connect', function(){
    sys.puts('+ connected to redis');
});
redis.on('data', function(data) {
    sys.puts('# data: ');
    sys.puts(data);
    serverStream.write(data);
});
redis.on('error', function(e) {
    sys.puts('- redis error');
    sys.puts(e);
});

// The server that listens for redis connections.
var server = net.createServer(function(stream) {
    serverStream = stream;
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
});
server.listen(6380, 'localhost');
server.on('error', function(e) {
    sys.puts('server error: ' + e);
});

sys.puts('proxying localhost:6380 => localhost:6379');
