import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import RegisterForm from '../components/auth/RegisterForm';

const Opportunity = () => {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const [activeFaq, setActiveFaq] = useState(null);

  const scrollToRegister = () => {
    document.getElementById('register-section')?.scrollIntoView({ behavior: 'smooth' });
  };

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
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] z-0"></div>

        <div className="container mx-auto px-4 z-10 text-center">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]"
          >
            Tu Empresa Internacional
          </motion.h1>
          <motion.p
            {...fadeIn}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-white font-semibold mb-10 max-w-4xl mx-auto drop-shadow-[0_2px_4px_rgba(0,0,0,1)] px-4 leading-relaxed tracking-wide"
          >
            Eliminamos los intermediarios. ¿Te gustaría comprar directamente de las fabricas y Generar dinero por Recomendar? Imagine miles de Fabricas globales desde Electrodomésticos, vestuario, alta moda, tecnología, movilidad, etc. - Enviando sus productos directamente a la puerta de Tu Hogar.
          </motion.p>

          <motion.button
            onClick={scrollToRegister}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-4 px-10 rounded-full text-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-400/30 backdrop-blur-sm transition-all animate-pulse"
          >
            🛡️ Reservar mi Posición GRATIS Ahora
          </motion.button>
        </div>
      </section>


      {/* PRODUCT LINES / ECOSYSTEM */}
      <section className="py-20 bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Nuestro Ecosistema</h2>
            <p className="text-gray-400 text-lg">Más que un negocio, un estilo de vida.</p>
          </div>

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
              Plan de Compensación Híbrido Sostenible
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
                  <h4 className="text-xl font-bold text-white mb-2">Apalancamiento de Equipo Global</h4>
                  <p className="text-gray-400">Benefíciate del crecimiento de la red internacional que cae debajo de ti.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xl shrink-0">3</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Matrices Forzadas</h4>
                  <p className="text-gray-400">Pequeños equipos, ganancias rápidas.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-600 flex items-center justify-center font-bold text-xl shrink-0">4</div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2">Bonos de Rango y Honor</h4>
                  <p className="text-gray-400">Premios de lujo, viajes y bonos en efectivo. Desde Silver hasta Diamond Elite.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-3xl opacity-20 rounded-full"></div>
              <div className="relative bg-slate-800 p-8 rounded-3xl border border-slate-600 shadow-2xl">
                <div className="text-center mb-8">
                  <span className="text-6xl">🚀</span>
                  <h3 className="text-2xl font-bold mt-4">Ejemplos de Proyección Matemática</h3>
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
                  <p className="text-sm text-gray-500 italic">*Las cifras presentadas son ejemplos matemáticos del plan de compensación y no constituyen una promesa ni garantía de ingresos fijos. El éxito en este negocio depende 100% del liderazgo, las ventas efectivas y el esfuerzo del distribuidor independiente.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-24 space-y-24">
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

                <div className="text-left space-y-12 max-w-4xl mx-auto font-light">
                  <div className="prose prose-invert max-w-none text-center">
                    <p className="text-xl text-gray-300 leading-relaxed font-light">
                      🚀 "Olvída todo lo que creías saber sobre las redes de mercadeo. Tu Empresa Internacional (TEI) no vino a participar en la industria, vino a reescribir sus reglas. Nos adelantamos al futuro fusionando el e-commerce de productos reales con un plan de compensación inquebrantable. <span className="text-white font-semibold">Esta es la evolución definitiva donde por fin, el poder y la riqueza regresan a tus manos.</span>"
                    </p>
                  </div>

                  <div className="bg-blue-900/20 rounded-2xl p-8 border border-blue-500/30 font-light">
                    <h4 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                      <span>🎬</span> La Analogía del "Cine Inteligente"
                    </h4>
                    <p className="text-gray-300 italic mb-4 font-light">
                      "Imagina que entras a un estreno mundial. Llegas temprano y apartas tu asiento gratis. El cine se llena con gente de todo el mundo. Por haber llegado primero, recibes una parte de lo que pagaron los que entraron después."
                    </p>
                    <p className="font-bold text-white text-center text-lg">
                      ¿Te quedarías fuera de la sala sabiendo que se va a llenar de todos modos?
                    </p>
                  </div>

                  <div className="mt-12 text-center">
                    <motion.button
                      onClick={scrollToRegister}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold py-4 px-10 rounded-full text-xl shadow-lg transition-all"
                    >
                      🛡️ Reservar mi Posición GRATIS Ahora
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Matrices Simplified */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-slate-800/80 rounded-3xl p-8 md:p-12 border border-emerald-500/30 relative overflow-hidden text-center"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>

              <span className="text-4xl mb-4 block">🏗️</span>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Matrices Forzadas</h3>
              <p className="text-xl text-emerald-300 mb-8 font-semibold">Pequeños equipos, ganancias rápidas</p>
              
              <div className="max-w-3xl mx-auto">
                <p className="text-lg text-gray-300 leading-relaxed mb-8">
                  Nuestro sistema inteligente de matrices permite que equipos compactos generen resultados extraordinarios de forma cíclica. Es la herramienta perfecta para capitalizar tu negocio mientras construyes tu visión a largo plazo.
                </p>
                <div className="bg-emerald-900/30 p-6 rounded-2xl border border-emerald-500/20">
                  <p className="text-emerald-200 text-lg italic">
                    "Es como llenar un autobús de 12 pasajeros. Cuando se llena, te paga y te da un boleto gratis para el siguiente viaje."
                  </p>
                </div>
              </div>
            </motion.div>

            {/* MISSION SECTION */}
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="py-24 bg-white text-slate-900 rounded-3xl"
            >
              <div className="container mx-auto px-4 max-w-4xl text-center">
                <span className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-4 block">Nuestra Razón de Ser</span>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight text-slate-900">
                  🌍 Creemos en la <span className="text-blue-600">Gran Revolución de las Personas Felices</span>
                </h2>
                
                <div className="space-y-6 text-xl text-gray-700 leading-relaxed text-left md:text-center">
                  <p className="font-semibold text-slate-900 border-l-4 md:border-l-0 md:border-b-4 border-blue-500 pl-4 md:pl-0 md:pb-4 inline-block">
                    🏛️ Bienvenido a la nueva era del emprendimiento.
                  </p>
                  <p>
                    Tu Empresa Internacional (TEI) tomó lo mejor del network marketing, eliminó sus fallas y se adelantó décadas hacia el futuro.
                  </p>
                  <p className="font-medium text-slate-800">
                    Hemos Construido una Maquinaria Legal, Tecnológica y Humana Tan Poderosa, que Va a Revolucionar Para Siempre la Forma en que el Mundo Genera Ingresos Desde Casa.
                  </p>
                </div>
              </div>
            </motion.section>

            {/* FAQ SECTION */}
            <section className="py-24 bg-slate-900/50 rounded-3xl border border-slate-800">
              <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center mb-16">
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">🛡️ Tus Dudas Resueltas</h2>
                  <p className="text-blue-300 text-lg">Seguridad y Claridad Total</p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      q: "¿TEI es una pirámide?",
                      a: "No. Somos una empresa legalmente constituida en Colombia como TU EMPRESA INTERNACIONAL S.A.S. (TEI S.A.S.), regida y vigilada bajo la Ley 1700 de 2013 (Ley de Multinivel). Nuestras comisiones provienen exclusivamente de la venta real de productos tangibles y educación, no de la simple entrada de personas. Cumplimos con todos los requisitos fiscales de la DIAN."
                    },
                    {
                      q: "¿Tengo que pagar para unirme a TEI?",
                      a: "No. El registro inicial es 100% GRATIS. Esto te permite asegurar tu posición en el Binario Global y observar cómo crece la red por derrame. Luego, tú eliges cómo activarte."
                    },
                    {
                      q: "¿Cuándo y cómo recibo mi dinero?",
                      a: "¡Por Bre-B, o transferencia Bancaria directo a tu banco! Pagamos comisiones los días 10, 20 y 30 de cada mes. El dinero llega al instante a la cuenta bancaria de tu elección en pesos colombianos."
                    },
                    {
                      q: "¿Autoconsumo obligatorio?",
                      a: "No de manera obligatoria. TEI cree en el consumo inteligente. Tú eres libre de comprar tus productos cuando los necesites."
                    },
                    {
                      q: "¿La educación tiene costo?",
                      a: "La capacitación corporativa es gratuita. Nuestra Academia de Liderazgo Marketing Digital Élite tiene un costo de $287.000 COP, que queda como abono para tus futuros productos físicos."
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                      <button
                        onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-700 transition-colors"
                      >
                        <span className="text-lg font-bold text-white">{item.q}</span>
                        <span className={`text-2xl text-blue-400 transition-transform ${activeFaq === idx ? 'rotate-45' : ''}`}>+</span>
                      </button>
                      <motion.div
                        initial={false}
                        animate={{ height: activeFaq === idx ? 'auto' : 0, opacity: activeFaq === idx ? 1 : 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 pt-0 text-gray-300 leading-relaxed border-t border-slate-700/50">
                          {item.a}
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* REGISTRATION SECTION */}
      <section id="register-section" className="py-24 bg-blue-900 relative">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">¿Estás listo para tu nueva vida?</h2>
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-2xl text-slate-900 border border-white/20 backdrop-blur-sm">
            <RegisterForm referralCode={refCode} />
            <p className="mt-6 text-gray-500 text-sm italic">
              He leído y acepto los Términos y Condiciones, incluyendo las políticas de privacidad, tratamiento de datos y la Tasa Cambiaria Fija de $4.500 COP/USD.
            </p>
            <button 
              onClick={() => document.querySelector('form')?.requestSubmit()}
              className="mt-8 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-12 rounded-full text-xl shadow-xl transition-all w-full"
            >
              ✅ Crear Cuenta Completar →
            </button>
          </div>
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
