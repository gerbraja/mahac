import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

let sheetsInstance = null;

export function getGoogleSheetsClient() {
  if (sheetsInstance) {
    return sheetsInstance;
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  
  if (!email || !privateKey) {
    console.warn('⚠️ Advertencia: Credenciales de Google Service Account completas no configuradas.');
    return null;
  }

  try {
    // Formatear la clave privada en caso de saltos de línea codificados como texto '\n'
    const formattedKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.JWT(
      email,
      null,
      formattedKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    sheetsInstance = google.sheets({ version: 'v4', auth });
    console.log('💚 Google Sheets API inicializado con éxito');
    return sheetsInstance;
  } catch (error) {
    console.error('❌ Error al inicializar Google Sheets API:', error);
    return null;
  }
}
