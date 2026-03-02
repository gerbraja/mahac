
const fs = require('fs');

const targetPath = 'src/data/colombiaZipCodes.js';
const fileContent = fs.readFileSync(targetPath, 'utf8');

// Parse current file
const prefix = "export const COLOMBIA_ZIP_CODES = ";
const jsonStr = fileContent.substring(fileContent.indexOf(prefix) + prefix.length).replace(/;$/, "");
let data;
try {
    data = JSON.parse(jsonStr);
} catch (e) {
    console.error("Error parsing existing file:", e.message);
    process.exit(1);
}

const fixes = {
    'AMA': { 'La Victoria': '915361', 'Miriti - Paraná': '916057' },
    'ANT': { 'Donmatías': '051850', 'Santa Fe de Antioquia': '057050' },
    'CAU': { 'Guachené': '191087' },
    'CHO': { 'El Cantón de San Pablo': '272048' },
    'COR': { 'San Andrés de Sotavento': '232030' },
    'GUA': {
        'La Guadalupe': '942057',
        'Mapiripana': '941039',
        'Morichal': '943058',
        'Pana Pana': '943018',
        'Puerto Colombia': '941037'
    },
    'MAG': { 'Cerro de San Antonio': '476020', 'Chivolo': '476060' },
    'VAU': { 'Pacoa': '970001', 'Papunaua': '973047', 'Yavaraté': '971008' },
    'DC': { 'Bogotá D.C.': '111111' },
    'CUN': { 'Bogotá D.C.': '111111' }
};

let count = 0;
for (const [dept, cities] of Object.entries(fixes)) {
    if (!data[dept]) data[dept] = {};
    for (const [city, code] of Object.entries(cities)) {
        data[dept][city] = code;
        count++;
    }
}

// Re-serialize
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

fs.writeFileSync(targetPath, header + "export const COLOMBIA_ZIP_CODES = " + JSON.stringify(data, null, 4) + ";");
console.log(`Applied ${count} fixes successfully.`);
