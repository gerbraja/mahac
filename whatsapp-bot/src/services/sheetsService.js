import { getGoogleSheetsClient } from '../config/googleSheets.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Lee todas las citas registradas en la hoja de cálculo
 */
export async function getAppointments() {
  const sheets = getGoogleSheetsClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheets || !sheetId) {
    console.warn('⚠️ Google Sheets no está completamente configurado.');
    return [];
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Citas!A2:E' // Asume que la pestaña se llama 'Citas' y las columnas son: Nombre, Teléfono, Fecha, Hora, Notas
    });
    
    return response.data.values || [];
  } catch (error) {
    console.error('❌ Error al leer citas de Google Sheets:', error.message);
    return [];
  }
}

/**
 * Registra una nueva cita en la hoja de cálculo
 */
export async function addAppointment(name, phone, date, time, notes = '') {
  const sheets = getGoogleSheetsClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheets || !sheetId) {
    console.error('❌ Google Sheets no está completamente configurado para guardar la cita.');
    return false;
  }

  try {
    // Si la hoja 'Citas' no existe, o para asegurar que se agreguen al final:
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Citas!A2',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[name, phone, date, time, notes, new Date().toLocaleString()]]
      }
    });

    console.log(`📝 Cita registrada en Google Sheets para ${name} el ${date} a las ${time}`);
    return true;
  } catch (error) {
    console.error('❌ Error al agregar cita a Google Sheets:', error.message);
    return false;
  }
}
