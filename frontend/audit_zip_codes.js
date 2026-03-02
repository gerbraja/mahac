
const fs = require('fs');
const { State, City } = require('country-state-city');

// Read the generated file to extract the object
const fileContent = fs.readFileSync('src/data/colombiaZipCodes.js', 'utf8');
const prefix = "export const COLOMBIA_ZIP_CODES = ";
const jsonStr = fileContent.substring(fileContent.indexOf(prefix) + prefix.length).replace(/;$/, "");
let zipData;
try {
    zipData = JSON.parse(jsonStr);
} catch (e) {
    console.error("Error parsing Zip Data:", e.message);
    process.exit(1);
}

const countryCode = 'CO';
const states = State.getStatesOfCountry(countryCode);

let totalCities = 0;
let missingCities = [];

states.forEach(state => {
    const deptCities = City.getCitiesOfState(countryCode, state.isoCode);
    const deptZips = zipData[state.isoCode] || {};

    deptCities.forEach(city => {
        totalCities++;
        if (!deptZips[city.name]) {
            missingCities.push({
                state: state.name,
                iso: state.isoCode,
                city: city.name
            });
        }
    });
});

console.log(`Total Cities in Library: ${totalCities}`);
console.log(`Missing Postal Codes: ${missingCities.length}`);
console.log(`Coverage: ${((totalCities - missingCities.length) / totalCities * 100).toFixed(2)}%`);

if (missingCities.length > 0) {
    console.log("\n--- Missing Municipalities ---");
    missingCities.forEach(m => console.log(`${m.state} (${m.iso}): ${m.city}`));
}
