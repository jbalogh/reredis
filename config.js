exports.config = {
    // The host and port we listen on.
    host: 'localhost',
    port: 6380,

    // The host and ports for our redis connections.
    redis: [
        {host: 'localhost', port: 6379},
        {host: 'localhost', port: 6378},
    ],

    statsd: {
        host: 'localhost',
        port: 8125,
        prefix: ''
    }
}
