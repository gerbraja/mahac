const fs = require('fs');
const { State, City } = require('country-state-city');

const rawData = JSON.parse(fs.readFileSync('colombia_raw_data.json', 'utf8'));
const countryCode = 'CO';
const states = State.getStatesOfCountry(countryCode);

const normalize = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

const rawMap = {}; 
const rawDeptNames = new Set();

rawData.forEach(item => {
    const dept = normalize(item.nombre_departamento);
    rawDeptNames.add(dept);
    const city = normalize(item.nombre_municipio);

    const divipolaCode = String(item.codigo_municipio).padStart(5, '0');

    if (!rawMap[dept]) rawMap[dept] = [];
    rawMap[dept].push({ city, code: divipolaCode });
});

const finalObj = {};

states.forEach(state => {
    const libDeptNorm = normalize(state.name);
    let rawDeptKey = libDeptNorm;

    if (libDeptNorm.includes("SAN ANDRES")) rawDeptKey = "ARCHIPIELAGO DE SAN ANDRES, PROVIDENCIA Y SANTA CATALINA"; 
    if (libDeptNorm === "BOGOTA D.C.") rawDeptKey = "BOGOTA D.C.";
    if (libDeptNorm === "VALLE DEL CAUCA") rawDeptKey = "VALLE DEL CAUCA";

    if (!rawMap[rawDeptKey]) {
        const found = Object.keys(rawMap).find(k => k.includes(libDeptNorm) || libDeptNorm.includes(k));
        if (found) rawDeptKey = found;
    }

    if (!rawMap[rawDeptKey]) {
        finalObj[state.isoCode] = {}; 
        return;
    }

    finalObj[state.isoCode] = {};
    const cities = City.getCitiesOfState(countryCode, state.isoCode);
    const rawCities = rawMap[rawDeptKey];

    cities.forEach(city => {
        const libCityNorm = normalize(city.name);
        
        // Exact match
        let match = rawCities.find(rc => rc.city === libCityNorm);

        // Preffix strip
        if (!match) {
            const prefixes = ["EL ", "LA ", "LOS ", "LAS ", "SAN ", "SANTA ", "BAJO ", "ALTO "];
            match = rawCities.find(rc => {
                return rc.city === libCityNorm ||
                    prefixes.some(p => libCityNorm.replace(p, "") === rc.city) ||
                    prefixes.some(p => rc.city.replace(p, "") === libCityNorm);
            });
        }

        // Broad match
        if (!match && libCityNorm.length > 4) {
            match = rawCities.find(rc => rc.city.includes(libCityNorm) || libCityNorm.includes(rc.city));
        }

        if (match) {
            finalObj[state.isoCode][city.name] = match.code;
        } 
    });
});

const fileContent = `export const COLOMBIA_DIVIPOLA_COMPLETO = ${JSON.stringify(finalObj, null, 4)};\n`;
fs.writeFileSync('src/data/colombiaDivipolaCompleto.js', fileContent);
console.log("Successfully wrote src/data/colombiaDivipolaCompleto.js");

fs.writeFileSync('colombia_divipola_completo.json', JSON.stringify(finalObj, null, 4));

const isoMap = {}; states.forEach(s => isoMap[s.name] = s.isoCode); fs.writeFileSync('state_iso_map.json', JSON.stringify(isoMap, null, 2));
