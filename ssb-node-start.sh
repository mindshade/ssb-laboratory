#!/usr/bin/env bash

if [[ $# -eq 0 ]]; then
    echo "Syntax ${0} <node_name> [command]"
    exit
fi

if [[ "$2" != "" ]]; then
    EPOINT="--entrypoint $2"
fi

DOCKER_NETWORK=ssb-laboratory
DOCKER_IMAGE=ssb-node

HOST_NAME=$1

docker build -t ssb-node -f ssb-node/ssb-node.docker ${DOCKER_IMAGE}

docker volume create ssb-lab-node_modules
docker volume create ssb-lab-yarn_cache

docker network inspect ssb-laboratory &>/dev/null || docker network create --driver bridge ssb-laboratory

docker run --rm -it \
    --net=${DOCKER_NETWORK} \
    --cap-add=NET_ADMIN \
    --hostname=${HOST_NAME} \
    --name=${HOST_NAME} \
    --mount type=volume,src=ssb-lab-node_modules,dst=/root/ssb-node/node_modules \
    --mount type=volume,src=ssb-lab-yarn_cache,dst=/yarn_cache \
    --mount type=bind,source="$(pwd)"/ssb-node/src,target=/root/ssb-node/src \
    --mount type=bind,source="$(pwd)"/ssb-node/package.json,target=/root/ssb-node/package.json \
    --mount type=bind,source="$(pwd)"/ssb-node/yarn.lock,target=/root/ssb-node/yarn.lock \
    --mount type=bind,source="$(pwd)"/ssb-node/script,target=/root/ssb-node/script \
    ${EPOINT} \
    ${DOCKER_IMAGE}

