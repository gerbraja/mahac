import React, { useState } from 'react';
import { motion } from 'framer-motion';

const generatePlaceholderChapters = (moduleId, startNum = 1) => {
  const chapters = [];
  for (let i = startNum; i <= 7; i++) {
    chapters.push({ id: `${moduleId}.${i}`, title: `Capítulo ${i}: Próximamente`, duration: "-" });
  }
  return chapters;
};

const modules = [
  {
    id: 1,
    title: "Módulo 1: Introducción",
    chapters: [
      { id: '1.1', title: "Capítulo 1: Fundamentos y Mentalidad", duration: "10 min" },
      { id: '1.2', title: "Capítulo 2: El Cliente Ideal", duration: "15 min" },
      { id: '1.3', title: "Capítulo 3: Propuesta de Valor Única", duration: "12 min" },
      { id: '1.4', title: "Capítulo 4: Canales y Nichos", duration: "15 min" },
      { id: '1.5', title: "Capítulo 5: Embudo de Ventas Simple", duration: "20 min" },
      { id: '1.6', title: "Capítulo 6: Ética y Profesionalismo", duration: "10 min" },
      { id: '1.7', title: "Capítulo 7: Plan de Acción 90 Días", duration: "25 min" }
    ]
  },
  {
    id: 2,
    title: "Módulo 2: Marca Personal",
    chapters: generatePlaceholderChapters(2)
  },
  {
    id: 3,
    title: "Módulo 3: Creación de Contenido",
    chapters: generatePlaceholderChapters(3)
  },
  {
    id: 4,
    title: "Módulo 4: Tráfico y Atracción",
    chapters: generatePlaceholderChapters(4)
  },
  {
    id: 5,
    title: "Módulo 5: Cierres Efectivos",
    chapters: generatePlaceholderChapters(5)
  },
  {
    id: 6,
    title: "Módulo 6: Fidelización",
    chapters: generatePlaceholderChapters(6)
  },
  {
    id: 7,
    title: "Módulo 7: Escalamiento",
    chapters: generatePlaceholderChapters(7)
  }
];

