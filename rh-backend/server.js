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

// R oute de callback LinkedIn (version avec sauvegarde automatique)
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
    // Échanger le code contre un token d'accès
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
      
      // Récupérer les infos utilisateur
      const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      const userInfo = await userInfoResponse.json();
      
      // Page HTML qui sauvegarde automatiquement le token
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentification LinkedIn réussie</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .card {
              background: white;
              border-radius: 20px;
              padding: 40px;
              max-width: 500px;
              text-align: center;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .success-icon {
              width: 80px;
              height: 80px;
              background: #10b981;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              font-size: 40px;
              color: white;
            }
            h1 { color: #1f2937; margin-bottom: 10px; }
            p { color: #6b7280; margin-bottom: 20px; }
            .token-info {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 10px;
              margin: 20px 0;
              font-size: 12px;
              word-break: break-all;
              color: #374151;
            }
            .loader {
              border: 3px solid #f3f3f3;
              border-top: 3px solid #0A66C2;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            button {
              background: #0A66C2;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 24px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              margin-top: 20px;
            }
            button:hover {
              background: #004182;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="success-icon">✓</div>
            <h1>✅ Authentification réussie !</h1>
            <p>Bonjour <strong>${userInfo.name || userInfo.email}</strong></p>
            <p>Sauvegarde automatique du token en cours...</p>
            <div class="loader"></div>
            <div class="token-info" style="display: none;" id="tokenInfo">
              Token sauvegardé avec succès !
            </div>
            <button id="continueBtn" style="display: none;">🏠 Retour à l'application</button>
          </div>
          
          <script>
            // Sauvegarder automatiquement le token
            const token = "${data.access_token}";
            localStorage.setItem('linkedin_token', token);
            console.log('✅ Token LinkedIn sauvegardé dans localStorage');
            
            // Attendre 2 secondes et rediriger
            setTimeout(() => {
              document.querySelector('.loader').style.display = 'none';
              document.getElementById('tokenInfo').style.display = 'block';
              document.getElementById('continueBtn').style.display = 'inline-block';
            }, 2000);
            
            document.getElementById('continueBtn').onclick = () => {
              window.location.href = 'http://localhost:5173/dashboard?linkedin_connected=true';
            };
            
            // Si l'utilisateur ne clique pas, rediriger après 5 secondes
            setTimeout(() => {
              window.location.href = 'http://localhost:5173/dashboard?linkedin_connected=true';
            }, 5000);
          </script>
        </body>
        </html>
      `);
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