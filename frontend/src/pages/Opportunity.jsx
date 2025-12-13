import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Opportunity = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 opacity-90 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center mix-blend-overlay z-0"></div>
        
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
            La plataforma definitiva que combina E-commerce, Educación Digital y un Plan de Compensación Híbrido para construir tu libertad financiera desde casa.
          </motion.p>
          <motion.div 
            {...fadeIn}
            transition={{ delay: 0.4 }}
            className="flex flex-col md:flex-row gap-4 justify-center"
          >
            <Link to="/register" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-lg font-bold hover:scale-105 transition-transform shadow-lg shadow-blue-500/30">
              Comenzar Ahora
            </Link>
            <a href="#plan" className="px-8 py-4 border border-white/30 rounded-full text-lg font-bold hover:bg-white/10 transition-colors backdrop-blur-sm">
              Ver Plan de Negocios
            </a>
          </motion.div>
        </div>
      </section>

      {/* PRODUCT LINES */}
      <section className="py-20 bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Nuestro Ecosistema</h2>
            <p className="text-gray-400 text-lg">Más que un negocio, un estilo de vida.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-slate-700/50 p-8 rounded-2xl border border-slate-600 hover:border-blue-500 transition-colors"
            >
              <div className="text-5xl mb-6">🛍️</div>
              <h3 className="text-2xl font-bold mb-4 text-blue-400">Tienda Virtual Global</h3>
              <p className="text-gray-300">
                Acceso a productos físicos y digitales de alta demanda. Tecnología, Salud, Belleza y más. Gana comisiones por cada venta directa sin preocuparte por el inventario.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-slate-700/50 p-8 rounded-2xl border border-slate-600 hover:border-purple-500 transition-colors"
            >
              <div className="text-5xl mb-6">🎓</div>
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Academia de Liderazgo</h3>
              <p className="text-gray-300">
                No solo ganas dinero, creces como persona. Cursos exclusivos de Marketing Digital, Criptoeconomía, Liderazgo y Ventas para potenciar tu éxito.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-slate-700/50 p-8 rounded-2xl border border-slate-600 hover:border-emerald-500 transition-colors"
            >
              <div className="text-5xl mb-6">🌐</div>
              <h3 className="text-2xl font-bold mb-4 text-emerald-400">Negocio Llave en Mano</h3>
              <p className="text-gray-300">
                Olvídate de programar o diseñar. Te entregamos tu propia oficina virtual, links de referidos y sistema de seguimiento automatizado desde el día 1.
              </p>
            </motion.div>
          </div>
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
                  <h4 className="text-xl font-bold text-white mb-2">Binario Global Infinito</h4>
                  <p className="text-gray-400">Construye dos equipos y gana un porcentaje del volumen total de tu pierna menor. ¡Sin límites de profundidad!</p>
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
                    <span className="font-bold text-green-400">$500 - $1,000 / mes</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-700 rounded-lg border-l-4 border-blue-500">
                    <span>Líder Ejecutivo</span>
                    <span className="font-bold text-green-400">$2,000 - $5,000 / mes</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-700 rounded-lg border-l-4 border-purple-500">
                    <span>Director Global</span>
                    <span className="font-bold text-green-400">$10,000+ / mes</span>
                  </div>
                </div>
                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-500 italic">*Resultados basados en esfuerzo y dedicación.</p>
                </div>
              </div>
            </div>
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
          <Link to="/register" className="inline-block px-12 py-5 bg-white text-blue-900 rounded-full text-xl font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-2xl">
            ¡Sí, Quiero Unirme Ahora!
          </Link>
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
