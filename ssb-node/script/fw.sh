#!/bin/ash
# Configure iptables to only accept related packets, no incoming connections allowed.
iptables -F
iptables -A INPUT -i lo -j ACCEPT
iptables -I INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -P OUTPUT ACCEPT
iptables -P INPUT DROP
iptables -L -vn
