/**
 * Tabla oficial de Tarifas ReteICA Municipales en Colombia
 * Basado en Estatutos Tributarios Municipales (Actividad: Comisiones y Comercio de Servicios)
 * 
 * Tarifa en porcentaje (%)
 * Ej: 9.66 x mil = 0.966%
 *     6.9 x mil = 0.690%
 *     7.0 x mil = 0.700%
 */

export const COLOMBIA_RETEICA_TARIFAS = [
    { city: "Bogotá D.C.", divipola: "11001", dept: "Cundinamarca / D.C.", rate: 0.966, label: "9.66 x mil (Acuerdo 65/2002)" },
    { city: "Medellín", divipola: "05001", dept: "Antioquia", rate: 0.690, label: "6.90 x mil (Acuerdo 66/2017)" },
    { city: "Cali", divipola: "76001", dept: "Valle del Cauca", rate: 0.770, label: "7.70 x mil (Decreto 411)" },
    { city: "Barranquilla", divipola: "08001", dept: "Atlántico", rate: 0.800, label: "8.00 x mil (Estatuto Tributario D.E.)" },
    { city: "Bucaramanga", divipola: "68001", dept: "Santander", rate: 0.800, label: "8.00 x mil (Acuerdo 044)" },
    { city: "Cartagena", divipola: "13001", dept: "Bolívar", rate: 0.700, label: "7.00 x mil (Acuerdo 041)" },
    { city: "Pereira", divipola: "66001", dept: "Risaralda", rate: 0.700, label: "7.00 x mil (Acuerdo 41)" },
    { city: "Manizales", divipola: "17001", dept: "Caldas", rate: 0.700, label: "7.00 x mil (Acuerdo 1032)" },
    { city: "Cúcuta", divipola: "54001", dept: "Norte de Santander", rate: 0.700, label: "7.00 x mil (Acuerdo 040)" },
    { city: "Ibagué", divipola: "73001", dept: "Tolima", rate: 0.700, label: "7.00 x mil (Acuerdo 031)" },
    { city: "Villavicencio", divipola: "50001", dept: "Meta", rate: 0.700, label: "7.00 x mil (Acuerdo 386)" },
    { city: "Santa Marta", divipola: "47001", dept: "Magdalena", rate: 0.700, label: "7.00 x mil (Acuerdo 024)" },
    { city: "Pasto", divipola: "52001", dept: "Nariño", rate: 0.700, label: "7.00 x mil (Acuerdo 038)" },
    { city: "Neiva", divipola: "41001", dept: "Huila", rate: 0.700, label: "7.00 x mil (Acuerdo 026)" },
    { city: "Armenia", divipola: "63001", dept: "Quindío", rate: 0.700, label: "7.00 x mil (Acuerdo 019)" },
    { city: "Popayán", divipola: "19001", dept: "Cauca", rate: 0.600, label: "6.00 x mil (Acuerdo 018)" },
    { city: "Valledupar", divipola: "20001", dept: "Cesar", rate: 0.700, label: "7.00 x mil (Acuerdo 022)" },
    { city: "Montería", divipola: "23001", dept: "Córdoba", rate: 0.700, label: "7.00 x mil (Acuerdo 039)" },
    { city: "Sincelejo", divipola: "70001", dept: "Sucre", rate: 0.700, label: "7.00 x mil (Acuerdo 171)" },
    { city: "Tunja", divipola: "15001", dept: "Boyacá", rate: 0.700, label: "7.00 x mil (Acuerdo 030)" }
];

/**
 * Función para obtener la tarifa oficial de ReteICA según la ciudad/municipio
 * @param {string} cityName - Nombre de la ciudad o municipio
 * @returns {{ rate: number, label: string, divipola: string, city: string }}
 */
export const getReteicaForCity = (cityName) => {
    if (!cityName) return { rate: 0.0, label: "0% (Exento o No sujeto)", divipola: "", city: "" };

    // Limpieza alfanumérica y sin tildes (elimina comas, puntos, espacios)
    // Ej: "Bogotá, D.C." -> "bogotadc" y "Bogotá D.C." -> "bogotadc"
    const normalize = s => {
        return s
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
    };

    const cleanInput = normalize(cityName);

    const found = COLOMBIA_RETEICA_TARIFAS.find(item => {
        const cleanCity = normalize(item.city);
        return cleanInput.includes(cleanCity) || cleanCity.includes(cleanInput);
    });

    if (found) {
        return found;
    }

    return { rate: 0.0, label: "0% (Municipio sin retención aplicable)", divipola: "", city: cityName };
};
