/**
 * CÓDIGOS DIVIPOLA — DANE / DIAN Colombia
 * Formato: { "NombreCiudad": "CCCMM" }
 *   CCC = código departamento (2 dígitos)
 *   MM  = código municipio (3 dígitos)
 * Total: 5 dígitos. Obligatorio en factura electrónica DIAN.
 *
 * Fuente: DANE — https://www.dane.gov.co/
 * Medellín = 05001 (Antioquia=05, Medellín=001)
 * Bogotá   = 11001
 * Cali     = 76001
 */

export const COLOMBIA_DIVIPOLA = {
  // Amazonas (91)
  "Leticia": "91001", "El Encanto": "91263", "La Chorrera": "91405",
  "La Pedrera": "91407", "La Victoria": "91430", "Mirití - Paraná": "91460",
  "Puerto Alegría": "91530", "Puerto Arica": "91536", "Puerto Nariño": "91540",
  "Puerto Santander": "91669", "Tarapacá": "91798",

  // Antioquia (05)
  "Medellín": "05001", "Abejorral": "05002", "Abriaquí": "05004",
  "Alejandría": "05021", "Amagá": "05030", "Amalfi": "05031",
  "Andes": "05034", "Angelópolis": "05036", "Angostura": "05038",
  "Anorí": "05040", "Anza": "05044", "Apartadó": "05045",
  "Arboletes": "05051", "Argelia": "05055", "Armenia": "05059",
  "Barbosa": "05079", "Bello": "05088", "Belmira": "05086",
  "Betania": "05091", "Betulia": "05093", "Briceño": "05107",
  "Buriticá": "05113", "Caicedo": "05120", "Caldas": "05129",
  "Campamento": "05134", "Caracolí": "05138", "Caramanta": "05142",
  "Carepa": "05145", "Carolina": "05147", "Caucasia": "05150",
  "Cañasgordas": "05148", "Chigorodó": "05172", "Cisneros": "05190",
  "Ciudad Bolívar": "05101", "Cocorná": "05197", "Concepción": "05206",
  "Concordia": "05209", "Copacabana": "05212", "Cáceres": "05154",
  "Dabeiba": "05234", "Donmatías": "05237", "Ebéjico": "05240",
  "El Bagre": "05250", "El Carmen de Viboral": "05148", "El Santuario": "05313",
  "Entrerrios": "05264", "Envigado": "05266", "Fredonia": "05282",
  "Frontino": "05284", "Giraldo": "05306", "Girardota": "05308",
  "Granada": "05315", "Guadalupe": "05318", "Guarne": "05321",
  "Guatapé": "05325", "Gómez Plata": "05310", "Heliconia": "05347",
  "Hispania": "05353", "Itagui": "05360", "Ituango": "05361",
  "Jardín": "05364", "Jericó": "05368", "La Ceja": "05376",
  "La Estrella": "05380", "La Pintada": "05390", "La Unión": "05400",
  "Liborina": "05411", "Maceo": "05425", "Marinilla": "05440",
  "Montebello": "05467", "Murindó": "05475", "Mutatá": "05480",
  "Nariño": "05483", "Nechí": "05490", "Necoclí": "05495",
  "Olaya": "05501", "Peque": "05541", "Peñol": "05543",
  "Pueblorrico": "05576", "Puerto Berrío": "05579", "Puerto Nare": "05585",
  "Puerto Triunfo": "05591", "Remedios": "05604", "Retiro": "05607",
  "Rionegro": "05615", "Sabanalarga": "05628", "Sabaneta": "05631",
  "Salgar": "05642", "San Andrés de Cuerquía": "05647",
  "San Carlos": "05649", "San Francisco": "05652",
  "San Jerónimo": "05656", "San José de la Montaña": "05658",
  "San Juan de Urabá": "05659", "San Luis": "05660",
  "San Pedro de Uraba": "05665", "San Pedro de los Milagros": "05664",
  "San Rafael": "05667", "San Roque": "05670", "San Vicente Ferrer": "05674",
  "Santa Bárbara": "05679", "Santa Fe de Antioquia": "05042",
  "Santa Rosa de Osos": "05686", "Santo Domingo": "05690",
  "Segovia": "05736", "Sonson": "05756", "Sopetrán": "05761",
  "Tarazá": "05789", "Tarso": "05790", "Titiribí": "05809",
  "Toledo": "05819", "Turbo": "05837", "Támesis": "05792",
  "Uramita": "05842", "Urrao": "05847", "Valdivia": "05854",
  "Valparaíso": "05856", "Vegachí": "05858", "Venecia": "05861",
  "Vigía del Fuerte": "05873", "Yalí": "05885", "Yarumal": "05887",
  "Yolombó": "05890", "Yondó": "05893", "Zaragoza": "05895",

  // Arauca (81)
  "Arauca": "81001", "Arauquita": "81065", "Cravo Norte": "81220",
  "Fortul": "81300", "Puerto Rondón": "81591", "Saravena": "81736",
  "Tame": "81794",

  // Atlántico (08)
  "Barranquilla": "08001", "Baranoa": "08078", "Campo de la Cruz": "08137",
  "Candelaria": "08141", "Galapa": "08296", "Juan de Acosta": "08372",
  "Luruaco": "08421", "Malambo": "08433", "Manatí": "08436",
  "Palmar de Varela": "08520", "Piojó": "08549", "Polonuevo": "08558",
  "Ponedera": "08560", "Puerto Colombia": "08573", "Repelón": "08606",
  "Sabanagrande": "08634", "Sabanalarga": "08638", "Santa Lucía": "08675",
  "Santo Tomás": "08685", "Soledad": "08758", "Suan": "08770",
  "Tubará": "08832", "Usiacurí": "08849",

  // Bogotá D.C. (11)
  "Bogotá D.C.": "11001", "Bogotá": "11001",

  // Bolívar (13)
  "Cartagena de Indias": "13001", "Cartagena": "13001",
  "Achí": "13006", "Altos del Rosario": "13030", "Arenal": "13042",
  "Arjona": "13052", "Arroyohondo": "13062", "Barranco de Loba": "13074",
  "Calamar": "13140", "Cantagallo": "13160", "Cicuco": "13188",
  "Clemencia": "13212", "Córdoba": "13222", "El Carmen de Bolívar": "13244",
  "El Guamo": "13248", "El Peñón": "13268", "Hatillo de Loba": "13300",
  "Magangué": "13430", "Mahates": "13433", "Margarita": "13440",
  "María la Baja": "13442", "Mompós": "13468", "Montecristo": "13473",
  "Morales": "13490", "Norosí": "13549", "Pinillos": "13549",
  "Regidor": "13600", "Río Viejo": "13620", "San Cristóbal": "13647",
  "San Estanislao": "13650", "San Fernando": "13654",
  "San Jacinto": "13655", "San Jacinto del Cauca": "13657",
  "San Juan Nepomuceno": "13667", "San Martín de Loba": "13670",
  "San Pablo": "13673", "Santa Catalina": "13683", "Santa Rosa": "13688",
  "Santa Rosa del Sur": "13690", "Simití": "13744", "Soplaviento": "13760",
  "Talaigua Nuevo": "13780", "Tiquisio": "13810", "Turbaco": "13836",
  "Turbaná": "13838", "Villanueva": "13873", "Zambrano": "13894",

  // Boyacá (15)
  "Tunja": "15001", "Almeida": "15022", "Aquitania": "15047",
  "Arcabuco": "15051", "Belén": "15087", "Berbeo": "15090",
  "Betéitiva": "15092", "Boavita": "15097", "Boyacá": "15104",
  "Briceño": "15106", "Buenavista": "15109",
  "Campohermoso": "15135", "Chiquinquirá": "15176", "Duitama": "15238",
  "Garagoa": "15299", "Guateque": "15332", "Jenesano": "15362",
  "Miraflores": "15460", "Monguí": "15469", "Moniquirá": "15476",
  "Paipa": "15516", "Puerto Boyacá": "15572", "Sogamoso": "15759",
  "Villa de Leyva": "15407",

  // Caldas (17)
  "Manizales": "17001", "Aguadas": "17013", "Anserma": "17042",
  "Aranzazu": "17050", "Chinchiná": "17174", "La Dorada": "17380",
  "Neira": "17495", "Riosucio": "17614", "Salamina": "17653",
  "Villamaría": "17873",

  // Caquetá (18)
  "Florencia": "18001", "Cartagena del Chairá": "18150",
  "San Vicente del Caguán": "18753",

  // Casanare (85)
  "Yopal": "85001", "Aguazul": "85010", "Monterrey": "85162",
  "Paz de Ariporo": "85225", "Villanueva": "85440",

  // Cauca (19)
  "Popayán": "19001", "Santander de Quilichao": "19698",
  "Miranda": "19455", "Puerto Tejada": "19573",

  // Cesar (20)
  "Valledupar": "20001", "Aguachica": "20011", "Agustín Codazzi": "20013",
  "Bosconia": "20060",

  // Chocó (27)
  "Quibdó": "27001",

  // Cundinamarca (25)
  "Fusagasugá": "25290", "Girardot": "25307", "Facatativá": "25269",
  "Chía": "25175", "Soacha": "25754", "Zipaquirá": "25899",
  "Cajicá": "25126", "Madrid": "25430", "Mosquera": "25473",
  "Funza": "25288",

  // Córdoba (23)
  "Montería": "23001", "Cereté": "23162", "Lorica": "23417",
  "Montelíbano": "23466", "Sahagún": "23660",

  // Guainía (94)
  "Inírida": "94001",

  // Guaviare (95)
  "San José del Guaviare": "95001",

  // Huila (41)
  "Neiva": "41001", "Garzón": "41298", "La Plata": "41396",
  "Pitalito": "41551",

  // La Guajira (44)
  "Riohacha": "44001", "Maicao": "44430", "Uribia": "44847",

  // Magdalena (47)
  "Santa Marta": "47001", "Ciénaga": "47189", "Fundación": "47288",

  // Meta (50)
  "Villavicencio": "50001", "Acacías": "50006", "Granada": "50313",

  // Nariño (52)
  "Pasto": "52001", "Ipiales": "52356", "Tumaco": "52835",
  "Túquerres": "52838",

  // Norte de Santander (54)
  "Cúcuta": "54001", "Pamplona": "54518", "Ocaña": "54498",
  "Villa del Rosario": "54874",

  // Putumayo (86)
  "Mocoa": "86001", "Puerto Asís": "86568",

  // Quindío (63)
  "Armenia": "63001", "Calarcá": "63130", "La Tebaida": "63401",
  "Montenegro": "63470",

  // Risaralda (66)
  "Pereira": "66001", "Dosquebradas": "66170", "La Virginia": "66400",
  "Cartago": "76147",

  // San Andrés y Providencia (88)
  "San Andrés": "88001", "Providencia": "88564",

  // Santander (68)
  "Bucaramanga": "68001", "Barrancabermeja": "68081",
  "Floridablanca": "68276", "Girón": "68307", "Piedecuesta": "68547",
  "Socorro": "68755",

  // Sucre (70)
  "Sincelejo": "70001", "Corozal": "70215", "Sampués": "70670",

  // Tolima (73)
  "Ibagué": "73001", "Espinal": "73268", "Melgar": "73449",
  "Líbano": "73411",

  // Valle del Cauca (76)
  "Cali": "76001", "Palmira": "76520", "Buenaventura": "76109",
  "Buga": "76111", "Tulúa": "76834", "Jamundí": "76364",
  "Yumbo": "76892", "Cartago": "76147", "Roldanillo": "76622",

  // Vaupés (97)
  "Mitú": "97001",

  // Vichada (99)
  "Puerto Carreño": "99001",
};
