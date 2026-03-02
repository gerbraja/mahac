
const { State, City } = require('country-state-city');

const countryCode = 'CO';
const states = State.getStatesOfCountry(countryCode);

console.log(`Total Departments: ${states.length}`);
let totalCities = 0;

const allData = {};

states.forEach(state => {
    const cities = City.getCitiesOfState(countryCode, state.isoCode);
    totalCities += cities.length;
    allData[state.name] = {
        iso: state.isoCode,
        count: cities.length,
        cities: cities.map(c => c.name) // Just names for now
    };
    console.log(`${state.name} (${state.isoCode}): ${cities.length} cities`);
});

console.log(`Total Municipalities/Cities: ${totalCities}`);
