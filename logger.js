const { createLogger, transports, format } = require('winston');

const {
  combine,
  timestamp,
  printf,
} = format;

const myFormat = printf(info => `${info.timestamp}: [${info.level}] ${info.message}`);

const myTransports = [new transports.Console()];
if (process.env.NODE_ENV === 'production') {
  myTransports.push(new transports.File({ filename: '/var/log/discord-alpha-bot/current.log' }));
}

module.exports = createLogger({
  format: combine(
    timestamp(),
    myFormat,
  ),
  transports: myTransports,
});
