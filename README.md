# ssb-laboratory

Laboratory environment for SSB. Using docker containers on a separate docker network to simulate multiple nodes
with different configuration profiles. 

## Setup

Clone this repo.

## Starting a lab SSB node

First build the base container. This builds the node modules, which takes a little while. Good thing is that this build
of `node_modules` is available when a container is created which makes creation very quick. Note: If big changes are made 
to `package.json` it could be a time saver to rebuild the image again instead if updating using `yarn install` in each
container instance. 

    ./ssb-node.sh build

Now use the `start` command which sets up volumes and creates a docker network, then starts an instance with the given node name.

    ./ssb-node.sh start <node_name>

By default no incoming connections are allowed to the node. To enable incoming connections (for simulating a hub/portal) issue:

    source script/fw-hub.sh

Now enter the ssb-laboratory CLI:

    yarn start
    
Inside the CLI use,

    help
    
to find out which commands are available.
    
## Testing out ssb-tunnel

In this scenario we will start three nodes A, B and C, where B will act as a hub/portal letting A and C communicate
directly without any direct network contact between them.

Tip: Open three terminal windows and perform the steps in parallel for all three nodes.

Be careful to execute the steps in order, as globally numbered (for all ssb-node instances).

### Node A

#### Step 1

    ./ssb-node.sh start ssb-A.local
    yarn start 
    
#### Step 2
    
    # Connect to hub and establish tunnel (see Node B below for $PORTALADDRESS)
    serer-start --tunnel $PORTALADDRESS
    
#### Step 3

    # Find out A's ID so we can send a message from C
    inspect-id
    # Lets denote the ID as $ID_A

### Node B (hub/portal)

#### Step 1

    ./ssb-node.sh start ssb-B.local
    # Open network port for incoming connections, since B is a hub
    source script/fw-hub.sh
    yarn start

#### Step 2

    # Start the ssb-server in portal mode
    server-start --portal
    # Find the address to connect tunnels to from A and C
    inspect-address
    # Lets denote the address returned as $PORTALADDRESS

### Node C

#### Step 1

    ./ssb-node.sh start ssb-C.local
    yarn start

#### Step 3
    
    # Connect to hub and establish tunnel (see step 2 below for $PORTALADDRESS)
    server-start --tunnel $PORTALADDRESS     
    
#### Step 5

    # Get the $ID_A from step 4 above and then send a message from C to A
    chat-tell $ID_A "Hello this is C calling A!" 
    
    # Now the message should be printed in A's console. 
    # How about trying to send a message back from A to C?
    
## References

- <https://scuttlebot.io/docs/config/configure-scuttlebot.html>
- <https://github.com/ssbc/ssb-server>

- <https://github.com/ssbc/ssb-client>
- <https://github.com/ssbc/scuttlebot-release>

- <https://github.com/ssbc/ssb-config>
- <https://github.com/ssbc/ssb-invite>
- <https://github.com/ssbc/ssb-tunnel>
- <https://github.com/dthree/vorpal/wiki>

# Known issues

- [ ] Invites do not work, could be that the custom app-key is not applied. See issue <https://github.com/ssbc/ssb-invite/issues/1>.
- [ ] Stopping and restarting the server causes IO error to be thrown by `levelup` since locks on db files are not properly released when server is stopped.

