
const fs = require('fs');

const rawData = JSON.parse(fs.readFileSync('colombia_raw_data.json', 'utf8'));

const normalize = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

const missing = [
    { city: 'La Victoria', dept: 'AMAZONAS' },
    { city: 'Miriti - Paraná', dept: 'AMAZONAS' }, // Prob "Miriti - Parana" or "Miriti"
    { city: 'Donmatías', dept: 'ANTIOQUIA' }, // Prob "Don Matias"
    { city: 'Santa Fe de Antioquia', dept: 'ANTIOQUIA' },
    { city: 'Guachené', dept: 'CAUCA' },
    { city: 'El Cantón de San Pablo', dept: 'CHOCO' }, // Prob "Canton de San Pablo"
    { city: 'San Andrés de Sotavento', dept: 'CORDOBA' },
    { city: 'La Guadalupe', dept: 'GUAINIA' },
    { city: 'Mapiripana', dept: 'GUAINIA' },
    { city: 'Morichal', dept: 'GUAINIA' },
    { city: 'Pana Pana', dept: 'GUAINIA' },
    { city: 'Puerto Colombia', dept: 'GUAINIA' }, // Diff from Atlantico one
    { city: 'Cerro de San Antonio', dept: 'MAGDALENA' },
    { city: 'Chivolo', dept: 'MAGDALENA' },
    { city: 'Pacoa', dept: 'VAUPES' },
    { city: 'Papunaua', dept: 'VAUPES' },
    { city: 'Yavaraté', dept: 'VAUPES' }
];

missing.forEach(m => {
    const rawDept = normalize(m.dept);
    const searchCity = normalize(m.city);

    // Exact or loose match in raw data
    const matches = rawData.filter(x => {
        const rDept = normalize(x.nombre_departamento);
        const rCity = normalize(x.nombre_municipio);

        // Match dept first (fuzzy for Choco/Cordoba)
        if (!rDept.includes(msgDeptToRaw(m.dept))) return false;

        // Match city
        if (rCity === searchCity) return true;
        if (rCity.includes(searchCity) || searchCity.includes(rCity)) return true;
        // Donmatias special
        if (searchCity === "DONMATIAS" && rCity === "DON MATIAS") return true;

        return false;
    });

    if (matches.length > 0) {
        // format code
        let codeStr = matches[0].codigo_postal;
        if (codeStr && (codeStr.includes('.') || codeStr.includes(','))) {
            const cleanVal = parseFloat(codeStr.replace(',', '.'));
            codeStr = Math.round(cleanVal * 1000).toString();
        }
        const code = codeStr.padStart(6, '0');
        console.log(`FOUND: ${m.city} -> ${code} (Raw: ${matches[0].nombre_municipio})`);
    } else {
        console.log(`NOT FOUND: ${m.city} in ${m.dept}`);
    }
});

function msgDeptToRaw(dept) {
    if (dept === 'CHOCO') return 'CHOCO';
    if (dept === 'CORDOBA') return 'CORDOBA';
    if (dept === 'GUAINIA') return 'GUAINIA';
    if (dept === 'VAUPES') return 'VAUPES';
    return dept;
}
