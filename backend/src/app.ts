import express from 'express';
import cors from 'cors';
import routes from './routes';
import { errorHandler } from './utils/errors';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// API base path
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'devpulse-backend', timestamp: new Date().toISOString() });
});

// Centralized error handler
app.use(errorHandler);

export default app;
