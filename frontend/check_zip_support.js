// check_zip_support.js
import { City } from 'country-state-city';

const cities = City.getCitiesOfState('CO', 'HUI');
console.log("Sample City Object:");
console.log(JSON.stringify(cities[0], null, 2));

const hasZip = cities.some(c => c.zipCode || c.postalCode);
console.log("Has Zip Code data?", hasZip);
