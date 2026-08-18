import cron from 'node-cron';
import { getDatabaseConnection } from '../config/db.js';
import { sendImageMessage } from './whatsappService.js';

// URL por defecto de la postal de felicitación (puedes cambiarla por una imagen real en tu hosting)
const BIRTHDAY_POSTCARD_URL = 'https://storage.googleapis.com/tuempresainternacional-frontend/banner_vestidos_bano.png'; // O la URL de tu postal

export function initBirthdayCron() {
  // Se ejecuta todos los días a las 8:00 AM (0 8 * * *)
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ [CRON] Buscando cumpleañeros de hoy...');
    
    try {
      const db = await getDatabaseConnection();
      
      // Obtener todos los usuarios con fecha de nacimiento registrada
      const users = await db.all('SELECT id, name, birth_date, phone FROM users WHERE birth_date IS NOT NULL AND phone IS NOT NULL');
      
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth() + 1; // getMonth() es 0-11
      
      let count = 0;

      for (const user of users) {
        // Formatos comunes: YYYY-MM-DD o DD/MM/YYYY
        let birthDay = null;
        let birthMonth = null;

        try {
          if (user.birth_date.includes('-')) {
            // YYYY-MM-DD
            const parts = user.birth_date.split('-');
            birthDay = parseInt(parts[2]);
            birthMonth = parseInt(parts[1]);
          } else if (user.birth_date.includes('/')) {
            // DD/MM/YYYY
            const parts = user.birth_date.split('/');
            birthDay = parseInt(parts[0]);
            birthMonth = parseInt(parts[1]);
          }
        } catch (e) {
          console.error(`[CRON] Error al parsear fecha '${user.birth_date}' para el usuario ${user.name}`);
          continue;
        }

        // Si el día y mes coinciden con hoy
        if (birthDay === currentDay && birthMonth === currentMonth) {
          count++;
          const formattedPhone = user.phone.trim();
          
          console.log(`🎉 [CRON] Cumpleaños detectado hoy: ${user.name} (${formattedPhone})`);
          
          const messageText = `¡Feliz cumpleaños, ${user.name}! 🎂🎈\n\nDe parte de todo el equipo de *Tu Empresa Internacional*, te deseamos un día extraordinario lleno de éxitos y bendiciones. ¡Gracias por ser parte de nuestra gran familia!`;
          
          // Enviar postal de cumpleaños por WhatsApp
          await sendImageMessage(formattedPhone, BIRTHDAY_POSTCARD_URL, messageText);
        }
      }
      
      console.log(`⏰ [CRON] Tarea finalizada. Se enviaron ${count} felicitaciones.`);
    } catch (error) {
      console.error('❌ [CRON] Error en la tarea de cumpleaños:', error);
    }
  });
  
  console.log('⏰ Tarea programada de cumpleaños (diaria a las 8:00 AM) inicializada.');
}
