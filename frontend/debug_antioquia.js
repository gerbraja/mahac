
const { City } = require('country-state-city');

const cities = City.getCitiesOfState('CO', 'ANT');

console.log(`Total cities in library for ANT: ${cities.length}`);

// Dump all names
cities.forEach(c => {
    // Print name and unicode codes for first few chars to check for hidden chars
    const codes = c.name.split('').map(x => x.charCodeAt(0)).join(',');
    console.log(`"${c.name}" -> [${codes}]`);
});
