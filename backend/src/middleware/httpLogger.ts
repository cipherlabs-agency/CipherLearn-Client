import morgan from 'morgan';
import logger from '../utils/logger';

const stream = {
    write: (message: string) => logger.http(message.trim()),
};

const httpLogger = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    {
        stream,
        // In production, only log errors (4xx/5xx) — skip noisy 2xx request logs
        skip: (_req, res) => process.env.NODE_ENV === 'production' && res.statusCode < 400,
    }
);

export default httpLogger;
