reredis is a socket proxy for making redis connections more redundant. It
listens for redis commands on one socket and duplicates the commands to many
redis servers.

It does not have an idea of master and slave connections. All commands are sent
to all servers every time.

Usage
-----

Set up your configuration file using the included config.js as a guide and then::

    node reredis.js yourConfig.js
