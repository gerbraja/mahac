import { getGeminiInstance } from '../config/gemini.js';
import { getActiveProducts, getUserByPhone } from '../config/db.js';
import { addAppointment } from './sheetsService.js';
import dotenv from 'dotenv';

dotenv.config();

// Definición de la función para que Gemini pueda agendar citas en Google Sheets
const agendarCitaTool = {
  functionDeclarations: [
    {
      name: "agendarCita",
      description: "Registra una cita o reunión informativa en Google Sheets.",
      parameters: {
        type: "OBJECT",
        properties: {
          nombreCliente: {
            type: "STRING",
            description: "Nombre de la persona que agenda la cita."
          },
          fecha: {
            type: "STRING",
            description: "Fecha en formato AAAA-MM-DD o lenguaje natural (ej: 'este lunes', '3 de junio')."
          },
          hora: {
            type: "STRING",
            description: "Hora de la reunión (ej: '10:00 AM', '3:00 PM')."
          },
          notas: {
            type: "STRING",
            description: "Notas adicionales como motivo de la reunión o dudas específicas."
          }
        },
        required: ["nombreCliente", "fecha", "hora"]
      }
    }
  ]
};

// Instrucción del sistema detallando personalidad, catálogo, y políticas de la tienda
const SYSTEM_INSTRUCTION = `
Eres "TEI-Bot", el asistente virtual de servicio al cliente de **Tu Empresa Internacional (Comercializadora TEI)**.
Tu objetivo es ayudar de forma amable, clara y profesional.

INFORMACIÓN DE LA TIENDA Y SERVICIO:
- **Cómo realizar un pedido**: El usuario agrega productos al carrito en la Tienda Virtual y procede a finalizar compra (checkout).
- **Medios de Pago Vigentes**:
  1. Billetera Virtual (usando saldo de su Oficina Virtual).
  2. Binance Pay / Criptomonedas (se acepta USDT, BTC, ETH. Requiere enviar comprobante a ventas@tuempresainternacional.com).
  3. Transferencia Bancaria Directa (Bancolombia, Cuenta de Ahorros #28500005672, Titular: Tu Empresa Internacional S.A.S. Requiere enviar comprobante a ventas@tuempresainternacional.com).
  *Nota*: Otros métodos de pago como Bre-B, PSE o Efecty no están disponibles temporalmente.
- **Envíos**: Hacemos envíos a nivel nacional. La tarifa y flete se cotizan automáticamente al finalizar el pedido. También se puede recoger en puntos de oficina autorizados.

PLAN DE COMPENSACIÓN / COMISIONES:
- Contamos con sistemas avanzados de MLM para afiliados: Plan Unilevel, Plan Binario Global y Matrices Forzadas.
- Los afiliados ganan comisiones por las compras de sus recomendados directos e indirectos en su red.
- Los puntos de volumen (PV) acumulados por cada compra determinan el rango y comisiones mensuales de cada afiliado.

REGLAS DE COMPORTAMIENTO:
1. Sé siempre educado y servicial.
2. Si te preguntan sobre agendar una cita o reunión, utiliza la herramienta 'agendarCita' para guardarla.
3. Responde de forma concisa (adecuada para leer en WhatsApp). No uses negritas excesivas ni respuestas exageradamente largas.
4. Si no sabes la respuesta o es un caso muy específico de soporte de pagos, amablemente indícale que vas a transferir la conversación a un agente humano de soporte técnico.
`;

export async function processUserMessage(fromPhone, userMessage) {
  const ai = getGeminiInstance();
  if (!ai) {
    return "Lo siento, mi sistema de inteligencia artificial está temporalmente fuera de línea. Por favor intenta más tarde.";
  }

  // 1. Consultar base de datos en tiempo real
  const user = await getUserByPhone(fromPhone);
  const products = await getActiveProducts();

  // 2. Construir contexto dinámico
  let catalogContext = "\n\nCATÁLOGO EN TIEMPO REAL:\n";
  if (products.length > 0) {
    products.forEach(p => {
      catalogContext += `- ${p.name} (SKU: ${p.sku || 'N/A'}): $${p.price_local?.toLocaleString()} COP | PV: ${p.pv} | Stock: ${p.stock}\n  Beneficio/Desc: ${p.description || 'Sin descripción disponible.'}\n`;
    });
  } else {
    catalogContext += "No hay productos en inventario actualmente.\n";
  }

  let userContext = "\n\nDATOS DEL USUARIO CHATEANDO:\n";
  if (user) {
    userContext += `- Nombre: ${user.name}\n- Usuario: ${user.username}\n- Email: ${user.email}\n- Rango/Nivel de Paquete: Nivel ${user.package_level || 0}\n`;
  } else {
    userContext += "El número de WhatsApp no coincide con ningún afiliado registrado en la tienda virtual (Usuario Invitado).\n";
  }

  const finalInstruction = SYSTEM_INSTRUCTION + catalogContext + userContext;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMessage,
      config: {
        systemInstruction: finalInstruction,
        tools: [agendarCitaTool]
      }
    });

    // 3. Procesar llamadas a funciones si Gemini decide agendar una cita
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      
      if (call.name === 'agendarCita') {
        const { nombreCliente, fecha, hora, notas } = call.args;
        
        // Ejecutar acción en Google Sheets
        const success = await addAppointment(nombreCliente, fromPhone, fecha, hora, notas || '');
        
        if (success) {
          // Enviar confirmación a Gemini para que elabore la respuesta final
          const followUpResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `El sistema ha agendado exitosamente la cita con los siguientes datos: Nombre: ${nombreCliente}, Fecha: ${fecha}, Hora: ${hora}, Notas: ${notas || 'Ninguna'}. Redacta una respuesta de confirmación amable para WhatsApp indicándole al cliente que su cita fue agendada en la hoja de cálculo.`,
            config: {
              systemInstruction: finalInstruction
            }
          });
          return followUpResponse.text;
        } else {
          return `Tuvimos un inconveniente técnico al intentar registrar tu cita en nuestro calendario de Google Sheets. Por favor, indícame tu fecha y hora preferidas e intentaremos agendarlo con soporte humano.`;
        }
      }
    }

    return response.text || "Disculpa, no logré procesar tu solicitud. ¿Me la podrías repetir?";
  } catch (error) {
    console.error('❌ Error en el procesamiento de Gemini:', error);
    return "Lo siento, tuve un pequeño problema al procesar tu mensaje. ¿Me puedes decir en qué más te puedo ayudar?";
  }
}
