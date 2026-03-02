// check_guadalupe.js
import { City, State } from 'country-state-city';

const countryCode = 'CO';
const states = State.getStatesOfCountry(countryCode);
const huila = states.find(s => s.name === 'Huila' || s.name.includes('Huila'));

if (huila) {
    const cities = City.getCitiesOfState(countryCode, huila.isoCode);
    const guadalupe = cities.find(c => c.name.includes('Guadalupe'));

    if (guadalupe) {
        console.log(`Found: '${guadalupe.name}'`);
        console.log(`Code: ${guadalupe.stateCode}`);
        // Check for hidden characters
        console.log(`Character codes: ${guadalupe.name.split('').map(c => c.charCodeAt(0)).join(',')}`);
    } else {
        console.log("Guadalupe NOT found in Huila");
        // Print all to see if it's named differently
        console.log("All cities:", cities.map(c => c.name));
    }
} else {
    console.log("Huila not found");
}
