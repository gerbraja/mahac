// check_huila_full.js
import { City, State } from 'country-state-city';
import fs from 'fs';

const countryCode = 'CO';
const states = State.getStatesOfCountry(countryCode);
const huila = states.find(s => s.name === 'Huila' || s.name.includes('Huila'));

if (huila) {
    const cities = City.getCitiesOfState(countryCode, huila.isoCode);
    const db = cities.map(c => c.name);
    fs.writeFileSync('huila_full_list.json', JSON.stringify(db, null, 2));
}
