#!/bin/bash

if [ -f running_pid ]; then
  kill $(cat running_pid)
fi

NODE_ENV=production nohup node index.js &
echo $! > running_pid
