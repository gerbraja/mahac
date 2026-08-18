import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_VERSION = 'v20.0';

/**
 * Envía un payload genérico a la API de WhatsApp Cloud
 */
export async function sendWhatsAppPayload(to, payload) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.error('❌ Error: Falta configurar WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID');
    return null;
  }

  const url = `https://graph.facebook.com/${API_VERSION}/${phoneId}/messages`;

  try {
    const response = await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        ...payload
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Error al enviar petición a WhatsApp API:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Envía un mensaje de texto simple
 */
export async function sendTextMessage(to, text) {
  console.log(`📤 Enviando mensaje de texto a ${to}...`);
  return sendWhatsAppPayload(to, {
    type: 'text',
    text: { body: text }
  });
}

/**
 * Envía un mensaje de imagen (postal, comprobante, etc.)
 */
export async function sendImageMessage(to, imageUrl, caption = '') {
  console.log(`📤 Enviando imagen a ${to}. URL: ${imageUrl}`);
  return sendWhatsAppPayload(to, {
    type: 'image',
    image: {
      link: imageUrl,
      caption: caption
    }
  });
}

/**
 * Envía un mensaje basado en plantilla (Requerido para iniciar conversaciones fuera de la ventana de 24h)
 */
export async function sendTemplateMessage(to, templateName, languageCode = 'es', components = []) {
  console.log(`📤 Enviando plantilla '${templateName}' a ${to}...`);
  return sendWhatsAppPayload(to, {
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: components
    }
  });
}
