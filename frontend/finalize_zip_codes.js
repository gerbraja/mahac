
const fs = require('fs');

const generatedPath = 'generated_colombiaZipCodes.js';
const targetPath = 'src/data/colombiaZipCodes.js';

if (!fs.existsSync(generatedPath)) {
    console.error("Generated file not found!");
    process.exit(1);
}

let generatedContent = fs.readFileSync(generatedPath, 'utf8');

// Parse the generated JS to object to manipulate it safely
// Format is: export const COLOMBIA_ZIP_CODES = { ... };
const prefix = "export const COLOMBIA_ZIP_CODES = ";
const jsonStr = generatedContent.replace(prefix, "").replace(/;$/, ""); // Regex to remove trailing semicolon
let data;
try {
    data = JSON.parse(jsonStr);
} catch (e) {
    console.error("Error parsing generated JSON:", e.message);
    // If parsing fails, just use original content but warn
    fs.writeFileSync(targetPath, generatedContent); // Fallback
    process.exit(1);
}

// Inject Santa Maria fallback if Santa María exists (Huila)
if (data['HUI'] && data['HUI']['Santa María']) {
    data['HUI']['Santa Maria'] = data['HUI']['Santa María'];
    console.log("Added fallback for Santa Maria (Huila)");
}

// Re-serialize with indentation
const newContent = JSON.stringify(data, null, 4);

const header = `/**
 * LISTADO DE CÓDIGOS POSTALES DE COLOMBIA (Organizado por Departamento)
 * 
 * ESTRUCTURA:
 * 'CODIGO_DEPARTAMENTO': {
 *     'NombreMunicipio': 'CodigoPostal'
 * }
 * 
 * Fuente: datos.gov.co / Servicios Postales Nacionales (4-72)
 * Actualizado automáticamente para cubrir todos los municipios.
 */

`;

fs.writeFileSync(targetPath, header + "export const COLOMBIA_ZIP_CODES = " + newContent + ";");
console.log("Updated src/data/colombiaZipCodes.js successfully.");
