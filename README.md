# ssb-laboratory

Laboratory environment for SSB. Using docker containers on a separate docker network to simulate multiple nodes
with different configuration profiles. 

## Setup

Clone this repo.

## Starting a lab SSB node

    ./ssb-node-start.sh <node_name>
    
This builds the container, sets up volumes and creates a docker network, then starts an instance with the given node name.

By default no incoming connections are allowed to the node. To enable incoming connections (for simulating a hub/portal) issue:

    source script/fw-hub.sh

Now enter the ssb-laboratory CLI:

    yarn start
    
Inside the CLI use,

    help
    
to find out which commands are available.
    
## References

- <https://scuttlebot.io/docs/config/configure-scuttlebot.html>
- <https://github.com/ssbc/ssb-server>

- <https://github.com/ssbc/ssb-client>
- <https://github.com/ssbc/scuttlebot-release>

- <https://github.com/ssbc/ssb-config>
- <https://github.com/ssbc/ssb-invite>
- <https://github.com/ssbc/ssb-tunnel>
- <https://github.com/dthree/vorpal/wiki>

# TODO

- [ ] Investigate why invites do not work, could be that the custom app-key is not applied.
