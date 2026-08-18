import express from 'express';
import dotenv from 'dotenv';
import { verifyWebhook, handleWebhookEvent } from './controllers/webhookController.js';
import { initBirthdayCron } from './services/cronService.js';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;

// Ruta de diagnóstico básica
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Rutas de Webhook de WhatsApp
app.get('/webhook', verifyWebhook);
app.post('/webhook', handleWebhookEvent);

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Servidor Webhook de WhatsApp corriendo en el puerto ${PORT}`);
  console.log(`📡 URL Webhook: http://localhost:${PORT}/webhook`);
  console.log(`=================================================`);

  // Inicializar cron jobs
  initBirthdayCron();
});
