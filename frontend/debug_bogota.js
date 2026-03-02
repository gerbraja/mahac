
const fs = require('fs');
const { City } = require('country-state-city');

const fileContent = fs.readFileSync('src/data/colombiaZipCodes.js', 'utf8');
const prefix = "export const COLOMBIA_ZIP_CODES = ";
const jsonStr = fileContent.substring(fileContent.indexOf(prefix) + prefix.length).replace(/;$/, "");
const data = JSON.parse(jsonStr);

const libraryCity = City.getCitiesOfState('CO', 'DC')[0].name;
const fileCity = Object.keys(data['DC'])[0];

console.log(`Library: "${libraryCity}"`);
console.log(`File:    "${fileCity}"`);

if (libraryCity !== fileCity) {
    console.log("Difference detected!");
    console.log("Library Codes:", libraryCity.split('').map(c => c.charCodeAt(0)));
    console.log("File Codes:   ", fileCity.split('').map(c => c.charCodeAt(0)));
} else {
    console.log("They are identical.");
    // Then why did audit fail?
    // Maybe audit loop logic?
    // Audit: const deptZips = zipData[state.isoCode] || {};
    // if (!deptZips[city.name]) ...

    const val = data['DC'][libraryCity];
    console.log(`Direct access data['DC']['${libraryCity}'] = ${val}`);
}
