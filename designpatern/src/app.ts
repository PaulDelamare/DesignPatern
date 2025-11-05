// ! IMPORTS
import express from 'express';
import configureMiddleware from '../config/apiConfigMiddleware.config';

// ! Routes Imports
import helloRoutes from './Routes/hello.routes';
import userRoutes from './Routes/user.routes';
import authRoutes from './Routes/auth.routes';


// ! Middleware
const app = express();

// Configure the safety middleware
configureMiddleware(app);


// ! Routes
// Use the routes
app.use('/api', helloRoutes);
app.use('/api', userRoutes);
app.use('/api', authRoutes);


// ! EXPORT
export { app };