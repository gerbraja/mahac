
const fs = require('fs');
const { State, City } = require('country-state-city');

const rawData = JSON.parse(fs.readFileSync('colombia_raw_data.json', 'utf8'));
const countryCode = 'CO';
const states = State.getStatesOfCountry(countryCode);

const normalize = (str) => {
    if (!str) return '';
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

// 1. Organize Raw Data by Normalized Department
const rawMap = {}; // { 'HUILA': [ { city: 'AGRADO', code: '414040' }, ... ] }
const rawDeptNames = new Set();

rawData.forEach(item => {
    const dept = normalize(item.nombre_departamento);
    rawDeptNames.add(dept);
    const city = normalize(item.nombre_municipio);

    // FIX: Postal codes are formatted as '55.03', '910.001' (effectively divided by 1000).
    // Multiply by 1000, round, and pad to 6 digits.
    let codeStr = item.codigo_postal;
    if (codeStr && (codeStr.includes('.') || codeStr.includes(','))) {
        // Remove comma if present (some locales) or just treat as float
        const cleanVal = parseFloat(codeStr.replace(',', '.'));
        if (!isNaN(cleanVal)) {
            codeStr = Math.round(cleanVal * 1000).toString();
        }
    }
    // Pad to 6
    const code = codeStr.padStart(6, '0');


    if (!rawMap[dept]) rawMap[dept] = [];
    rawMap[dept].push({ city, code });
});

console.log("Raw Departments found:", Array.from(rawDeptNames).sort());

// 2. Build the Final Object
const finalObj = {};
let matchCount = 0;
let failCount = 0;

states.forEach(state => {
    const libDeptNorm = normalize(state.name);
    // Attempt to find matching raw department
    // Simple direct match first, then some known overrides
    let rawDeptKey = libDeptNorm;

    // Manual mapping for tricky ones
    if (libDeptNorm.includes("SAN ANDRES")) rawDeptKey = "ARCHIPIELAGO DE SAN ANDRES, PROVIDENCIA Y SANTA CATALINA"; // Guessing
    if (libDeptNorm === "BOGOTA D.C.") rawDeptKey = "BOGOTA D.C.";
    if (libDeptNorm === "VALLE DEL CAUCA") rawDeptKey = "VALLE DEL CAUCA";

    // Fuzzy search for department if exact fail
    if (!rawMap[rawDeptKey]) {
        const found = Object.keys(rawMap).find(k => k.includes(libDeptNorm) || libDeptNorm.includes(k));
        if (found) rawDeptKey = found;
    }

    if (!rawMap[rawDeptKey]) {
        console.warn(`!! Could not find raw data for department: ${state.name} (Norm: ${libDeptNorm})`);
        finalObj[state.isoCode] = {}; // Empty for now
        return;
    }

    finalObj[state.isoCode] = {};
    const cities = City.getCitiesOfState(countryCode, state.isoCode);
    const rawCities = rawMap[rawDeptKey];

    cities.forEach(city => {
        const libCityNorm = normalize(city.name);

        // Find best match in rawCities
        let match = rawCities.find(rc => rc.city === libCityNorm);

        // Try stripping prefixes like "EL ", "LA ", "LOS ", "SAN ", "SANTA " if not found
        if (!match) {
            const prefixes = ["EL ", "LA ", "LOS ", "LAS ", "SAN ", "SANTA ", "BAJO ", "ALTO "];
            match = rawCities.find(rc => {
                return rc.city === libCityNorm ||
                    prefixes.some(p => libCityNorm.replace(p, "") === rc.city) ||
                    prefixes.some(p => rc.city.replace(p, "") === libCityNorm);
            });
        }

        // Try strict inclusion (dangerous for short names but useful)
        if (!match && libCityNorm.length > 4) {
            match = rawCities.find(rc => rc.city.includes(libCityNorm) || libCityNorm.includes(rc.city));
        }

        if (match) {
            finalObj[state.isoCode][city.name] = match.code;
            // Also add unaccented version if the name has accents
            if (city.name !== match.city && normalize(city.name) === match.city) {
                // The keys in finalObj are strictly what's in the library.
                // But we can add the unaccented version as a fallback key?
                // User request was mostly about coverage. The library names are the keys used by UI.
                // So we just map LibraryName -> Code.
            }
            // Add unaccented alias internally just in case UI sends it?
            // Actually, best to just stick to library exact name.
            matchCount++;
        } else {
            console.log(`  Missed City in ${state.name}: ${city.name} (seeking in ${rawDeptKey})`);
            failCount++;
        }
    });
});

console.log(`Matching Complete. Matched: ${matchCount}, Failed: ${failCount}`);

// Manually fix known capitals if missed? (Checking Bogota/Medellin/Cali)

// Output to file
const fileContent = `export const COLOMBIA_ZIP_CODES = ${JSON.stringify(finalObj, null, 4)};`;
fs.writeFileSync('generated_colombiaZipCodes.js', fileContent);
console.log("Wrote generated_colombiaZipCodes.js");
