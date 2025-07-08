// Express app config
import express from 'express';
import userRoutes from './routes/user.routes';

const app = express();

app.use(express.json());
app.use('/v1/users', userRoutes);

export default app;
