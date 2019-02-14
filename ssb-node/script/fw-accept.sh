#!/bin/ash

iptables -F
iptables -P OUTPUT ACCEPT
iptables -P INPUT ACCEPT

iptables -L -vn
