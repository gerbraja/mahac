import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import RegisterForm from '../components/auth/RegisterForm';

const Opportunity = () => {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';

  // ID del video de YouTube (Cambiar este valor por el ID de tu video)
  const youtubeVideoId = "cKP6tLMuOjw";
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <img
          src="https://storage.googleapis.com/tuempresainternacional-assets/images/hero.jpg"
          alt="Tu Libertad Financiera"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-black/50 z-0"></div>

        <div className="container mx-auto px-4 z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
          >
            Tu Empresa Internacional
          </motion.h1>
          <motion.p
            {...fadeIn}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto"
          >
            Eliminamos los intermediarios. ¿Te gustaría comprar directamente de las fabricas y Generar dinero por Recomendar? Imagine miles de Fabricas globales desde Electrodomésticos, vestuario, alta moda, tecnología, movilidad, etc. - Enviando sus productos directamente a la puerta de Tu Hogar.
          </motion.p>

        </div>
      </section>

      {/* PRODUCT LINES */}
      <section className="py-20 bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Nuestro Ecosistema</h2>
            <p className="text-gray-400 text-lg">Más que un negocio, un estilo de vida.</p>
          </div>

          {/* Video Full Width */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="w-full max-w-6xl mx-auto"
          >
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-slate-700 bg-black">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                title="Presentación de Negocio"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>

            <div className="mt-8 text-center max-w-4xl mx-auto">
              <p className="text-xl text-gray-300">
                Descubre cómo nuestro ecosistema de E-commerce, Educación y Networking está transformando vidas alrededor del mundo.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* COMPENSATION PLAN */}
      <section id="plan" className="py-20 bg-gradient-to-b from-slate-900 to-blue-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
              Plan de Compensación Híbrido
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Hemos diseñado el sistema más agresivo y sostenible del mercado.
              Combina la estabilidad del Unilevel con la explosividad del Binario.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xl shrink-0">1</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Bono de Inicio Rápido</h4>
                  <p className="text-gray-400">Gana comisiones inmediatas por cada nuevo socio o cliente que traigas a la compañía.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xl shrink-0">2</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Binario Global</h4>
                  <p className="text-gray-400">Construye dos equipos y gana por los niveles impares de las dos Piernas hasta el nivel 21.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xl shrink-0">3</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Matrices Forzadas</h4>
                  <p className="text-gray-400">Nuestro sistema inteligente coloca personas debajo de ti automáticamente, ayudándote a capitalizar más rápido.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center font-bold text-xl shrink-0">4</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Bonos de Rango y Honor</h4>
                  <p className="text-gray-400">Premios de lujo, viajes y bonos en efectivo al alcanzar metas de liderazgo. Desde Silver hasta Diamond Elite.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Abstract visual representation of the network */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-3xl opacity-20 rounded-full"></div>
              <div className="relative bg-slate-800 p-8 rounded-3xl border border-slate-600 shadow-2xl">
                <div className="text-center mb-8">
                  <span className="text-6xl">🚀</span>
                  <h3 className="text-2xl font-bold mt-4">Potencial de Ganancias</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-700 rounded-lg">
                    <span>Socio Básico</span>
                    <span className="font-bold text-green-400">$500 - $1,000 USD / mes</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-700 rounded-lg border-l-4 border-blue-500">
                    <span>Líder Ejecutivo</span>
                    <span className="font-bold text-green-400">$2,000 - $5,000 USD / mes</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-700 rounded-lg border-l-4 border-purple-500">
                    <span>Director Global</span>
                    <span className="font-bold text-green-400">$10,000+ USD / mes</span>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500 italic">*Resultados basados en esfuerzo y dedicación.</p>
                </div>
              </div>
            </div>
          </div>

          {/* DETAILED COMPENSATION BREAKDOWN */}
          <div className="mt-24 space-y-24">

            {/* Unilevel Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-slate-800/50 rounded-3xl p-8 md:p-12 border border-slate-700 backdrop-blur-sm"
            >
              <div className="text-center mb-12">
                <span className="text-4xl mb-4 block">🌳</span>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Red Unilevel</h3>
                <p className="text-xl text-blue-300">Ganancias recurrentes de tu equipo personal</p>
              </div>

              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="bg-slate-700/50 p-6 rounded-xl border-l-4 border-green-500">
                    <h4 className="text-xl font-bold text-white mb-2">🎯 7 Niveles de Profundidad</h4>
                    <p className="text-gray-300">Ganas comisiones de hasta 7 niveles de profundidad en tu red. Cada nivel tiene su propio porcentaje de comisión.</p>
                  </div>
                  <div className="bg-slate-700/50 p-6 rounded-xl border-l-4 border-blue-500">
                    <h4 className="text-xl font-bold text-white mb-2">💎 Total 27% Distribuido</h4>
                    <p className="text-gray-300">El sistema distribuye un total de 27% en comisiones:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[1, 2, 2, 4, 5, 6, 7].map((percent, idx) => (
                        <span key={idx} className="bg-blue-600/30 px-3 py-1 rounded-full text-sm font-bold text-blue-200">
                          Nivel {idx + 1}: {percent}%
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-700/50 p-6 rounded-xl border-l-4 border-purple-500">
                    <h4 className="text-xl font-bold text-white mb-2">⚡ Comisiones Automáticas</h4>
                    <p className="text-gray-300">Cada vez que alguien en tu red hace una compra, automáticamente recibes tu comisión según el nivel.</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-8 rounded-2xl border border-indigo-500/30">
                  <div className="text-center mb-6">
                    <span className="text-3xl mb-2 block">🎁</span>
                    <h4 className="text-2xl font-bold text-white">Bono de Igualación</h4>
                    <p className="text-indigo-200 text-sm">(Matching Bonus)</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h5 className="font-bold text-white mb-2">¿Qué es?</h5>
                      <p className="text-gray-300 text-sm">Es un bono adicional del <span className="text-yellow-400 font-bold">50%</span> de todas las comisiones que generan tus patrocinados directos (Nivel 1).</p>
                    </div>
                    <div>
                      <h5 className="font-bold text-white mb-2">¿Cómo funciona?</h5>
                      <p className="text-gray-300 text-sm">Cuando un patrocinado directo tuyo gana comisiones Unilevel, tú recibes la mitad de eso EXTRA.</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-lg mt-4">
                      <p className="text-sm text-gray-400 mb-2 font-semibold">Ejemplo Práctico:</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          <span className="text-gray-300">Tu directo Pedro gana $100</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-green-400">✓</span>
                          <span className="text-yellow-400 font-bold">Tú recibes $50 extra</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Global Binary Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700"
            >
              <div className="p-8 md:p-16 text-center">
                <span className="text-5xl mb-6 block">🌍</span>
                <h3 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6">
                  Plan Binario Global
                </h3>
                <p className="text-2xl text-white font-light italic mb-12">
                  "¿Te gustaría que el mundo entero trabajara para llenar tu cuenta bancaria mientras duermes?"
                </p>

                <div className="text-left space-y-12 max-w-4xl mx-auto">
                  {/* Introduction */}
                  <div className="prose prose-invert max-w-none">
                    <p className="text-lg text-gray-300 leading-relaxed">
                      Imagina esto por un momento: Alrededor del mundo, miles de personas están buscando Ingresos Adicionales y libertad financiera justo ahora.
                      <span className="text-white font-semibold"> Cada vez que alguien se registra, el sistema busca un lugar vacío. Ese lugar podría estar debajo de ti.</span>
                    </p>
                    <p className="text-lg text-gray-300 mt-4 leading-relaxed">
                      Te presento el Binario Global de <span className="text-blue-400 font-bold">TU EMPRESA INTERNACIONAL</span>, el único sistema donde no estás solo, sino apalancado por una maquinaria internacional que no se detiene.
                    </p>
                  </div>

                  {/* Key Benefits Grid */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-slate-800 p-6 rounded-xl hover:bg-slate-750 transition-colors">
                      <div className="text-3xl mb-4">💎</div>
                      <h4 className="text-lg font-bold text-white mb-2">Posicionamiento de Élite</h4>
                      <p className="text-sm text-gray-400">
                        Entra hoy a "Costo Cero". Tu posición es un activo que gana valor cada minuto, capitalizando el crecimiento global.
                      </p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-xl hover:bg-slate-750 transition-colors">
                      <div className="text-3xl mb-4">🌊</div>
                      <h4 className="text-lg font-bold text-white mb-2">El Poder del "Derrame"</h4>
                      <p className="text-sm text-gray-400">
                        Personas de otros países que no conoces caerán debajo de ti simplemente por haber llegado primero.
                      </p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-xl hover:bg-slate-750 transition-colors">
                      <div className="text-3xl mb-4">🚀</div>
                      <h4 className="text-lg font-bold text-white mb-2">Cobras por Todo</h4>
                      <p className="text-sm text-gray-400">
                        Rompemos las reglas: aquí cobras por AMBAS piernas. Hasta el nivel 21 de profundidad.
                      </p>
                    </div>
                  </div>

                  {/* Clock / Urgency Section */}
                  <div className="bg-orange-900/20 border border-orange-500/30 rounded-2xl p-8 flex flex-col md:flex-row gap-8 items-center">
                    <div className="shrink-0 text-center md:text-left">
                      <div className="text-5xl mb-2">⏳</div>
                      <h4 className="text-xl font-bold text-orange-400">Tu Ventaja Competitiva</h4>
                    </div>
                    <div className="space-y-4 flex-1">
                      <div className="flex items-start gap-3">
                        <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-xs font-bold mt-1">GRATIS</span>
                        <div>
                          <h5 className="font-bold text-white">37 Días de Gracia</h5>
                          <p className="text-sm text-gray-400">Periodo de prueba para observar cómo crece tu equipo sin haber comprado aún.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs font-bold mt-1">ACTIVO</span>
                        <div>
                          <h5 className="font-bold text-white">367 Días de Ganancias</h5>
                          <p className="text-sm text-gray-400">Al activarte, aseguras un año entero de comisiones automáticas.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cinema Analogy */}
                  <div className="bg-blue-900/20 rounded-2xl p-8 border border-blue-500/30">
                    <h4 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                      <span>🎬</span> La Analogía del "Cine Inteligente"
                    </h4>
                    <p className="text-gray-300 italic mb-4">
                      "Imagina que entras a un estreno mundial. Llegas temprano y apartas tu asiento gratis. El cine se llena con gente de todo el mundo. Por haber llegado primero, recibes una parte de lo que pagaron los que entraron después."
                    </p>
                    <p className="font-bold text-white text-center text-lg">
                      ¿Te quedarías fuera de la sala sabiendo que se va a llenar de todos modos?
                    </p>
                  </div>

                  {/* Action Steps */}
                  <div className="space-y-4">
                    <h4 className="text-center text-2xl font-bold text-white mb-6">Tu Plan de Acción (Cero Riesgo)</h4>
                    <div className="grid md:grid-cols-3 gap-4 text-center">
                      <div className="bg-slate-800 p-4 rounded-lg">
                        <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">1</div>
                        <h5 className="font-bold text-white">Regístrate (Gratis)</h5>
                        <p className="text-xs text-gray-400 mt-2">Asegura tu "Posición Global" ahora.</p>
                      </div>
                      <div className="bg-slate-800 p-4 rounded-lg">
                        <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">2</div>
                        <h5 className="font-bold text-white">Mira el Crecimiento</h5>
                        <p className="text-xs text-gray-400 mt-2">Observa el sistema trabajar.</p>
                      </div>
                      <div className="bg-slate-800 p-4 rounded-lg">
                        <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-3 font-bold">3</div>
                        <h5 className="font-bold text-white">Actívate y Cobra</h5>
                        <p className="text-xs text-gray-400 mt-2">Prepárate para un año de ingresos.</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>

            {/* Forced Matrix Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-slate-800/80 rounded-3xl p-8 md:p-12 border border-emerald-500/30 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

              <div className="text-center mb-12 relative z-10">
                <span className="text-4xl mb-4 block">🏗️</span>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Matrices Forzadas</h3>
                <p className="text-xl text-emerald-300">Equipos pequeños, Ganancias rápidas</p>
              </div>

              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                    <h4 className="text-xl font-bold text-white mb-2">¿Qué es una Matriz?</h4>
                    <p className="text-gray-300 text-sm mb-4">
                      Imagina que eres el capitán de un pequeño equipo. Tu "misión" es llenar un equipo de tan solo <span className="text-emerald-400 font-bold">12 personas</span>.
                    </p>
                    <div className="bg-slate-800 p-3 rounded text-sm text-center font-mono text-emerald-200">
                      Tú (1) + Nivel 1 (3) + Nivel 2 (9) = 12 Personas
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-white">🚀 ¿Cómo funciona el ciclo?</h4>
                    <ol className="space-y-4">
                      <li className="flex gap-3">
                        <span className="bg-emerald-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1">1</span>
                        <div>
                          <strong className="text-white block">Llenas tu equipo</strong>
                          <span className="text-sm text-gray-400">Invitas a 3, y ellos invitan a sus 3.</span>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="bg-emerald-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1">2</span>
                        <div>
                          <strong className="text-white block">¡Ciclas y Cobras! 💰</strong>
                          <span className="text-sm text-gray-400">Al entrar la persona #12, el sistema te paga inmediatamente (de $77 a $970,000 USD).</span>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <span className="bg-emerald-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1">3</span>
                        <div>
                          <strong className="text-white block">Evolucionas</strong>
                          <span className="text-sm text-gray-400">Re-entras para volver a cobrar o Asciendes al siguiente nivel gratis.</span>
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-8 rounded-2xl border border-emerald-500/20">
                  <h4 className="text-xl font-bold text-white mb-6 text-center">🏆 Los 9 Niveles de Juego</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-800 p-3 rounded border-l-4 border-gray-400">
                      <span className="text-sm text-gray-300">Consumidor</span>
                      <span className="font-bold text-emerald-400">$77 USD</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-800 p-3 rounded border-l-4 border-orange-400">
                      <span className="text-sm text-gray-300">Bronce</span>
                      <span className="font-bold text-emerald-400">$277 USD</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-800 p-3 rounded border-l-4 border-gray-300">
                      <span className="text-sm text-gray-300">Plata</span>
                      <span className="font-bold text-emerald-400">$877 USD</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-800 p-3 rounded border-l-4 border-yellow-400 relative overflow-hidden">
                      <div className="absolute inset-0 bg-yellow-400/10 animate-pulse"></div>
                      <span className="text-sm text-white font-bold relative z-10">Oro</span>
                      <span className="font-bold text-yellow-300 relative z-10">$1,500 USD + Cripto</span>
                    </div>
                    <div className="text-center text-xs text-gray-500 mt-2">
                      ... hasta Diamante Azul ($970k USD)
                    </div>
                  </div>

                  <div className="mt-6 bg-emerald-900/30 p-4 rounded-xl">
                    <p className="text-emerald-200 text-sm italic text-center">
                      "Es como llenar un autobús de 12 pasajeros. Cuando se llena, te paga y te da boleto gratis para el siguiente viaje."
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Millionaire Binary Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-tr from-slate-900 to-blue-900 rounded-3xl p-8 md:p-16 border border-blue-500/30 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>

              <div className="relative z-10 max-w-4xl mx-auto">
                <span className="text-5xl mb-6 block">💎</span>
                <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">Red Binaria Millonaria</h3>
                <p className="text-xl text-blue-200 mb-12">Construcción de Riqueza a Largo Plazo</p>

                <div className="grid md:grid-cols-2 gap-12 text-left mb-12">
                  <div>
                    <h4 className="text-2xl font-bold text-white mb-4">¿Por qué es diferente?</h4>
                    <p className="text-gray-300 mb-6">
                      A diferencia de las matrices (dinero rápido), este es un plan de <span className="text-blue-400 font-bold">Profundidad Extrema</span>.
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-600/20 p-2 rounded-lg text-2xl">🌲</div>
                        <div>
                          <h5 className="font-bold text-white">Profundidad Nivel 27</h5>
                          <p className="text-sm text-gray-400">Imagina un árbol genealógico gigante. Cobras de millones de personas.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-600/20 p-2 rounded-lg text-2xl">⚖️</div>
                        <div>
                          <h5 className="font-bold text-white">Niveles Impares</h5>
                          <p className="text-sm text-gray-400">Te paga en los niveles 1, 3, 5... hasta el 27. ¡No tienes que llenar líneas completas!</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <h4 className="text-lg font-bold text-white mb-4">Datos Clave</h4>
                    <ul className="space-y-3 text-sm text-gray-300">
                      <li className="flex justify-between border-b border-slate-700 pb-2">
                        <span>Valor Punto (PV)</span>
                        <span className="text-blue-400 font-bold">$4,500 COP</span>
                      </li>
                      <li className="flex justify-between border-b border-slate-700 pb-2">
                        <span>Estructura</span>
                        <span className="text-blue-400 font-bold">Binaria (2x2)</span>
                      </li>
                      <li className="flex justify-between border-b border-slate-700 pb-2">
                        <span>Tipo de Ingreso</span>
                        <span className="text-blue-400 font-bold">Residual / Pasivo</span>
                      </li>
                    </ul>
                    <div className="mt-6">
                      <p className="text-xs text-gray-400 text-center mb-2">Potencial de Crecimiento</p>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-400 to-purple-600 w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600/10 p-8 rounded-2xl border border-blue-500/20">
                  <h4 className="text-2xl font-bold text-white mb-4">💡 Resumen para Visionarios</h4>
                  <p className="text-lg text-blue-100 italic">
                    "Las Matrices son para el día a día. El Binario Millonario es para tu jubilación. Construyes una vez, y cobras de una profundidad donde caben millones de personas."
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 bg-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">¿Estás listo para cambiar tu vida?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            La oportunidad perfecta en el momento perfecto. No dejes pasar el tren de la economía digital.
          </p>

          {/* Registration Form directly on page */}
          <div className="max-w-2xl mx-auto">
            <RegisterForm referralCode={refCode} />
          </div>

          <p className="mt-6 text-blue-200 text-sm">Registro 100% Seguro • Acceso Inmediato</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 py-10 text-center text-gray-500">
        <div className="container mx-auto px-4">
          <p>&copy; 2025 Tu Empresa Internacional. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Opportunity;
