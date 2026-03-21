import React from 'react';
import { Link } from 'react-router-dom';

const EducationView = () => {
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-2">
                    📚 Centro de Educación
                </h1>
                <p className="text-gray-600">Aprende todo sobre tu negocio TEI</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Curso 1 */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                        <div className="text-white text-4xl mb-2">🎓</div>
                        <h3 className="text-white font-bold text-xl">Presentación de Negocio</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-600 mb-4">
                            Descubre el ecosistema completo de TEI y cómo construir tu libertad financiera.
                        </p>
                        <Link to="/opportunity" className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:scale-105 transition-transform font-bold shadow-lg">
                            🚀 Tu Página de Captura
                        </Link>
                    </div>
                </div>

                {/* Curso 2 */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
                        <div className="text-white text-4xl mb-2">💰</div>
                        <h3 className="text-white font-bold text-xl">Plan de Compensación</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-600 mb-4">
                            Entiende cómo ganar comisiones, bonos y cómo maximizar tus ingresos.
                        </p>
                        <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                            Comenzar Curso
                        </button>
                    </div>
                </div>

                {/* Curso 3 */}
                <div className="bg-white rounded-xl shadow-lg flex flex-col overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-purple-100">
                    <div className="h-40 relative bg-purple-900 overflow-hidden group">
                        <img src="/course_assets/network_building_cover.png" alt="Construyendo tu Red" className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/90 via-purple-900/40 to-transparent flex flex-col justify-end p-6">
                            <h3 className="text-white font-bold text-xl drop-shadow-md flex items-center gap-2">
                                <span>🌳</span> Construyendo tu Red
                            </h3>
                        </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                        <p className="text-gray-600 mb-6 flex-1">
                            Estrategias para reclutar, duplicar y construir una red sólida y rentable.
                        </p>
                        <Link to="/dashboard/education/network" className="block w-full text-center bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 hover:shadow-lg transition-all font-bold group-hover:bg-purple-700">
                            Comenzar Curso
                        </Link>
                    </div>
                </div>

                {/* Curso 4 */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
                        <div className="text-white text-4xl mb-2">📱</div>
                        <h3 className="text-white font-bold text-xl">Marketing Digital</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-600 mb-4">
                            Aprende a usar redes sociales y marketing digital para hacer crecer tu negocio.
                        </p>
                        <Link to="/dashboard/education/marketing" className="block w-full text-center bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors font-semibold">
                            Comenzar Curso
                        </Link>
                    </div>
                </div>

                {/* Curso 5 */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-6">
                        <div className="text-white text-4xl mb-2">🎯</div>
                        <h3 className="text-white font-bold text-xl">Liderazgo</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-600 mb-4">
                            Desarrolla habilidades de liderazgo para guiar y motivar a tu equipo.
                        </p>
                        <button className="w-full bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors">
                            Comenzar Curso
                        </button>
                    </div>
                </div>

                {/* Curso 6 */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6">
                        <div className="text-white text-4xl mb-2">💎</div>
                        <h3 className="text-white font-bold text-xl">Productos TEI</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-600 mb-4">
                            Conoce a fondo los productos y servicios que ofrece TEI.
                        </p>
                        <button className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors">
                            Comenzar Curso
                        </button>
                    </div>
                </div>
            </div>

            {/* Resources Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">📖 Recursos Adicionales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="#" className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                        <span className="text-2xl">📄</span>
                        <div>
                            <h4 className="font-semibold text-gray-800">Manual del Distribuidor</h4>
                            <p className="text-sm text-gray-600">Guía completa en PDF</p>
                        </div>
                    </a>
                    <a href="#" className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                        <span className="text-2xl">🎥</span>
                        <div>
                            <h4 className="font-semibold text-gray-800">Videos de Capacitación</h4>
                            <p className="text-sm text-gray-600">Biblioteca de videos</p>
                        </div>
                    </a>
                    <a href="#" className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                        <span className="text-2xl">📊</span>
                        <div>
                            <h4 className="font-semibold text-gray-800">Presentaciones</h4>
                            <p className="text-sm text-gray-600">Material para prospectos</p>
                        </div>
                    </a>
                    <a href="#" className="flex items-center gap-3 p-4 bg-white rounded-lg hover:shadow-md transition-shadow">
                        <span className="text-2xl">💬</span>
                        <div>
                            <h4 className="font-semibold text-gray-800">Comunidad</h4>
                            <p className="text-sm text-gray-600">Únete al grupo de Telegram</p>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default EducationView;
