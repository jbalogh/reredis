exports.config = {
    // The host and port we listen on.
    host: 'localhost',
    port: 6380,

    // Should we wait for the redis server(s) to reply or return early?
    waitForReply: true,

    // The host and ports for our redis connections.
    redis: [
        {host: 'localhost', port: 6379},
        {host: 'localhost', port: 6378},
    ],
}
