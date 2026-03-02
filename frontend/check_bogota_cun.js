
const { City } = require('country-state-city');

const cities = City.getCitiesOfState('CO', 'CUN');
const found = cities.find(c => c.name.includes("Bogot"));
console.log("Found in Cundinamarca:", found);
