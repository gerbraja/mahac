// check_cities.js
import { Country, State, City } from 'country-state-city';
import fs from 'fs';

const countryCode = 'CO';
const states = State.getStatesOfCountry(countryCode);
const huila = states.find(s => s.name === 'Huila' || s.name.includes('Huila'));

if (huila) {
    const cities = City.getCitiesOfState(countryCode, huila.isoCode);

    const targets = ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Gigante'];
    const results = {};

    targets.forEach(t => {
        const found = cities.find(c => c.name === t);
        results[t] = found ? "MATCH" : "MISSING";
        if (!found) {
            // Look for fuzzy match
            const fuzzy = cities.find(c => c.name.includes(t));
            if (fuzzy) results[t] = `PARTIAL: '${fuzzy.name}'`;
        }
    });

    const output = {
        huilaCode: huila.isoCode,
        totalCities: cities.length,
        targets: results,
        allNames: cities.map(c => c.name)
    };

    fs.writeFileSync('huila_cities_debug.json', JSON.stringify(output, null, 2));
    console.log("Debug info written to huila_cities_debug.json");

} else {
    console.log("Huila not found");
}
