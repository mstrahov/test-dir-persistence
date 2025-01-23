#!/bin/bash
#python3 -m http.server
xfce4-terminal -e "python3 -m http.server" --initial-title="running ${PWD##*/}"
