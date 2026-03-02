
const fs = require('fs');

const fileContent = fs.readFileSync('src/data/colombiaZipCodes.js', 'utf8');
const prefix = "export const COLOMBIA_ZIP_CODES = ";
const jsonStr = fileContent.substring(fileContent.indexOf(prefix) + prefix.length).replace(/;$/, "");
const data = JSON.parse(jsonStr);

const ant = data['ANT'];

const checks = [
    "Abejorral",
    "Vigía del Fuerte",
    "Yalí",
    "Yolombó",
    "Santa Fe de Antioquia",
    "Medellín"
];

checks.forEach(city => {
    if (ant[city]) {
        console.log(`OK: "${city}" -> ${ant[city]}`);
    } else {
        console.log(`MISSING: "${city}"`);
    }
});
