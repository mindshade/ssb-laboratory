#!/usr/bin/env bash

if [[ $# -eq 0 ]]; then
    echo "Syntax:"
    echo "${0} build"
    echo "${0} start <node_name> [command]"
    exit
fi

DOCKER_IMAGE=ssb-node

if [[ "$1" == "build" ]]; then
    docker build -t ssb-node -f ssb-node/ssb-node.docker ${DOCKER_IMAGE}
fi

if [[ "$1" == "start" ]]; then
    DOCKER_NETWORK=ssb-laboratory
    HOST_NAME=$2
    if [[ "$3" != "" ]]; then
        EPOINT="--entrypoint $3"
    fi
    docker volume create ssb-lab-node_modules
    docker volume create ssb-lab-cache
    docker network inspect ssb-laboratory &>/dev/null || docker network create --driver bridge ssb-laboratory
    docker run --rm -it \
        --net=${DOCKER_NETWORK} \
        --cap-add=NET_ADMIN \
        --hostname=${HOST_NAME} \
        --name=${HOST_NAME} \
        --mount type=volume,src=ssb-lab-cache,dst=/cache \
        --mount type=bind,source="$(pwd)"/ssb-node/src,target=/root/ssb-node/src \
        --mount type=bind,source="$(pwd)"/ssb-node/package.json,target=/root/ssb-node/package.json \
        --mount type=bind,source="$(pwd)"/ssb-node/yarn.lock,target=/root/ssb-node/yarn.lock \
        --mount type=bind,source="$(pwd)"/ssb-node/script,target=/root/ssb-node/script \
        ${EPOINT} \
        ${DOCKER_IMAGE}
fi



