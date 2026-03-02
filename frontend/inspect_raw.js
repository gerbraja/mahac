
const fs = require('fs');

const rawData = JSON.parse(fs.readFileSync('colombia_raw_data.json', 'utf8'));

const found = rawData.filter(x => x.nombre_municipio.includes('ABEJORRAL') || x.nombre_municipio.includes('Abejorral'));
console.log('Abejorral Zip:', found.map(x => x.codigo_postal));

const bello = rawData.filter(x => x.nombre_municipio === 'BELLO' && x.nombre_departamento === 'ANTIOQUIA');
console.log('Bello Zip:', bello.map(x => x.codigo_postal));

const leticia = rawData.filter(x => x.nombre_municipio === 'LETICIA');
console.log('Leticia Zip:', leticia.map(x => x.codigo_postal));

const bogota = rawData.filter(x => x.codigo_postal && x.codigo_postal.startsWith('11'));
console.log('Bogota Sample Zip:', bogota.slice(0, 5).map(x => x.codigo_postal));
