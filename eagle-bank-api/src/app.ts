// Express app config
import express from 'express';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import accountRoutes from './routes/account.routes';

const app = express();

app.use(express.json());
app.use('/v1/users', userRoutes);
app.use('/v1/auth', authRoutes);
app.use('/v1/accounts', accountRoutes);

export default app;
