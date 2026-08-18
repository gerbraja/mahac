import dotenv from 'dotenv';
import { processUserMessage } from '../services/geminiService.js';
import { sendTextMessage } from '../services/whatsappService.js';

dotenv.config();

/**
 * GET /webhook
 * Verificación del webhook requerida por Meta (WhatsApp Business)
 */
export function verifyWebhook(req, res) {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook verificado con éxito por Meta');
      return res.status(200).send(challenge);
    } else {
      console.warn('⚠️ Webhook de verificación fallido: Token no coincide');
      return res.sendStatus(403);
    }
  }
  
  return res.sendStatus(400);
}

/**
 * POST /webhook
 * Recibe eventos de mensajes enviados por los usuarios
 */
export async function handleWebhookEvent(req, res) {
  const body = req.body;

  // Confirmar de inmediato la recepción del webhook a Meta (evita reenvíos)
  res.status(200).send('EVENT_RECEIVED');

  if (!body.object || body.object !== 'whatsapp_business_account') {
    return;
  }

  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return; // No es un mensaje (puede ser una actualización de estado de entrega)
    }

    const message = messages[0];
    const fromPhone = message.from; // Número de teléfono del remitente (ej: 573001234567)
    
    // Solo procesamos mensajes de tipo texto por ahora
    if (message.type !== 'text') {
      console.log(`ℹ️ Mensaje de tipo '${message.type}' recibido de ${fromPhone}. Ignorado.`);
      await sendTextMessage(fromPhone, "Por ahora solo puedo entender mensajes de texto. Si deseas agendar una cita o tienes dudas sobre comisiones y productos, escríbeme en texto por favor.");
      return;
    }

    const userMessage = message.text.body;
    console.log(`📥 Mensaje recibido de ${fromPhone}: "${userMessage}"`);

    // Procesar con Gemini y base de datos/sheets
    const botResponse = await processUserMessage(fromPhone, userMessage);
    
    // Responder al usuario vía WhatsApp
    await sendTextMessage(fromPhone, botResponse);

  } catch (error) {
    console.error('❌ Error al procesar evento del Webhook de WhatsApp:', error);
  }
}