const DigitalMarketingCourse = () => {
  const [activeChapter, setActiveChapter] = useState('1.1');
  const [expandedModule, setExpandedModule] = useState(1);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 gap-6 p-4">
      
      {/* Sidebar - Course Outline */}
      <div className="w-full md:w-80 bg-white shadow-xl rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 flex flex-col md:h-[calc(100vh-8rem)] md:sticky md:top-24">
        <div className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <h2 className="text-2xl font-bold mb-2">📱 Marketing Digital Elite</h2>
          <div className="w-full bg-white/20 rounded-full h-2 mb-2">
            <div className="bg-white h-2 rounded-full" style={{ width: '5%' }}></div>
          </div>
          <p className="text-sm font-medium opacity-90">Progreso: 5% completado</p>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {modules.map((mod) => (
            <div key={mod.id} className="border border-slate-100 rounded-xl overflow-hidden">
              <button 
                onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                className={`w-full text-left px-5 py-4 font-bold transition-colors ${expandedModule === mod.id ? 'bg-orange-50 text-orange-700' : 'bg-white hover:bg-slate-50 text-slate-700'}`}
              >
                <div className="flex justify-between items-center">
                  <span>{mod.title}</span>
                  <span className={`transform transition-transform ${expandedModule === mod.id ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </button>
              
              <div className={`transition-all duration-300 overflow-hidden ${expandedModule === mod.id ? 'max-h-96' : 'max-h-0'}`}>
                {mod.chapters.map(chap => (
                  <button
                    key={chap.id}
                    onClick={() => setActiveChapter(chap.id)}
                    className={`w-full text-left px-6 py-3 border-t border-slate-100 transition-colors flex justify-between items-center
                      ${activeChapter === chap.id ? 'bg-orange-500 text-white' : 'hover:bg-orange-50 text-slate-600'}
                    `}
                  >
                    <span className="text-sm font-medium">{chap.title}</span>
                    <span className={`text-xs ${activeChapter === chap.id ? 'text-orange-200' : 'text-slate-400'}`}>{chap.duration}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white shadow-xl rounded-2xl p-6 md:p-10 border border-slate-100">
        {activeChapter === '1.1' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-8">
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 font-bold rounded-full text-sm mb-4">
                Módulo 1 • Capítulo 1
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                Fundamentos y Mentalidad de un Marketer Élite
              </h1>
              <p className="text-xl text-slate-500 font-light">
                Bienvenido a la revolución. Para dominar el mercado digital, primero debes dominar tu mente y las bases que construyen negocios de alto impacto.
              </p>
            </div>

            {/* Espacio para video removido temporalmente */}

            {/* Course Content Area - Enhanced Copywriting */}
            <div className="prose prose-lg max-w-none text-slate-700">
              
              {/* Intro Section */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl mb-12 text-white">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400 mb-6 mt-0">
                  Tu Camino al Profesionalismo 🚀
                </h2>
                <p className="text-lg text-slate-300 leading-relaxed mb-6">
                  Estás exactamente donde debes estar. En <strong>Tu Empresa Internacional (TEI)</strong> estamos construyendo el futuro del comercio electrónico y el network marketing. En el próximo año, nuestro catálogo superará los <strong>1,000 productos de consumo masivo</strong>. Esa es tu ventaja injusta: un negocio real, con productos reales.
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="text-3xl mb-3">⚡</div>
                    <h4 className="text-lg font-bold text-white m-0 mb-2">Acción Masiva Diaria</h4>
                    <p className="text-sm text-slate-400 m-0 leading-tight">La regla de oro: Realiza un contacto nuevo cada día. La consistencia vence al talento.</p>
                  </div>
                  <div className="bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="text-3xl mb-3">🔓</div>
                    <h4 className="text-lg font-bold text-white m-0 mb-2">Cero Barreras</h4>
                    <p className="text-sm text-slate-400 m-0 leading-tight">Sin paquetes obligatorios ni cuotas ocultas de ingreso. Democratizamos la riqueza empresarial.</p>
                  </div>
                  <div className="bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <div className="text-3xl mb-3">💎</div>
                    <h4 className="text-lg font-bold text-white m-0 mb-2">Crecimiento Orgánico</h4>
                    <p className="text-sm text-slate-400 m-0 leading-tight">Cualquier persona puede registrarse gratis y empezar a generar ingresos libremente.</p>
                  </div>
                </div>
              </div>

              {/* The 7 Invisible Assets */}
              <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b-2 border-orange-500 pb-2 inline-block">
                Los 7 Activos Invisibles: Tu Verdadera Riqueza
              </h2>
              <div className="mb-10 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 bg-black">
                <img src="/course_assets/assets_7_invisible.png" alt="Los 7 Activos Invisibles" className="w-full h-auto object-cover m-0 opacity-90 transition-opacity hover:opacity-100" />
              </div>

              <p className="text-xl text-slate-600 mb-10">
                La mayoría entra por el cheque a fin de mes. Pero pronto descubren que <strong>el dinero es solo una consecuencia directa de la persona en la que te conviertes</strong>. En TEI, adquieres 7 activos invaluables que ninguna universidad tradicional te enseñará jamás:
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-16">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-lg transition-all group">
                  <span className="text-4xl shadow-sm mb-4 block group-hover:scale-110 transition-transform">📚</span>
                  <h3 className="text-xl font-bold text-slate-800 m-0 mb-3">1. Educación de Negocios Real</h3>
                  <p className="text-slate-600 m-0 text-sm leading-relaxed">Aprende haciendo. Adiós a la teoría de 5 años. Descubre cómo administrar tu tiempo, perder el miedo a vender y operar un negocio real directamente desde tu celular.</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-lg transition-all group">
                  <span className="text-4xl shadow-sm mb-4 block group-hover:scale-110 transition-transform">🌱</span>
                  <h3 className="text-xl font-bold text-slate-800 m-0 mb-3">2. Desarrollo Personal Integral</h3>
                  <p className="text-slate-600 m-0 text-sm leading-relaxed">Tu cuenta bancaria nunca superará tu crecimiento personal. Enfrentarás tus miedos, destruirás hábitos estancados y forjarás una disciplina inquebrantable.</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-lg transition-all group">
                  <span className="text-4xl shadow-sm mb-4 block group-hover:scale-110 transition-transform">👑</span>
                  <h3 className="text-xl font-bold text-slate-800 m-0 mb-3">3. Liderazgo de Alto Impacto</h3>
                  <p className="text-slate-600 m-0 text-sm leading-relaxed">Liderar no es dar órdenes; es inspirar. Aprenderás a guiar con el ejemplo para que te sigan por respeto y admiración. Haz que otros cumplan sus sueños primero.</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-lg transition-all group">
                  <span className="text-4xl shadow-sm mb-4 block group-hover:scale-110 transition-transform">🤝</span>
                  <h3 className="text-xl font-bold text-slate-800 m-0 mb-3">4. Círculo de Influencia Potenciado</h3>
                  <p className="text-slate-600 m-0 text-sm leading-relaxed">Eres el promedio de las 5 personas con las que te juntas. Aquí te unes a una tribu de emprendedores positivos, hambrientos de éxito que celebrarán tus victorias.</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-lg transition-all group">
                  <span className="text-4xl shadow-sm mb-4 block group-hover:scale-110 transition-transform">🛡️</span>
                  <h3 className="text-xl font-bold text-slate-800 m-0 mb-3">5. Inteligencia Emocional Táctica</h3>
                  <p className="text-slate-600 m-0 text-sm leading-relaxed">Te dirán que "no". Muchas veces. Te enseñamos a blindar tu mente: no te tomes el rechazo como algo personal y mantén tu enfoque inquebrantable ante la dificultad.</p>
                </div>
                <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-orange-500 hover:shadow-lg transition-all group">
                  <span className="text-4xl shadow-sm mb-4 block group-hover:scale-110 transition-transform">🎙️</span>
                  <h3 className="text-xl font-bold text-slate-800 m-0 mb-3">6. Comunicación y Persuasión</h3>
                  <p className="text-slate-600 m-0 text-sm leading-relaxed">Saber hablar y escuchar es el arma de los grandes. Vas a perder el miedo al público, a las cámaras, y conectarás genuinamente con las verdaderas necesidades emocionales de tus prospectos.</p>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 p-6 rounded-2xl hover:shadow-lg transition-all md:col-span-2 group">
                  <span className="text-4xl shadow-sm mb-4 block group-hover:scale-110 transition-transform">📈</span>
                  <h3 className="text-xl font-bold text-orange-900 m-0 mb-3">7. Inteligencia Financiera: El Apalancamiento</h3>
                  <p className="text-orange-800 m-0 text-sm leading-relaxed">Te quitamos el chip de intercambiar tiempo por dinero. Entenderás cómo hacer que un sistema inteligente trabaje por ti, multiplicando tus ingresos sin tener que agotar tu vida en 80 horas a la semana. Libertad real.</p>
                </div>
              </div>

              {/* El Cuadrante y Construcción de Activo */}
              <div className="bg-orange-50 p-8 rounded-3xl mb-16 border border-orange-200">
                <h2 className="text-3xl font-bold text-orange-900 mb-6 mt-0">El Cuadrante del Flujo y la Verdadera Riqueza</h2>
                
                <div className="mb-10 rounded-3xl overflow-hidden shadow-2xl border border-orange-300 bg-black">
                  <img src="/course_assets/wealth_quadrant.png" alt="El Salto a la Verdadera Riqueza" className="w-full h-auto object-cover m-0 opacity-90 transition-opacity hover:opacity-100" />
                </div>
                <div className="grid md:grid-cols-2 gap-10 items-center">
                  <div>
                    <h3 className="text-xl font-bold text-orange-800 mb-4">La Diferencia Entre Salario y Riqueza</h3>
                    <p className="text-orange-900/80 mb-4">
                      El Padre Pobre decía: <em>"Trabaja por un empleo seguro."</em><br/>
                      El Padre Rico decía: <strong>"Construye sistemas y activos."</strong>
                    </p>
                    <p className="text-orange-900/80">
                      Un activo te pone dinero en el bolsillo sin importar si estás trabajando o descansando en la playa. El Network Marketing con TEI te ayuda a construir ese activo de forma escalable. 
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm text-center">
                      <span className="block font-bold text-3xl text-slate-300 mb-1">E</span>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Empleado</span>
                      <p className="text-[11px] text-slate-400 mt-2 leading-tight">Trabaja por salario</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm text-center">
                      <span className="block font-bold text-3xl text-slate-300 mb-1">A</span>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Autoempleado</span>
                      <p className="text-[11px] text-slate-400 mt-2 leading-tight">Trabaja por su cuenta</p>
                    </div>
                    <div className="bg-orange-500 p-5 rounded-xl shadow-lg border border-orange-300 text-center transform scale-105 relative z-10">
                      <span className="block font-bold text-3xl text-white mb-1">D</span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Dueño Negocio</span>
                      <p className="text-[11px] text-orange-100 mt-2 leading-tight">Construye Sistemas Operativos</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm text-center">
                      <span className="block font-bold text-3xl text-slate-300 mb-1">I</span>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inversor</span>
                      <p className="text-[11px] text-slate-400 mt-2 leading-tight">Ingresos Pasivos</p>
                    </div>
                  </div>
                </div>
                
                <blockquote className="border-l-4 border-orange-500 pl-6 my-10 text-2xl italic text-orange-900 font-medium">
                  "Estoy laborando a tiempo completo en mi trabajo para sobrevivir, pero a tiempo parcial estoy construyendo mi fortuna."
                </blockquote>
                
                <div className="bg-white/60 p-5 rounded-xl text-center">
                  <p className="text-orange-900 m-0 font-medium">
                    Dedica de <strong>10 a 15 horas a la semana</strong> a tu negocio multinivel. Solo cuando tus ganancias pasivas dupliquen o tripliquen tus ingresos formales deberías saltar al emprendimiento de tiempo completo.
                  </p>
                </div>
              </div>

              {/* Legalidad y Fórmula */}
              <div className="mb-10 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 bg-black">
                <img src="/course_assets/tei_shield_posture.png" alt="Postura y Legalidad Absoluta" className="w-full h-auto object-cover m-0 opacity-90 transition-opacity hover:opacity-100" />
              </div>

              <div className="grid md:grid-cols-2 gap-12 mb-16">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">
                    Legalidad Absoluta: TEI vs Pirámide
                  </h2>
                  <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-600 font-bold text-xl">✓</div>
                      <div>
                        <h4 className="font-bold text-slate-800 m-0">TEI (Multinivel Legal)</h4>
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">Sustentada en la venta real de productos tangibles. Empresa con NIT 902045325-4, localizable y operando fielmente bajo la estricta <strong>Ley 1700 de 2013 de Colombia</strong>.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start mt-4">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600 font-bold text-xl">✗</div>
                      <div>
                        <h4 className="font-bold text-slate-800 m-0">Esquemas Piramidales (Estafa)</h4>
                        <p className="text-sm text-slate-600 mt-2 leading-relaxed">Insostenibles. Ganancias derivadas únicamente del reclutamiento. Sin productos de verdad. Sedes falsas "en la nube" y en paraísos fiscales.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b-2 border-slate-200 pb-2">
                    Expansión: La Fórmula 1 / 2 / 3 / 5
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="bg-slate-800 text-white font-bold w-16 text-center py-2 rounded-lg text-lg">1 Año</div>
                      <span className="text-slate-700 font-medium">Te vuelves competente, dominas las herramientas y pierdes el miedo.</span>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="bg-slate-800 text-white font-bold w-16 text-center py-2 rounded-lg text-lg">2 Años</div>
                      <span className="text-slate-700 font-medium">Logras ganar dinero estable para trabajar de tiempo completo en ti.</span>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="bg-slate-800 text-white font-bold w-16 text-center py-2 rounded-lg text-lg">3 Años</div>
                      <span className="text-slate-700 font-medium">Alcanzas cifras extraordinarias. Construyes fortuna.</span>
                    </div>
                    <div className="flex items-center gap-4 bg-orange-100 p-4 rounded-xl border border-orange-200 shadow-sm transform hover:scale-105 transition-transform">
                      <div className="bg-orange-500 text-white font-bold w-16 text-center py-2 rounded-lg text-xl flex flex-col pt-1"><span className="text-xs">MÁS DE</span>5 Años</div>
                      <span className="text-orange-900 font-bold text-lg">Te conviertes en la máxima Autoridad y Experto Internacional del sector.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reto del Módulo */}
              <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-[2rem] p-10 md:p-14 text-center shadow-[0_10px_40px_rgba(234,88,12,0.3)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8 relative z-10 leading-tight drop-shadow-md">
                  El Reto: Reclama tu Posición
                </h2>
                <div className="text-xl text-orange-50 max-w-4xl mx-auto space-y-6 relative z-10 font-medium leading-relaxed">
                  <p className="italic bg-black/10 p-6 rounded-2xl border-l-4 border-orange-300">
                    "El futuro del Network Marketing ya llegó y tiene nombre: <strong>Tu Empresa Internacional (TEI)</strong>. No somos una red más; somos la disrupción tecnológica y humana que va a reescribir las reglas del juego para siempre."
                  </p>
                  
                  <div className="py-8">
                    <p className="text-4xl text-white font-black drop-shadow-lg">
                      ¿A cuántas personas quieres ayudar cada día?
                    </p>
                    <p className="text-orange-200 text-lg mt-4 uppercase tracking-widest font-bold">
                      Tú puedes bendecir a tantas familias como decidas.
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6 text-left mt-8">
                    <div className="bg-black/30 p-8 rounded-2xl backdrop-blur-md border border-white/10 hover:border-orange-400 transition-colors">
                      <h4 className="text-white font-bold text-2xl mb-3 flex items-center gap-2">🛑 Cero Rogar</h4>
                      <p className="text-orange-100 m-0 leading-relaxed font-light">Se acabó perseguir suplicando. Tú decides a quién ayudar. Cambia tu frecuencia de mendigo a un profesional corporativo.</p>
                    </div>
                    <div className="bg-black/30 p-8 rounded-2xl backdrop-blur-md border border-white/10 hover:border-orange-400 transition-colors">
                      <h4 className="text-white font-bold text-2xl mb-3 flex items-center gap-2">⚡ Cero Fricción</h4>
                      <p className="text-orange-100 m-0 leading-relaxed font-light">No les creas hábitos de gasto nuevos. Les muestras dónde generar dinero inteligentemente consumiendo lo que <em>ya</em> compran mensualmente.</p>
                    </div>
                    <div className="bg-black/30 p-8 rounded-2xl backdrop-blur-md border border-white/10 hover:border-orange-400 transition-colors">
                      <h4 className="text-white font-bold text-2xl mb-3 flex items-center gap-2">🕴️ Tu Postura</h4>
                      <p className="text-orange-100 m-0 leading-relaxed font-light">Eres el empresario que les muestra cómo dejar de enriquecer al sistema y cómo tomar el control directo de su riqueza.</p>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>

            {/* Navigation Buttons */}
            <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
              <button disabled className="px-6 py-3 font-semibold text-slate-400 bg-slate-100 rounded-xl cursor-not-allowed">
                ← Capítulo Anterior
              </button>
              <button onClick={() => setActiveChapter('1.2')} className="px-6 py-3 font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-xl hover:shadow-lg hover:scale-105 transition-all">
                Siguiente Capítulo →
              </button>
            </div>

          </motion.div>
        )}

        {activeChapter === '1.2' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-8">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-sm mb-4">
                Módulo 1 • Capítulo 2
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                El Cliente Ideal (Avatar) 🎯
              </h1>
              <p className="text-xl text-slate-500 font-light">
                Si le intentas vender a todo el mundo, no le vendes a nadie. Define a quién le hablas y tus ventas se dispararán.
              </p>
            </div>

            <div className="prose prose-lg max-w-none text-slate-700">
              
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 rounded-3xl text-white mb-12 shadow-xl">
                <h2 className="text-2xl font-bold mb-4 mt-0">¿Qué es un Buyer Persona?</h2>
                <p className="text-lg opacity-90 m-0">Es una representación semi-ficticia de tu cliente ideal, construida a partir de datos reales y especulaciones informadas sobre sus datos demográficos, comportamientos, motivaciones y objetivos. <strong>El buyer persona no se inventa, se descubre.</strong></p>
              </div>


              <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 bg-black">
                <img src="/course_assets/buyer_persona_discovery.png" alt="Descubriendo al Buyer Persona" className="w-full h-auto object-cover opacity-90 m-0 hover:opacity-100 transition-opacity" />
              </div>

              <div className="bg-white p-8 rounded-3xl mb-12 border border-slate-100 shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 mt-0">1. La Fase de Investigación (Preguntas Clave)</h2>
                <p className="mb-6">El mejor antídoto para no saber a quién le hablas es investigar a fondo haciendo preguntas a tus seguidores, clientes actuales, o personas relacionadas con tu industria. Debes responder con total claridad:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex gap-3 items-start"><span className="text-blue-500 font-bold">✓</span><span className="text-sm">¿Quién es mi cliente ideal?</span></div>
                  <div className="flex gap-3 items-start"><span className="text-blue-500 font-bold">✓</span><span className="text-sm">¿Qué retos o frustraciones está enfrentando hoy en su vida o negocio?</span></div>
                  <div className="flex gap-3 items-start"><span className="text-blue-500 font-bold">✓</span><span className="text-sm">¿Por qué ese reto le afecta y dónde suele buscar ayuda externa?</span></div>
                  <div className="flex gap-3 items-start"><span className="text-blue-500 font-bold">✓</span><span className="text-sm">¿Por qué no lo puede solucionar él mismo?</span></div>
                  <div className="flex gap-3 items-start"><span className="text-blue-500 font-bold">✓</span><span className="text-sm">¿Qué pierde si sigue con este problema y qué gana si lo soluciona?</span></div>
                  <div className="flex gap-3 items-start"><span className="text-blue-500 font-bold">✓</span><span className="text-sm">¿Cuáles serían sus excusas u objeciones al momento de comprarte?</span></div>
                </div>
              </div>

              <div className="bg-red-50 p-8 rounded-3xl mb-12 border border-red-200">
                <h2 className="text-2xl font-bold text-red-900 mb-4 mt-0">2. El Error de Suponer sin Validar 🤦‍♂️</h2>
                <p className="text-red-800 m-0">Un buen vendedor jamás debe suponer lo que el cliente necesita; primero debe investigar. Muchos cometen el terrible error de enviar mensajes asumiendo el dolor de la persona (ej. <em>"¿Estás quebrado? Aquí tienes un negocio"</em> o recordarles sobrepeso). Eso es ofensivo y demuestra que el vendedor se enfoca en su urgencia por vender, no en el cliente. Descubrir a tu Buyer Persona significa entender su situación real para ofrecerle una solución con empatía.</p>
              </div>

              <div className="bg-indigo-50 p-8 rounded-3xl mb-16 border border-indigo-200">
                <h2 className="text-2xl font-bold text-indigo-900 mb-4 mt-0">3. Apelar a su Único y Mayor Dolor o Deseo 🎯</h2>
                <p className="text-indigo-800 mb-6 mt-0">Una vez que has investigado y descubierto quién es tu cliente y qué le frustra, tu comunicación debe enfocarse en apelar a esa emoción. Si abordas directamente esa frustración emocional, el prospecto sentirá que le lees la mente.</p>
                
                <div className="grid md:grid-cols-2 gap-8 mt-6">
                  <div>
                    <h3 className="text-xl font-bold text-indigo-900 mt-0 mb-4 flex items-center gap-2"><span>⚡</span> Su Mayor Dolor</h3>
                    <ul className="space-y-3 m-0 p-0 list-none">
                      <li className="flex gap-2"><span className="text-red-500">❌</span> <span className="text-indigo-900 text-sm">Falta de tiempo libre (100% atrapado).</span></li>
                      <li className="flex gap-2"><span className="text-red-500">❌</span> <span className="text-indigo-900 text-sm">Estrés e inseguridad por el futuro de su familia.</span></li>
                      <li className="flex gap-2"><span className="text-red-500">❌</span> <span className="text-indigo-900 text-sm">Problemas específicos (Ej: "Mi bebé no para de llorar").</span></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-indigo-900 mt-0 mb-4 flex items-center gap-2"><span>🌟</span> Su Gran Deseo</h3>
                    <ul className="space-y-3 m-0 p-0 list-none">
                      <li className="flex gap-2"><span className="text-green-500">✅</span> <span className="text-indigo-900 text-sm">Libertad emocional, geográfica y financiera.</span></li>
                      <li className="flex gap-2"><span className="text-green-500">✅</span> <span className="text-indigo-900 text-sm">Proveer educación y legado a sus hijos.</span></li>
                      <li className="flex gap-2"><span className="text-green-500">✅</span> <span className="text-indigo-900 text-sm">Ser reconocido y sentir tranquilidad permanente.</span></li>
                    </ul>
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b-2 border-blue-500 pb-2 inline-block">Mapa de Empatía</h2>
              
              <div className="mb-10 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
                <img src="/course_assets/empathy_map.png" alt="Mapa de Empatía Holográfico" className="w-full h-auto object-cover opacity-90 m-0 hover:opacity-100 transition-opacity" />
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-16 text-left">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  <span className="text-3xl">👀</span>
                  <h4 className="font-bold text-slate-900 m-0">¿Qué ve?</h4>
                  <p className="text-sm text-slate-500 m-0">Su entorno, las ofertas de la competencia, problemas en el mercado tradicional, lo que hacen prospectos exitosos.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  <span className="text-3xl">👂</span>
                  <h4 className="font-bold text-slate-900 m-0">¿Qué escucha?</h4>
                  <p className="text-sm text-slate-500 m-0">Lo que dice su familia, los medios y la presión constante por falta de tiempo y dinero.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  <span className="text-3xl">🧠</span>
                  <h4 className="font-bold text-slate-900 m-0">¿Qué piensa y siente?</h4>
                  <p className="text-sm text-slate-500 m-0">Frustración por sus deudas, miedos ocultos e inseguridades al arrancar un nuevo modelo de negocio.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                  <span className="text-3xl">🗣</span>
                  <h4 className="font-bold text-slate-900 m-0">¿Qué dice y hace?</h4>
                  <p className="text-sm text-slate-500 m-0">Su actitud en público frente a las deudas, sus quejas diarias versus la acción real que toma ante las oportunidades.</p>
                </div>
              </div>

              <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-xl overflow-hidden relative">
                <h2 className="text-2xl font-bold text-blue-400 mb-6 mt-0 relative z-10">4. Vender Beneficios, no Características 🎁</h2>
                <p className="text-slate-300 mb-8 relative z-10">Las personas no compran tu producto o servicio en sí, sino lo que ese producto puede <strong>hacer por ellos</strong>. Divide tu oferta en dos partes:</p>
                <div className="grid md:grid-cols-2 gap-6 relative z-10 mb-10">
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
                    <h4 className="text-white m-0 tracking-wide font-bold">🛠️ La Característica</h4>
                    <p className="text-sm text-slate-300 mt-2 m-0">Descripción objetiva y técnica de lo que ofreces. (Ej: <em>"Es un negocio desde casa 100% digital."</em>)</p>
                  </div>
                  <div className="bg-blue-600/20 p-5 rounded-2xl border border-blue-400/30 backdrop-blur-sm">
                    <h4 className="text-blue-300 m-0 tracking-wide font-bold">✨ El Beneficio Real</h4>
                    <p className="text-sm text-slate-200 mt-2 m-0">Lo que el producto soluciona para el cliente. (Ej: <em>"Podrás pasar más tiempo viendo crecer a tus hijos y no estar atado a una oficina."</em>)</p>
                  </div>
                </div>
                
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700 w-full relative z-10">
                  <img src="/course_assets/benefits_vs_features.png" alt="Características vs Beneficios" className="w-full h-auto mt-0 mb-0 opacity-90 hover:opacity-100 transition-opacity" />
                </div>
              </div>

            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
              <button onClick={() => setActiveChapter('1.1')} className="px-6 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">
                ← Anterior
              </button>
              <button onClick={() => setActiveChapter('1.3')} className="px-6 py-3 font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl hover:shadow-lg hover:scale-105 transition-all">
                Siguiente →
              </button>
            </div>
          </motion.div>
        )}

        {activeChapter === '1.3' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-8">
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 font-bold rounded-full text-sm mb-4">
                Módulo 1 • Capítulo 3
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                Propuesta de Valor Única: ¿Por qué tú? 💎
              </h1>
              <p className="text-xl text-slate-500 font-light">
                En un mar de opciones, tu PVU es el faro que atrae a los clientes correctos. Aprende a diferenciarte del resto.
              </p>
            </div>

            <div className="prose prose-lg max-w-none text-slate-700">
              
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-8 rounded-3xl text-white mb-12 shadow-xl">
                <h2 className="text-2xl font-bold mb-4 mt-0">El Síndrome del "Yo También"</h2>
                <p className="text-lg opacity-90 m-0">En el mundo del E-commerce y el Social Selling, el mayor enemigo es la <strong>comoditización</strong>. Si vendes lo mismo que otros 10,000 distribuidores, de la misma manera, tu única opción es competir por precio. Tu Propuesta de Valor Única (PVU) es la cura para este síndrome. Es el ADN de tu marca.</p>
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b-2 border-orange-500 pb-2 inline-block">1. La Fórmula de la Diferenciación</h2>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mb-12">
                <p className="mb-6 mt-0">Tu producto es el vehículo. Tu PVU es la experiencia de viaje y el destino que prometes. No es "Qué vendes", es "Cómo transformas".</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <h4 className="text-slate-500 font-bold m-0 mb-2">Vendedor Común ❌</h4>
                    <p className="text-sm m-0">"Vendo un suplemento de colágeno." <em>(Enfoque en el producto)</em></p>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
                    <h4 className="text-orange-600 font-bold m-0 mb-2">Emprendedor TEI ✅</h4>
                    <p className="text-sm m-0">"Ayudo a mujeres profesionales de más de 40 años a recuperar la confianza en su piel en 30 días con tecnología de absorción superior." <em>(Enfoque en la transformación)</em></p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-orange-100/50 rounded-xl text-center border border-orange-200 font-mono text-sm font-bold text-orange-900">
                  PVU = Producto + Tu Toque Único (Cómo) + Beneficio Emocional (Por Qué)
                </div>
              </div>

              <div className="mb-16 rounded-3xl overflow-hidden shadow-xl border border-slate-100">
                <img src="/course_assets/lighthouse.png" alt="El Faro de la PVU" className="w-full h-auto object-cover m-0" />
                <div className="p-4 bg-slate-900 text-slate-300 text-sm text-center italic m-0">
                  "Tu PVU es el faro magnético que guía a tu cliente ideal entre un mar de opciones idénticas."
                </div>
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b-2 border-orange-500 pb-2 inline-block">2. El Círculo Dorado aplicado a TEI</h2>
              <p className="mb-8">Para liderar, debes invertir el pensamiento tradicional. No vendas de afuera hacia adentro (Qué → Cómo → Por qué). Vende de adentro hacia afuera:</p>

              <div className="grid md:grid-cols-3 gap-6 mb-16 text-center">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-orange-500 transition-colors">
                  <div className="w-12 h-12 bg-slate-800 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl relative z-10 transition-transform group-hover:scale-110">1</div>
                  <h4 className="font-bold text-slate-900 relative z-10">¿Por qué?</h4>
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 relative z-10">Tu Propósito</p>
                  <p className="text-sm text-slate-500 leading-tight relative z-10 m-0">La gente no compra tu producto, compra tu visión. "Hago esto porque pasé años sin tiempo para mi familia..."</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-orange-500 transition-colors">
                  <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl relative z-10 transition-transform group-hover:scale-110">2</div>
                  <h4 className="font-bold text-slate-900 relative z-10">¿Cómo?</h4>
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 relative z-10">Tu Proceso</p>
                  <p className="text-sm text-slate-500 leading-tight relative z-10 m-0">El sistema educativo TEI y tu acompañamiento. Eres un guía, no solo un vendedor de productos.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-orange-500 transition-colors">
                  <div className="w-12 h-12 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl relative z-10 transition-transform group-hover:scale-110">3</div>
                  <h4 className="font-bold text-slate-900 relative z-10">¿Qué?</h4>
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-3 relative z-10">El Resultado</p>
                  <p className="text-sm text-slate-500 leading-tight relative z-10 m-0">El vehículo. Un ecosistema e-commerce de +1,000 productos y la oportunidad de negocio multilineal.</p>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b-2 border-orange-500 pb-2 inline-block">3. Los 4 Pilares Innegociables</h2>
              <p className="mb-6">Para empoderarte, debes entender la fuerza de la plataforma que te respalda. Estos son tus "ases bajo la manga":</p>
              
              <div className="bg-orange-50 p-8 rounded-3xl mb-12 border border-orange-200">
                <ul className="grid md:grid-cols-2 gap-6 m-0 p-0 list-none">
                  <li className="bg-white p-6 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform">
                    <span className="text-3xl block mb-2">🚀</span>
                    <h4 className="font-bold text-slate-800 m-0 mb-1">Tecnología Propia</h4>
                    <p className="text-sm text-slate-500 m-0">No dependemos de terceros. Estabilidad brutal y velocidad lista para escalar mundialmente.</p>
                  </li>
                  <li className="bg-white p-6 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform">
                    <span className="text-3xl block mb-2">🌍</span>
                    <h4 className="font-bold text-slate-800 m-0 mb-1">Expansión Real</h4>
                    <p className="text-sm text-slate-500 m-0">Puedes vender y globalizar tu negocio legítimamente desde el día uno.</p>
                  </li>
                  <li className="bg-white p-6 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform">
                    <span className="text-3xl block mb-2">🛡️</span>
                    <h4 className="font-bold text-slate-800 m-0 mb-1">Legalidad Transparente</h4>
                    <p className="text-sm text-slate-500 m-0">NIT 902045325-4. Es tu escudo de confianza incuestionable en el mercado moderno.</p>
                  </li>
                  <li className="bg-white p-6 rounded-2xl shadow-sm hover:-translate-y-1 transition-transform">
                    <span className="text-3xl block mb-2">🛒</span>
                    <h4 className="font-bold text-slate-800 m-0 mb-1">+1,001 Productos</h4>
                    <p className="text-sm text-slate-500 m-0">Tienes un centro comercial global en tus manos con versatilidad contra cualquier crisis.</p>
                  </li>
                </ul>
              </div>

              <div className="mb-16 rounded-3xl overflow-hidden shadow-xl border border-slate-100">
                <img src="/course_assets/ecosystem.png" alt="Ecosistema TEI" className="w-full h-auto object-cover m-0" />
                <div className="p-4 bg-slate-900 text-slate-300 text-sm text-center italic m-0">
                  "El Ecosistema Educativo y Tecnológico TEI trabajando a tu favor."
                </div>
              </div>

            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
              <button onClick={() => setActiveChapter('1.2')} className="px-6 py-3 font-bold text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all">
                ← Anterior
              </button>
              <button onClick={() => setActiveChapter('1.4')} className="px-6 py-3 font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-xl hover:shadow-lg hover:scale-105 transition-all">
                Siguiente →
              </button>
            </div>
          </motion.div>
        )}

        {activeChapter === '1.4' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-8">
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 font-bold rounded-full text-sm mb-4">
                Módulo 1 • Capítulo 4
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                Canales Digitales y Selección de Nicho 📱
              </h1>
              <p className="text-xl text-slate-500 font-light">
                No necesitas estar en todas partes, necesitas estar donde está tu cliente ideal. Descubre tu canal perfecto.
              </p>
            </div>

            <div className="prose prose-lg max-w-none text-slate-700">
              
              <div className="grid md:grid-cols-2 gap-10 mb-12">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <h3 className="text-2xl font-bold text-slate-900 m-0 mb-4">Seleccionando tu Nicho</h3>
                  <p className="text-slate-600 leading-relaxed mb-6">Un nicho es un segmento específico del mercado. Cuanto más específico sea, más fácil será convertirte en autoridad.</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold bg-orange-50 p-2 rounded-lg text-orange-700">🎯 Nicho Salud y Bienestar</div>
                    <div className="flex items-center gap-2 text-sm font-semibold bg-orange-50 p-2 rounded-lg text-orange-700">🎯 Nicho Emprendimiento Joven</div>
                    <div className="flex items-center gap-2 text-sm font-semibold bg-orange-50 p-2 rounded-lg text-orange-700">🎯 Nicho Cosmética Orgánica</div>
                  </div>
                </div>
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                  <h3 className="text-2xl font-bold text-slate-900 m-0 mb-4">Los 3 Grandes Canales</h3>
                  <ul className="space-y-4 m-0 p-0 list-none text-sm">
                    <li className="flex gap-3">
                      <span className="text-xl">📸</span>
                      <div><strong>Instagram:</strong> Visual, ideal para marca personal, estilo de vida y productos físicos.</div>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-xl">🎬</span>
                      <div><strong>TikTok:</strong> Alcance masivo orgánico, ideal para viralizar productos y retos rápidos.</div>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-xl">👥</span>
                      <div><strong>Facebook:</strong> Comunidades y grupos, ideal para públicos +35 y ventas locales.</div>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-8 rounded-3xl text-white shadow-xl mb-16">
                <h3 className="text-2xl font-bold mb-2 mt-0">Regla de Oro: Enfoque 80/20</h3>
                <p className="text-lg opacity-90 mb-0">Dedica el <strong>80% de tu esfuerzo</strong> a un solo canal principal y el 20% a un secundario. Domina una plataforma antes de expandirte a otras.</p>
              </div>

              <hr className="border-slate-200 my-16" />

              <div className="text-center mb-12">
                <span className="inline-block px-3 py-1 bg-cyan-100 text-cyan-800 font-bold rounded-full text-sm mb-4">
                  Masterclass: Creación de Contenido Orgánico
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 m-0">La Fórmula de 3 Pasos para Videos Virales 🚀</h2>
                <p className="text-xl text-slate-500 mt-4 max-w-2xl mx-auto">
                  El video corto es el rey. Pero si prendes la cámara para decir "¡Cómprame esto!", tendrás cero vistas. En TEI usamos el <strong>Marketing de Curiosidad</strong>.
                </p>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-2xl mb-12">
                <h4 className="text-amber-900 font-bold m-0 flex items-center gap-2"><span>⚠️</span> Regla de Oro TEI</h4>
                <p className="text-amber-800 text-sm mt-2 m-0">El objetivo de un video corto <strong>NO es explicar el plan de compensación</strong> ni detallar todos los ingredientes del producto. El objetivo es generar tanta curiosidad que la persona tenga que comentar o hacer clic en tu enlace. ¡Nunca digas el nombre exacto de la empresa en el video! Deja que te pregunten.</p>
              </div>

              <div className="mb-16 rounded-3xl overflow-hidden shadow-xl border border-slate-100">
                <img src="/course_assets/viral_video.png" alt="Anatomía de un Video Viral" className="w-full h-auto object-cover m-0" />
                <div className="p-4 bg-slate-900 text-slate-300 text-sm text-center m-0">
                  La estructura magnética que utilizan los Top Earners.
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-8 border-b-2 border-cyan-500 pb-2 inline-block">La Fórmula Secreta</h3>
              
              <div className="space-y-6 mb-16">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0">1</div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 m-0 mb-2">El Gancho <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">(Primeros 3 segs)</span></h4>
                    <p className="m-0 text-slate-600">Es la frase inicial. Si no capturas su atención aquí, harán scroll. Debe tocar un dolor o prometer un secreto.</p>
                    <div className="mt-3 text-sm flex flex-col gap-2">
                      <span className="text-red-500">❌ <strong>Débil:</strong> "Hola chicos, hoy les quiero hablar de mi negocio."</span>
                      <span className="text-green-600">✅ <strong>TEI:</strong> "¿Sabías que llevas años regalándole tu dinero a los supermercados? Te explico por qué."</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-16 h-16 bg-cyan-500 text-white rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0">2</div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 m-0 mb-2">El Cuerpo / Historia <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">(15 a 30 segs)</span></h4>
                    <p className="m-0 text-slate-600">Aquí entregas el valor. Cuentas tu transformación o explicas cómo resolviste un problema. Sé rápido, enérgico y habla como si estuvieras charlando con un amigo.</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-16 h-16 bg-slate-900 text-cyan-400 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0">3</div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 m-0 mb-2">El Llamado a la Acción (CTA) <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">(Últimos 5 segs)</span></h4>
                    <p className="m-0 text-slate-600">Nunca termines el video sin dar instrucciones claras. Dile a la gente exactamente qué hacer a continuación.</p>
                    <div className="mt-3 text-sm p-3 bg-slate-50 rounded-lg text-slate-700 italic border border-slate-200">
                      "Si quieres saber cómo lo hago, comenta la palabra SISTEMA y te envío la info."
                    </div>
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-8">Guiones "Copia y Pega" para Grabar Hoy 📝</h3>
              <div className="grid md:grid-cols-2 gap-6 mb-16">
                <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
                  <h4 className="text-green-800 font-bold m-0 mb-4 flex items-center gap-2"><span>🛍️</span> Avatar 1: Clientes y Consumo</h4>
                  <p className="text-sm text-slate-700 mb-3"><strong>[Gancho]</strong> "Tres cosas que dejé de hacer para mejorar mi energía, y la última me está ahorrando muchísimo dinero."</p>
                  <p className="text-sm text-slate-700 mb-3"><strong>[Cuerpo]</strong> "Uno: Dejé de consumir azúcar. Dos: Tomo más agua. Y tres: Dejé de comprar suplementos en cadenas donde me cobran un montón de impuestos. Descubrí cómo comprar nutrición celular directo del fabricante."</p>
                  <p className="text-sm text-slate-700"><strong>[CTA]</strong> "Si quieres aprender a comprar directo de fábrica como yo, ve al link de mi perfil o comenta INFO."</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                  <h4 className="text-blue-800 font-bold m-0 mb-4 flex items-center gap-2"><span>💼</span> Avatar 2: Visionarios y Negocio</h4>
                  <p className="text-sm text-slate-700 mb-3"><strong>[Gancho]</strong> "¿Te has dado cuenta de que estás haciendo el negocio perfecto, pero para alguien más?"</p>
                  <p className="text-sm text-slate-700 mb-3"><strong>[Cuerpo]</strong> "Llevas años recomendando marcas y comprando en supers, pero esas cadenas se quedan con la ganancia. Yo decidí cambiar las reglas. Me uní a un ecosistema donde elimino intermediarios, consumo directo y me pagan comisiones a mi banco por enseñar a otros."</p>
                  <p className="text-sm text-slate-700"><strong>[CTA]</strong> "Monetiza tus gastos. Si estás abierto a escuchar cómo funciona este ecosistema, comenta EQUIPO y te envío un video."</p>
                </div>
              </div>

              <div className="mb-16 rounded-3xl overflow-hidden shadow-xl border border-slate-100 flex flex-col md:flex-row items-stretch">
                <div className="w-full md:w-2/5 shrink-0">
                  <img src="/course_assets/recording.png" alt="Emprendedor Grabando" className="w-full h-full object-cover m-0" />
                </div>
                <div className="p-8 bg-slate-900 text-white flex flex-col justify-center">
                  <h4 className="text-2xl font-bold text-orange-400 m-0 mb-4">🏆 Tu Reto de Hoy: ¡Acción y Cámara!</h4>
                  <p className="text-slate-300 text-sm mb-4">El miedo a la cámara solo se quita grabando. No busques la perfección, busca la conexión. El dinero ama la velocidad.</p>
                  <ul className="text-sm text-slate-300 space-y-2 mb-0">
                    <li className="flex gap-2"><span>1️⃣</span> Elige uno de los guiones de arriba.</li>
                    <li className="flex gap-2"><span>2️⃣</span> Grábate 3 a 4 veces hasta que te sientas natural.</li>
                    <li className="flex gap-2"><span>3️⃣</span> Súbelo a tus Historias, Reels o TikTok.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white border-2 border-orange-500 p-8 rounded-3xl text-center">
                <p className="text-orange-900 font-medium m-0 mb-6">En la próxima lección, te enseñaremos el arte del Copywriting: Cómo escribir textos magnéticos para acompañar tus videos y fotos, logrando que la gente se detenga a leerte.</p>
                <button onClick={() => setActiveChapter('1.5')} className="inline-flex items-center gap-2 px-6 py-4 bg-orange-500 text-white font-bold rounded-2xl shadow-lg hover:bg-orange-600 hover:scale-105 transition-all">
                  <span>✅ He grabado mi primer video. Ir a la Lección 5 ➡️</span>
                </button>
              </div>

            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
              <button onClick={() => setActiveChapter('1.3')} className="px-6 py-3 font-bold text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all">
                ← Anterior
              </button>
              <button onClick={() => setActiveChapter('1.5')} className="hidden md:block px-6 py-3 font-bold text-slate-400 hover:text-orange-500 transition-all">
                Siguiente →
              </button>
            </div>
          </motion.div>
        )}

        {activeChapter === '1.5' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-8">
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 font-bold rounded-full text-sm mb-4">
                Módulo 1 • Capítulo 5
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                El Embudo de Ventas Simple: De Extraño a Socio 🌪️
              </h1>
              <p className="text-xl text-slate-500 font-light">
                Vender no es un evento, es un proceso. Entiende el camino que recorre tu prospecto antes de decir "SÍ".
              </p>
            </div>

            <div className="prose prose-lg max-w-none text-slate-700">
              
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 rounded-3xl text-white mb-12 shadow-xl border border-slate-700">
                <p className="text-xl mb-4 font-light italic text-slate-300">Bienvenido a la etapa de la profesionalización absoluta.</p>
                <p className="text-lg opacity-90 m-0">El error más costoso que cometen los distribuidores novatos es intentar que un completo desconocido en internet saque su tarjeta de crédito en el primer mensaje de WhatsApp. Grábate esto en la mente: Vender no es un evento mágico ni un golpe de suerte; es un <strong>proceso psicológico</strong>. Tienes que entender y respetar el camino que recorre tu prospecto antes de decirte que "SÍ".</p>
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b-2 border-orange-500 pb-2 inline-block">🧠 Las 4 Fases Psicológicas</h2>
              <p className="mb-8">Antes de que alguien decida unirse a tu equipo o comprar tu nutrición celular, su cerebro pasa por cuatro etapas obligatorias. No puedes saltarte ninguna:</p>
              
              <div className="grid md:grid-cols-4 gap-4 mb-16">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center hover:border-slate-400 transition-colors shadow-sm">
                  <div className="text-4xl mb-4">👀</div>
                  <h4 className="font-bold text-slate-900 m-0 mb-2 uppercase text-xs tracking-widest">Atención</h4>
                  <p className="text-sm text-slate-500 m-0 leading-tight">El prospecto está deslizando aburrido. Tu primer trabajo es hacer que se detenga y te mire.</p>
                </div>
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 text-center hover:border-orange-400 transition-colors shadow-sm">
                  <div className="text-4xl mb-4">💡</div>
                  <h4 className="font-bold text-orange-900 m-0 mb-2 uppercase text-xs tracking-widest">Interés</h4>
                  <p className="text-sm text-slate-500 m-0 leading-tight">Le hablas de un problema que él tiene (falta de dinero o energía).</p>
                </div>
                <div className="bg-orange-100 p-6 rounded-2xl border border-orange-300 text-center hover:border-orange-500 transition-colors shadow-sm">
                  <div className="text-4xl mb-4">🔥</div>
                  <h4 className="font-bold text-orange-900 m-0 mb-2 uppercase text-xs tracking-widest">Deseo</h4>
                  <p className="text-sm text-slate-600 m-0 leading-tight">Le muestras que existe una solución en TEI. Él piensa: "Yo quiero eso".</p>
                </div>
                <div className="bg-green-50 p-6 rounded-2xl border border-green-200 text-center hover:border-green-400 transition-colors shadow-sm">
                  <div className="text-4xl mb-4">💰</div>
                  <h4 className="font-bold text-green-900 m-0 mb-2 uppercase text-xs tracking-widest">Acción</h4>
                  <p className="text-sm text-slate-500 m-0 leading-tight">Le dices exactamente qué tiene que hacer para obtenerlo (clic o mensaje).</p>
                </div>
              </div>

              <div className="mb-16 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
                <img src="/course_assets/sales_funnel.png" alt="Embudo de Ventas Moderno 3D" className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity m-0" />
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b-2 border-orange-500 pb-2 inline-block">⚙️ La Anatomía del Embudo TEI</h2>
              <p className="mb-8">Ahora vamos a llevar esa psicología a la práctica. Tu embudo de ventas en TEI funciona como una máquina de 3 engranajes perfectos:</p>
              
              <div className="space-y-6 mb-16 relative">
                <div className="hidden md:block absolute left-8 top-10 bottom-10 w-0.5 bg-gradient-to-b from-slate-200 via-orange-300 to-green-300 z-0"></div>
                
                <div className="flex flex-col md:flex-row gap-6 items-start relative bg-white p-8 rounded-3xl border border-slate-100 shadow-sm z-10 hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-3xl shrink-0 shadow-inner">🪝</div>
                  <div>
                    <h4 className="font-bold text-xl text-slate-900 m-0 mb-2">1. El Gancho <span className="text-sm font-normal text-slate-500 ml-2">(Tráfico y Contenido)</span></h4>
                    <p className="text-slate-600 m-0">Este es tu alcance masivo (video corto, Reel o post educativo con Regla 80/20). Su único objetivo es que el extraño se detenga y levante la mano. Aquí no explicas el plan de pagos ni los ingredientes; aquí solo generas curiosidad explosiva.</p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 items-start relative bg-white p-8 rounded-3xl border border-slate-100 shadow-sm z-10 hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-3xl shrink-0 shadow-inner">🎁</div>
                  <div>
                    <h4 className="font-bold text-xl text-slate-900 m-0 mb-2">2. El Imán <span className="text-sm font-normal text-slate-500 ml-2">(Lead Magnet y Valor)</span></h4>
                    <p className="text-slate-600 m-0">Una vez captaste su atención, debes ofrecerle algo de altísimo valor gratis a cambio de su contacto (La Página de Captura). Los invitas a ver un video estratégico exclusivo de menos de 3 minutos donde explicas el secreto del e-commerce sin intermediarios. Pura ley de la reciprocidad.</p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 items-start relative bg-white p-8 rounded-3xl border border-slate-100 shadow-sm z-10 hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl shrink-0 shadow-inner">💬</div>
                  <div>
                    <h4 className="font-bold text-xl text-slate-900 m-0 mb-2">3. La Conversación <span className="text-sm font-normal text-slate-500 ml-2">(Cierre y Relación)</span></h4>
                    <p className="text-slate-600 m-0">El embudo ha hecho el trabajo pesado. Las personas que llegan a tu WhatsApp después de pasar por el Imán ya están "calientes". Aquí es donde generas confianza humana. Ya no tienes que convencerlos; solo resuelves dudas finales mediante un audio o Zoom, y les muestras que entrar a TEI es la pieza que les faltaba.</p>
                  </div>
                </div>
              </div>

              <div className="mb-16 rounded-3xl overflow-hidden shadow-xl border border-slate-100 flex flex-col md:flex-row items-stretch">
                <div className="w-full md:w-1/2 shrink-0">
                  <img src="/course_assets/closing_call.png" alt="Asesoría de Cierre" className="w-full h-full object-cover m-0" />
                </div>
                <div className="p-10 bg-slate-900 text-white flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-orange-400 m-0 mb-6">🏆 La Regla de Oro del Cierre</h3>
                  <div className="pl-6 border-l-4 border-orange-500 italic text-slate-300 mb-6 text-lg">
                    "Si intentas vender antes de ayudar, serás visto como un vendedor molesto. Si ayudas antes de vender, serás visto como un asesor de confianza."
                  </div>
                  <p className="text-sm text-slate-400 m-0">Tu postura en la Conversación final nunca debe ser la de alguien que necesita la comisión. Eres un <strong>consultor experto</strong> que tiene el vehículo financiero exacto para sacar a esa persona de donde está.</p>
                </div>
              </div>

            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
              <button onClick={() => setActiveChapter('1.4')} className="px-6 py-3 font-bold text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all">
                ← Anterior
              </button>
              <button onClick={() => setActiveChapter('1.6')} className="px-6 py-3 font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-xl hover:shadow-lg hover:scale-105 transition-all">
                Siguiente →
              </button>
            </div>
          </motion.div>
        )}

        {activeChapter === '1.6' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-8">
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 font-bold rounded-full text-sm mb-4">
                Módulo 1 • Capítulo 6
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                Ética y Profesionalismo: Tu Reputación es Oro 🛡️
              </h1>
              <p className="text-xl text-slate-500 font-light">
                En TEI no solo hacemos negocios, construimos integridad. Sé el profesional que el mercado admira.
              </p>
            </div>

            <div className="prose prose-lg max-w-none text-slate-700">
              
              <div className="grid md:grid-cols-2 gap-8 mb-16">
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold text-red-600 m-0 mb-4">Lo que NO debes hacer ❌</h3>
                  <ul className="space-y-2 m-0 p-0 list-none text-sm">
                    <li>• Hacer SPAM masivo en grupos de Facebook.</li>
                    <li>• Prometer ganancias rápidas sin esfuerzo.</li>
                    <li>• Hablar mal de otras empresas de multinivel.</li>
                    <li>• Engañar sobre los beneficios de los productos.</li>
                  </ul>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold text-green-600 m-0 mb-4">Lo que te hace un Pro ✅</h3>
                  <ul className="space-y-2 m-0 p-0 list-none text-sm">
                    <li>• Ser honesto sobre el tiempo y esfuerzo requeridos.</li>
                    <li>• Tener un perfil digital limpio y profesional.</li>
                    <li>• Escuchar más de lo que hablas.</li>
                    <li>• Cumplir siempre tu palabra con tu equipo.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white mb-16 shadow-xl">
                <h3 className="text-2xl font-bold text-orange-400 mb-6 mt-0">La Bio Profesional Directa</h3>
                <p className="text-slate-300 mb-4">Tu biografía en redes sociales es tu tarjeta de presentación. Debe responder 3 preguntas:</p>
                <ol className="text-slate-400 space-y-2 text-sm font-medium">
                  <li>1. ¿A quién ayudas?</li>
                  <li>2. ¿Qué logras por ellos?</li>
                  <li>3. ¿Cuál es el siguiente paso? (Link/CTA)</li>
                </ol>
                <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl italic text-orange-200">
                  "Emprendedor Digital | Ayudo a familias a diversificar sus ingresos con e-commerce inteligente 🚀 | Únete a mi equipo aquí 👇 [Link]"
                </div>
              </div>

              <hr className="border-slate-200 my-16" />

              <div className="text-center mb-12">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 font-bold rounded-full text-sm mb-4">
                  Masterclass: La Maquinaria de Conversión
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 m-0">WhatsApp Marketing 💬</h2>
                <h3 className="text-xl text-slate-500 font-medium mt-2">Cerrando Ventas con Postura de CEO</h3>
                <p className="text-lg text-slate-600 mt-6 max-w-3xl mx-auto">
                  ¡Felicidades! Si un prospecto hizo clic en tu enlace y llegó a tu WhatsApp, tu embudo hizo su trabajo. Esa persona pasó de ser un "extraño" a ser un prospecto caliente. 
                  Las redes sociales son el escenario para llamar la atención, pero <strong>WhatsApp es la sala de cierre de negocios</strong>.
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-2xl mb-12">
                <h4 className="text-red-900 font-bold m-0 mb-2">El Error Mortal del Novato 💀</h4>
                <p className="text-red-800 text-sm m-0">Cuando reciben el primer mensaje, se emocionan tanto que le envían al prospecto 5 audios de tres minutos, 10 fotos de productos y el PDF completo del plan. Eso es vomitar información y transmite pura <strong>desesperación</strong>.</p>
              </div>

              <div className="mb-16 rounded-3xl overflow-hidden shadow-xl border border-slate-100 flex flex-col md:flex-row items-stretch">
                <div className="w-full md:w-1/2 shrink-0">
                  <img src="/course_assets/doctor_posture.png" alt="Postura del Doctor Financiero" className="w-full h-full object-cover m-0" />
                </div>
                <div className="p-8 bg-slate-50 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-200">
                  <h3 className="text-2xl font-bold text-slate-800 m-0 mb-4">🩺 El "Efecto Doctor"</h3>
                  <p className="text-slate-600 text-sm mb-4">Cuando vas al médico, él no te persigue por el pasillo rogándote que te tomes la pastilla. Hace preguntas, diagnostica y te receta. Si no te la tomas, tú pierdes.</p>
                  <p className="text-slate-800 font-bold text-sm bg-white p-4 rounded-xl shadow-sm border border-slate-100 m-0">
                    "En WhatsApp, tú eres el doctor. Diagnosticas qué necesita el prospecto y muestras cómo TEI se lo soluciona. Quien hace las preguntas, controla la conversación."
                  </p>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b-2 border-green-500 pb-2 inline-block">🏷️ Organización Nivel Dios</h2>
              <p className="mb-8">Para no volverte loco con decenas de mensajes, necesitas usar WhatsApp Business y dominar las Etiquetas. El dinero está en el seguimiento. Configura estas 5 etiquetas hoy:</p>

              <div className="grid md:grid-cols-2 gap-8 mb-16 relative">
                <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl md:absolute md:w-[45%] md:right-0 md:top-0 md:bottom-0 hidden md:block">
                  <img src="/course_assets/wa_labels.png" alt="Etiquetas WhatsApp Business" className="w-full h-full object-cover m-0" />
                </div>
                
                <div className="space-y-4 md:w-[50%] z-10 relative">
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] shrink-0"></div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm m-0">1. Nuevo Prospecto</h4>
                      <p className="text-xs text-slate-500 m-0">Acaba de llegar de TikTok o Instagram.</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)] shrink-0"></div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm m-0">2. Viendo Info</h4>
                      <p className="text-xs text-slate-500 m-0">Ya le enviaste el link a tu Página o el video.</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)] shrink-0"></div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm m-0">3. Seguimiento (24h)</h4>
                      <p className="text-xs text-slate-500 m-0">Están listos para agendar llamada o resolver dudas.</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] shrink-0"></div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm m-0">4. No por ahora</h4>
                      <p className="text-xs text-slate-500 m-0">No dinero/tiempo. (¡No los borres, el 80% compra en 6 meses!)</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="w-4 h-4 rounded-full bg-yellow-600 shadow-[0_0_10px_rgba(202,138,4,0.5)] shrink-0"></div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm m-0">5. Socio / Activo</h4>
                      <p className="text-xs text-slate-500 m-0">Ya pagaron su inscripción o compraron producto.</p>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b-2 border-green-500 pb-2 inline-block">💬 El Guion de 3 Pasos (Copia y Pega)</h2>
              <p className="mb-8">Esta es la estructura que debes usar cuando alguien te escribe "quiero info", manteniendo todo el control:</p>

              <div className="space-y-6 mb-16">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-slate-100 rounded-bl-2xl text-slate-400 font-mono text-xs font-bold">PASO 1</div>
                  <h4 className="text-xl font-bold text-slate-900 m-0 mb-3 text-green-700">Saludo y Cualificación</h4>
                  <p className="text-sm text-slate-600 mb-4">Nunca des la información de golpe. Averigua primero con quién hablas.</p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 italic text-slate-800 text-sm">
                    "¡Hola! Qué gusto saludarte. Claro que sí, te comparto toda la info. Pero antes, para no hacerte perder tiempo y saber cómo puedo ayudarte mejor, cuéntame: ¿Me escribes porque te interesa mejorar tu salud, o porque buscas diversificar tus ingresos?"
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-slate-100 rounded-bl-2xl text-slate-400 font-mono text-xs font-bold">PASO 2</div>
                  <h4 className="text-xl font-bold text-slate-900 m-0 mb-3 text-green-700">La Entrega de Valor (El Filtro)</h4>
                  <p className="text-sm text-slate-600 mb-4">Envías a tu prospecto al sistema para que haga el trabajo por ti, logrando compromiso previo.</p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 italic text-slate-800 text-sm">
                    "Excelente visión. En TEI ayudamos a monetizar gastos eliminando intermediarios. Para que entiendas los números, te enviaré un video de 5 mins. ¿Si te lo envío ahora mismo, tienes tiempo para verlo?"
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 bg-slate-100 rounded-bl-2xl text-slate-400 font-mono text-xs font-bold">PASO 3</div>
                  <h4 className="text-xl font-bold text-slate-900 m-0 mb-3 text-green-700">El Llamado al Cierre</h4>
                  <p className="text-sm text-slate-600 mb-4">Después de que ven el video, la pregunta de los top earners. NUNCA preguntes "¿Qué te pareció?".</p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 italic text-slate-800 text-sm">
                    "¡Perfecto! Cuéntame, de lo que acabas de ver en el video, ¿qué fue lo que MÁS te gustó? ¿El ahorro en salud o el plan de ingresos?"
                  </div>
                  <p className="text-sm font-bold text-slate-700 mt-4 mb-0">👉 A partir de ahí, solo resuelves sus dudas y envías tu link. Pura postura empresarial.</p>
                </div>
              </div>

              <div className="bg-white border-2 border-green-500 p-8 rounded-3xl text-center">
                <p className="text-green-900 font-medium m-0 mb-6">En el último capítulo (El Plan de Acción de 90 Días), te daremos la rutina diaria que debes seguir para usar todo esto y alcanzar el éxito masivo.</p>
                <button onClick={() => setActiveChapter('1.7')} className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg hover:bg-green-700 hover:scale-105 transition-all">
                  <span>💬 Entendido, mi WhatsApp es una máquina. Ir al Final ➡️</span>
                </button>
              </div>

            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
              <button onClick={() => setActiveChapter('1.5')} className="px-6 py-3 font-bold text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all">
                ← Anterior
              </button>
              <button onClick={() => setActiveChapter('1.7')} className="hidden md:block px-6 py-3 font-bold text-slate-400 hover:text-orange-500 transition-all">
                Siguiente →
              </button>
            </div>
          </motion.div>
        )}

        {activeChapter === '1.7' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-8 text-center">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 font-bold rounded-full text-sm mb-4">
                Módulo 1 • Capítulo Final
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                Tu Plan de Acción 90 Días 🏁
              </h1>
              <p className="text-xl text-slate-500 font-light max-w-2xl mx-auto">
                Felicidades por llegar al final del Módulo 1. Ahora es momento de pasar de la teoría a los resultados masivos.
              </p>
            </div>

            <div className="prose prose-lg max-w-none text-slate-700">
              
              <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl relative">
                <img src="/course_assets/timeline_focus.png" alt="Enfoque de 90 Días" className="w-full h-auto object-cover m-0" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent p-10 pt-24 text-white">
                  <p className="text-xl md:text-2xl font-light italic mb-0 text-slate-200">
                    "El éxito en TEI no es un golpe de suerte, es matemática y consistencia. Un verdadero profesional no improvisa; ejecuta un plan."
                  </p>
                </div>
              </div>

              <p className="text-lg text-slate-600 mb-16">
                A continuación, te presento tu <strong>Plan de 90 Días</strong>. Está dividido en 3 fases estratégicas y un ciclo exacto de 7 días que repetirás y mejorarás semana a semana. Apretar el acelerador aquí cambiará tu negocio para siempre.
              </p>

              <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b-2 border-green-500 pb-2 inline-block">🧬 Tu Sistema Operativo Diario (D.M.O.)</h2>
              <p className="mb-8">Antes de ver el plan, estos son tus 4 "No Negociables" (Daily Method of Operation). Llueva, truene o estés de viaje, esto es lo mínimo que haces <strong>todos los días</strong> de tus 90 días:</p>

              <div className="flex flex-col lg:flex-row gap-8 mb-16 items-center">
                <div className="lg:w-1/2 space-y-4">
                  <div className="flex gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-green-400 transition-colors">
                    <span className="text-3xl shrink-0">📝</span>
                    <div>
                      <h4 className="font-bold text-slate-900 m-0 text-sm uppercase tracking-wider text-green-700">Crear</h4>
                      <p className="m-0 text-sm text-slate-600 mt-1">Publicar al menos 1 pieza de contenido (Reel, TikTok o Historia) usando la regla 80/20.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-green-400 transition-colors">
                    <span className="text-3xl shrink-0">🤝</span>
                    <div>
                      <h4 className="font-bold text-slate-900 m-0 text-sm uppercase tracking-wider text-green-700">Conectar</h4>
                      <p className="m-0 text-sm text-slate-600 mt-1">Iniciar conversaciones genuinas con 5 personas nuevas (sin venderles nada, solo networking).</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-green-400 transition-colors">
                    <span className="text-3xl shrink-0">💬</span>
                    <div>
                      <h4 className="font-bold text-slate-900 m-0 text-sm uppercase tracking-wider text-green-700">Cerrar</h4>
                      <p className="m-0 text-sm text-slate-600 mt-1">Responder a los prospectos de WhatsApp y hacer seguimiento a los de días anteriores.</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-green-400 transition-colors">
                    <span className="text-3xl shrink-0">🧠</span>
                    <div>
                      <h4 className="font-bold text-slate-900 m-0 text-sm uppercase tracking-wider text-green-700">Crecer</h4>
                      <p className="m-0 text-sm text-slate-600 mt-1">Dedicar 30 min a leer o escuchar un audio. Tu cheque crece al mismo ritmo que tu mente.</p>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <div className="rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
                    <img src="/course_assets/daily_dmo.png" alt="DMO Diario en Tablet" className="w-full h-auto m-0 opacity-90" />
                  </div>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b-2 border-orange-500 pb-2 inline-block">📅 El Ciclo de los 7 Días</h2>
              <p className="mb-8">Para que no te levantes pensando "¿qué hago hoy?", cada día tiene una misión específica de marketing. Repite este ciclo como un reloj suizo:</p>

              <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
                <img src="/course_assets/seven_day_cycle.png" alt="Ciclo Semanal de 7 Días" className="w-full h-auto m-0 opacity-90" />
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-16">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h4 className="text-slate-900 font-bold m-0 mb-2 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-500"></div>Lunes de Autoridad</h4>
                  <p className="text-sm text-slate-600 m-0">Inspirar. Frase de liderazgo o visión contra el modelo roto. Objetivo: Que te vean como un líder.</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h4 className="text-slate-900 font-bold m-0 mb-2 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div>Martes de Educación</h4>
                  <p className="text-sm text-slate-600 m-0">Valor sobre salud o economía. 3 tips o por qué los intermediarios encarecen. Objetivo: Atraer inteligentemente.</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h4 className="text-slate-900 font-bold m-0 mb-2 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-400"></div>Miércoles de Estilo de Vida</h4>
                  <p className="text-sm text-slate-600 m-0">Mostrar sin contar. Historias trabajando desde el celular o café. Objetivo: Curiosidad pura (El Imán).</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h4 className="text-slate-900 font-bold m-0 mb-2 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div>Jueves de Tráfico</h4>
                  <p className="text-sm text-slate-600 m-0">Reel o TikTok agresivo (Gancho-Historia-Llamado). Objetivo: Llevar extraños a tu embudo.</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h4 className="text-slate-900 font-bold m-0 mb-2 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div>Viernes de Cosecha</h4>
                  <p className="text-sm text-slate-600 m-0">Llamado de Venta Directa (20%). "Tengo 5 espacios para asesoría gratuita". Objetivo: Filtrar y cerrar.</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <h4 className="text-slate-900 font-bold m-0 mb-2 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div>Sábado de Seguimiento</h4>
                  <p className="text-sm text-slate-600 m-0">Interactúa y escribe a quienes quedaron en "visto". Objetivo: Revivir prospectos en WhatsApp.</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 md:col-span-2">
                  <h4 className="text-slate-900 font-bold m-0 mb-2 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-800"></div>Domingo de Auditoría</h4>
                  <p className="text-sm text-slate-600 m-0">Desconexión. Revisa métricas semanales y planifica los ganchos de lunes a viernes. Afilar el hacha.</p>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b-2 border-green-500 pb-2 inline-block">🚀 Las 3 Fases de Construcción</h2>
              <p className="mb-8">A medida que repitas el ciclo de 7 días, tu negocio evolucionará de manera explosiva en estas 3 etapas:</p>

              <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-black">
                <img src="/course_assets/three_phases.png" alt="Las 3 Fases del Imperio" className="w-full h-auto m-0 opacity-90" />
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-16">
                <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  <h4 className="text-green-400 m-0 mb-2 font-bold uppercase tracking-widest text-xs">Días 1-30</h4>
                  <h3 className="text-2xl m-0 mb-4 font-bold">El Despegue</h3>
                  <p className="text-sm text-slate-300 font-light m-0 mb-4"><strong>Enfoque:</strong> Vencer el miedo a la cámara, dominar el guion y limpiar redes.</p>
                  <p className="text-sm text-slate-400 m-0 italic border-l-2 border-green-500 pl-3">Meta: 10 Clientes, 2 Socios visionarios. Construye tu armadura contra el "NO".</p>
                </div>
                
                <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  <h4 className="text-yellow-400 m-0 mb-2 font-bold uppercase tracking-widest text-xs">Días 31-60</h4>
                  <h3 className="text-2xl m-0 mb-4 font-bold">La Tracción</h3>
                  <p className="text-sm text-slate-300 font-light m-0 mb-4"><strong>Enfoque:</strong> Optimizar ganchos que funcionan. Postura de experto en WhatsApp.</p>
                  <p className="text-sm text-slate-400 m-0 italic border-l-2 border-yellow-500 pl-3">Meta: Duplicar facturación mes 1. Ayudar a tus 2 socios a lograr resultados.</p>
                </div>
                
                <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                  <h4 className="text-red-400 m-0 mb-2 font-bold uppercase tracking-widest text-xs">Días 61-90</h4>
                  <h3 className="text-2xl m-0 mb-4 font-bold">Moméntum</h3>
                  <p className="text-sm text-slate-300 font-light m-0 mb-4"><strong>Enfoque:</strong> Ya eres un líder TEI. Embudo en automático. Delegar y duplicar.</p>
                  <p className="text-sm text-slate-400 m-0 italic border-l-2 border-red-500 pl-3">Meta: Muestras el plan de 90 días a tu equipo. Aquí tus ingresos se vuelven exponenciales.</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-900 to-slate-900 border border-green-700/50 p-12 rounded-[3rem] text-center mb-16 shadow-2xl transform hover:scale-[1.01] transition-transform relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
                <div className="text-6xl mb-6 drop-shadow-lg">🏆</div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-green-200 m-0 mb-6">El Compromiso del CEO</h3>
                <p className="text-green-100 font-medium mb-8 text-lg max-w-2xl mx-auto leading-relaxed">
                  Pon una alarma en tu celular para dentro de exactamente 90 días. Si ejecutas este ciclo de 7 días <strong>sin fallar</strong>, la persona que apagará esa alarma tendrá una cuenta bancaria, un equipo y una mentalidad irreconocibles.
                </p>
                
                <p className="text-white text-xl md:text-2xl font-bold mb-10">¡Bienvenido a las grandes ligas de Tu Empresa Internacional!</p>
                
                <div className="flex flex-col md:flex-row gap-4 justify-center relative z-10">
                  <button onClick={() => setExpandedModule(2)} className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:scale-105 transition-all">
                    Iniciar Módulo 2
                  </button>
                  <button onClick={() => setActiveChapter('1.1')} className="px-8 py-4 bg-white/5 text-white font-bold border border-white/20 rounded-2xl hover:bg-white/10 transition-all backdrop-blur-sm">
                    Repasar Módulo 1
                  </button>
                </div>
              </div>

            </div>

            <div className="mt-16 pt-8 border-t border-slate-100 flex justify-between items-center">
              <button onClick={() => setActiveChapter('1.6')} className="px-6 py-3 font-bold text-orange-600 bg-orange-50 rounded-xl hover:bg-orange-100 transition-all">
                ← Anterior
              </button>
              <button disabled className="px-6 py-3 font-semibold text-slate-400 bg-slate-100 rounded-xl cursor-not-allowed">
                Módulo Completado ✓
              </button>
            </div>
          </motion.div>
        )}
        {/* Fallback for development chapters */}
        {!['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7'].includes(activeChapter) && (
          <div className="flex flex-col items-center justify-center h-full text-center p-10">
            <div className="text-6xl mb-6">🚧</div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Capítulo en Desarrollo</h2>
            <p className="text-slate-500 text-lg max-w-md">
              Estamos preparando técnicas de alto valor para esta lección ({activeChapter}). ¡Pronto la añadiremos a tu arsenal de herramientas TEI!
            </p>
            <button 
              onClick={() => setActiveChapter('1.1')}
              className="mt-8 px-6 py-3 font-bold text-orange-600 bg-orange-100 rounded-xl hover:bg-orange-200 transition-colors"
            >
              Volver al Inicio
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default DigitalMarketingCourse;
