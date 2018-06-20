import * as winston from 'winston';

const {combine, timestamp, printf} = winston.format;

const logger = winston.createLogger({
    format: combine(
        timestamp(),
        printf((info) => {
            return `${info.timestamp} [${info.level.toUpperCase().padEnd(5)}] ${info.message}`;
        }),
    ),
    level: 'debug',
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: 'log/console.log', level: 'silly'}),
    ],
});

export default logger;