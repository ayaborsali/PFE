import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import recruitmentRoutes from './routes/recruitment.js';
import recruitmentRequestsRouter from './routes/recruitmentRequests.js';
import validationRequestsRouter from './routes/validationRequests.js';
import jobOffersRouter from './routes/jobOffers.js';
import linkedinRoutes from './routes/linkedin.js'; // 👈 AJOUTE CETTE LIGNE

dotenv.config();

const app = express();

// Configuration CORS explicite
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes existantes
app.use('/api/auth', authRoutes);
app.use('/api/recruitmentRequests', recruitmentRequestsRouter);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/validationRequests', validationRequestsRouter);
app.use('/api/job-offers', jobOffersRouter);
app.use('/api', linkedinRoutes); // 👈 AJOUTE CETTE LIGNE

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Route d'authentification LinkedIn
app.get('/auth/linkedin', (req, res) => {
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI)}&scope=openid%20profile%20email%20w_member_social`;
  res.redirect(authUrl);
});

// Route de callback LinkedIn - Version avec token dans l'URL
app.get('/auth/linkedin/callback', async (req, res) => {
  const { code, error } = req.query;
  
  console.log('📥 Callback LinkedIn reçu!');
  console.log('Code:', code ? code.substring(0, 50) + '...' : 'Aucun');
  console.log('Error:', error || 'Aucune');
  
  if (error) {
    console.error('❌ Erreur:', error);
    return res.redirect('http://localhost:5173/dashboard?linkedin_error=true');
  }
  
  if (!code) {
    return res.redirect('http://localhost:5173/dashboard?linkedin_error=no_code');
  }
  
  try {
    const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET
    });
    
    console.log('🔄 Échange du code contre un token...');
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });
    
    const data = await response.json();
    
    if (data.access_token) {
      console.log('✅ Token obtenu avec succès!');
      
      // ⭐ REDIRECTION AVEC LE TOKEN DANS L'URL ⭐
      const redirectUrl = `http://localhost:5173/dashboard?linkedin_connected=true&token=${encodeURIComponent(data.access_token)}`;
      
      console.log('🔄 Redirection vers:', redirectUrl);
      console.log('🔑 Token envoyé au frontend');
      
      res.redirect(redirectUrl);
      
    } else {
      console.error('❌ Erreur token:', data);
      res.redirect('http://localhost:5173/dashboard?linkedin_error=token_failed');
    }
  } catch (err) {
    console.error('❌ Erreur:', err);
    res.redirect('http://localhost:5173/dashboard?linkedin_error=' + err.message);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 LinkedIn Auth: http://localhost:${PORT}/auth/linkedin`);
});