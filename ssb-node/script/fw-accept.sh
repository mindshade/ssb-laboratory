#!/bin/ash
# Reset iptables to accept all incoming connections.
iptables -F
iptables -P OUTPUT ACCEPT
iptables -P INPUT ACCEPT
iptables -L -vn
