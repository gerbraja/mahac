import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NetworkBuildingCourse = () => {
  const [activeChapter, setActiveChapter] = useState('1.1');
  const [expandedModule, setExpandedModule] = useState(1);

  const modules = [
    {
      id: 1,
      name: "El Arte de la Presentación",
      icon: "💼",
      color: "from-purple-500 to-indigo-600",
      chapters: [
        { id: '1.1', title: "La Presentación de 15 Minutos" },
        { id: '1.2', title: "Manejo de Objeciones (En Desarrollo)", disabled: true }
      ]
    },
    {
      id: 2,
      name: "Cierre y Seguimiento",
      icon: "🎯",
      color: "from-indigo-500 to-blue-600",
      chapters: [
        { id: '2.1', title: "Estrategias de Seguimiento", disabled: true }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 md:-mt-6 pb-20">
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 md:top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌳</span>
              <h1 className="text-white font-bold text-lg hidden sm:block">
                Construyendo tu Red
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Tu Camino al Exito</span>
                <span className="text-white text-sm font-bold">Líder TEI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-1/4 xl:w-80 shrink-0">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 sticky top-24">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span>📚</span> Temario
            </h2>
            <div className="space-y-4">
              {modules.map((module) => (
                <div key={module.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                    className={`w-full text-left p-4 flex items-center justify-between transition-colors ${
                      expandedModule === module.id ? 'bg-white' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{module.icon}</span>
                      <span className="font-bold text-slate-800">Módulo {module.id}</span>
                    </div>
                    <span className="text-slate-400 text-xl font-bold">
                      {expandedModule === module.id ? '−' : '+'}
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {expandedModule === module.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white border-t border-slate-100"
                      >
                        <div className="p-2 space-y-1">
                          {module.chapters.map((chapter) => (
                            <button
                              key={chapter.id}
                              disabled={chapter.disabled}
                              onClick={() => setActiveChapter(chapter.id)}
                              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                chapter.disabled 
                                  ? 'text-slate-400 cursor-not-allowed opacity-60'
                                  : activeChapter === chapter.id 
                                    ? `bg-gradient-to-r ${module.color} text-white shadow-md`
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span className={`shrink-0 mt-0.5 ${
                                  chapter.disabled 
                                    ? 'text-slate-300' 
                                    : activeChapter === chapter.id ? 'text-white/70' : 'text-slate-400'
                                }`}>
                                  {chapter.disabled ? '🔒' : '●'}
                                </span>
                                <span className="leading-snug break-words">
                                  {chapter.id} {chapter.title}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full lg:w-3/4 flex-1 min-w-0 bg-white rounded-3xl p-6 md:p-12 shadow-md border border-slate-100 mb-10 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeChapter === '1.1' && (
              <motion.div 
                key="1.1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
              >
                <div className="mb-8">
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 font-bold rounded-full text-sm mb-4">
                    Módulo 1 • Capítulo 1
                  </span>
                  <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                    La Presentación de 15 Minutos ⏱️
                  </h1>
                  <p className="text-xl text-slate-500 font-light">
                    Precisión, Postura y Cierre. En el mundo digital, la atención es oro puro.
                  </p>
                </div>

                <div className="prose prose-lg max-w-none text-slate-700">
                  <div className="bg-gradient-to-br from-slate-900 to-black p-8 rounded-3xl text-white mb-16 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <p className="text-xl font-light italic text-purple-300 mt-0 mb-4 relative z-10">Si no puedes explicar el negocio de TEI en 15 minutos, no tienes un negocio, tienes un monólogo.</p>
                    <p className="text-lg opacity-90 m-0 relative z-10">
                      Bienvenido a la etapa de <strong>conversión</strong>. Ya dominas el marketing para atraer prospectos y tienes la postura correcta en WhatsApp. Ahora, cuando tienes a esa persona enfrente (en un Zoom, en un café o en una llamada), tu trabajo es mostrarle el panorama completo en un formato tan sencillo que su cerebro diga: <span className="text-purple-400 font-bold">"¡Wow, yo también puedo hacer esto!"</span>.
                    </p>
                  </div>

                  <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b-2 border-purple-500 pb-2 inline-block">La Estructura de los 4 Cuadrantes</h2>
                  <p className="mb-8">La regla de los 15 minutos se basa en la <strong>Duplicación</strong>. Divide tu "Pitch Perfecto" en estas 4 fases exactas. Ni un minuto más, ni un minuto menos:</p>

                  <div className="mb-16 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 bg-black">
                    {/* Placeholder para la Imagen 1: La Precisión del Tiempo (timing_precision.png) */}
                    <img src="/course_assets/timing_precision.png" alt="Precisión de 15 Minutos" className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity m-0" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 mb-16">
                    {/* Cuadrante 1 */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group hover:border-purple-400 transition-colors">
                      <div className="absolute -top-4 -left-4 w-12 h-12 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm transform group-hover:rotate-6 transition-transform">1</div>
                      <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">Tu Historia y la Conexión</h3>
                      <p className="text-purple-600 font-mono text-sm mb-4 font-bold bg-purple-50 inline-block px-2 py-1 rounded">Minutos 0 - 3</p>
                      <p className="text-sm text-slate-600 mb-4">A la gente no le importa cuánto sabes, hasta que saben cuánto te importan. Empieza rompiendo el hielo.</p>
                      <ul className="text-sm space-y-3 m-0 p-0 list-none">
                        <li><strong className="text-slate-800">El dolor:</strong> "Antes de TEI, yo estaba buscando Opciones y no había visto algo igual."</li>
                        <li><strong className="text-slate-800">La epifanía:</strong> "Me di cuenta de que el sistema tradicional estaba diseñado para enriquecer a otros."</li>
                        <li><strong className="text-slate-800">La transición:</strong> "Por eso, tomé la decisión de cambiar las reglas de mi economía."</li>
                      </ul>
                    </div>

                    {/* Cuadrante 2 */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group hover:border-indigo-400 transition-colors">
                      <div className="absolute -top-4 -left-4 w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm transform group-hover:rotate-6 transition-transform">2</div>
                      <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">El Problema y la Solución</h3>
                      <p className="text-indigo-600 font-mono text-sm mb-4 font-bold bg-indigo-50 inline-block px-2 py-1 rounded">Minutos 3 - 7</p>
                      <p className="text-sm text-slate-600 mb-4">Introduce el concepto TEI sin parecer un vendedor de catálogo. Hablamos de negocios inteligentes con la fábrica.</p>
                      <ul className="text-sm space-y-3 m-0 p-0 list-none">
                        <li><strong className="text-red-500">Problema (Intermediario):</strong> Explicas por qué en los almacenes pagas 50% extra en publicidad, servicios y transporte.</li>
                        <li><strong className="text-green-600">Solución (TEI):</strong> "Conectamos directo con la fábrica. Productos premium exentos de IVA, y todo ese dinero ahorrado la empresa te lo paga a ti por conectar clientes."</li>
                      </ul>
                    </div>

                    {/* Cuadrante 3 */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group hover:border-blue-400 transition-colors">
                      <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm transform group-hover:rotate-6 transition-transform">3</div>
                      <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2">El Dinero</h3>
                      <p className="text-blue-600 font-mono text-sm mb-4 font-bold bg-blue-50 inline-block px-2 py-1 rounded">Minutos 7 - 12</p>
                      <p className="text-sm text-slate-600 mb-4">¡Alerta de novato! NO expliques los 10 bonos del plan aquí. La mente confundida dirá "NO". Muestra visión.</p>
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-sm italic text-slate-700">
                        "Ganamos de dos formas: Consumo inteligente (ahorro) y Construcción de red (regalías). Imagina tener 100 personas consumiendo; ganas porcentaje de todo, sin pagar arriendos ni empleados."
                      </div>
                    </div>

                    {/* Cuadrante 4 */}
                    <div className="bg-slate-900 p-6 rounded-3xl shadow-xl relative group overflow-hidden">
                      <div className="absolute -top-4 -left-4 w-12 h-12 bg-amber-400 text-amber-900 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg transform group-hover:rotate-6 transition-transform z-10">4</div>
                      <h3 className="text-xl font-bold text-white mt-4 mb-2 relative z-10">El Cierre y el Sistema</h3>
                      <p className="text-amber-400 font-mono text-sm mb-4 font-bold bg-amber-400/10 inline-block px-2 py-1 rounded relative z-10">Minutos 12 - 15</p>
                      <p className="text-sm text-slate-300 mb-4 relative z-10">El cierre no es rogar, es mostrar el camino. Les quitas el miedo a fracasar mostrándoles la Academia.</p>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-sm text-amber-50 relative z-10">
                        "¿Quieres ser consumidor inteligente de nuestros productos, o quieres posicionarte como pionero y construir este negocio con nosotros?"
                      </div>
                    </div>
                  </div>

                  <div className="mb-16 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 bg-black">
                    {/* Placeholder para la Imagen 2: La Presentación Duplicable (duplicable_presentation.png) */}
                    <img src="/course_assets/duplicable_presentation.png" alt="Presentación Duplicable y Postura" className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity m-0" />
                  </div>

                  <h2 className="text-3xl font-bold text-slate-900 mb-8 border-b-2 border-purple-500 pb-2 inline-block">🛡️ Las 3 Reglas de Oro</h2>
                  
                  <div className="space-y-6 mb-16">
                    <div className="flex items-start gap-4 p-5 bg-purple-50 rounded-2xl border border-purple-100">
                      <div className="w-12 h-12 rounded-xl bg-purple-200 flex items-center justify-center text-purple-700 text-2xl shrink-0 font-bold">🔥</div>
                      <div>
                        <h4 className="text-lg font-bold text-purple-900 m-0">La energía vende más que los datos</h4>
                        <p className="text-sm text-purple-800 m-0 mt-1">Si hablas con pasión y convicción sobre el futuro de la empresa, perdonarán si te equivocas en un porcentaje técnico del plan de compensación.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <div className="w-12 h-12 rounded-xl bg-indigo-200 flex items-center justify-center text-indigo-700 text-2xl shrink-0 font-bold">🛠️</div>
                      <div>
                        <h4 className="text-lg font-bold text-indigo-900 m-0">Usa herramientas</h4>
                        <p className="text-sm text-indigo-800 m-0 mt-1">Si puedes, no hables tú todo el tiempo. Ponle play al video oficial de presentación de TEI y solo haz el testimonio y el cierre. Eso es 100% duplicable, tu invitado sentirá que él también puede darle "play" a un video mañana.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                      <div className="w-12 h-12 rounded-xl bg-blue-200 flex items-center justify-center text-blue-700 text-2xl shrink-0 font-bold">🚦</div>
                      <div>
                        <h4 className="text-lg font-bold text-blue-900 m-0">Controla la conversación</h4>
                        <p className="text-sm text-blue-800 m-0 mt-1">Si te interrumpen con preguntas técnicas en el minuto 5, diles amablemente con postura de verdadero líder corporativo: <em>"Esa es una excelente pregunta, anótala y en 10 minutos que terminemos la resolvemos en detalle para no perder el hilo"</em>.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border-2 border-purple-500 p-10 rounded-3xl text-center shadow-xl">
                    <h3 className="text-2xl font-bold text-purple-900 mt-0 mb-4">¿Estás listo para las ligas mayores?</h3>
                    <p className="text-purple-800 font-medium m-0 mb-8">Memoriza y domina esta presentación de 15 minutos en los 4 cuadrantes. Una vez que lo hagas, serás un "peligro" absoluto en tu agenda diaria.</p>
                    <button onClick={() => {}} className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg w-full md:w-auto">
                      <span>⏱️ Entendido, mi presentación será un rayo láser. Ir a la Lección 2 ➡️</span>
                    </button>
                    <p className="text-xs text-slate-400 mt-4 m-0 font-medium">La próxima lección "Manejo de Objeciones" está en desarrollo.</p>
                  </div>

                </div>
              </motion.div>
            )}

            {/* Placeholder for other chapters (e.g. 1.2, 2.1) */}
            {activeChapter !== '1.1' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center py-20"
              >
                <div className="text-6xl mb-6">🚧</div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Capítulo en Construcción</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  Estamos integrando las estrategias más actualizadas de Network Marketing para esta sección.
                </p>
                <button 
                  onClick={() => setActiveChapter('1.1')}
                  className="mt-8 px-6 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-semibold transition-colors"
                >
                  Volver al Capítulo 1.1
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default NetworkBuildingCourse;
