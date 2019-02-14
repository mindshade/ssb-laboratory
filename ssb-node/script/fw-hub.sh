#!/bin/ash
# Open up incoming TCP on port 9876 (which the laboratory is using for ssb-node communication)
iptables -A INPUT -p tcp -m tcp --dport 9876 -j ACCEPT
iptables -L -vn
