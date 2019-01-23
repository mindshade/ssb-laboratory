#!/bin/ash
iptables -A INPUT -p tcp -m tcp --dport 9876 -j ACCEPT
