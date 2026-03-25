import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import recruitmentRoutes from './routes/recruitment.js';
import recruitmentRequestsRouter from './routes/recruitmentRequests.js';
import validationRequestsRouter from './routes/validationRequests.js';
import jobOffersRouter from './routes/jobOffers.js';

dotenv.config();

const app = express();

// Configuration CORS explicite
app.use(cors({
  origin: 'http://localhost:5173', // L'URL de votre frontend
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/recruitmentRequests', recruitmentRequestsRouter);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/validationRequests', validationRequestsRouter);
app.use('/api/job-offers', jobOffersRouter);

// Route de test pour vérifier que le serveur fonctionne
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔐 JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Défini' : '❌ Non défini'}`);
});