#!/bin/bash

if [ -f running_pid ]; then
  kill $(cat running_pid)
fi

NODE_ENV=production
node index.js >> /var/log/discord-alpha-bot/current.log 2>&1 &

echo $! > running_pid
