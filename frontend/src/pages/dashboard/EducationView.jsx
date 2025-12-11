import React from 'react';

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
                        <h3 className="text-white font-bold text-xl">Introducción a TEI</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-600 mb-4">
                            Aprende los fundamentos del negocio, cómo funciona el plan de compensación y cómo empezar.
                        </p>
                        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                            Comenzar Curso
                        </button>
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
                <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
                        <div className="text-white text-4xl mb-2">🌳</div>
                        <h3 className="text-white font-bold text-xl">Construyendo tu Red</h3>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-600 mb-4">
                            Estrategias para reclutar, duplicar y construir una red sólida y rentable.
                        </p>
                        <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                            Comenzar Curso
                        </button>
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
                        <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors">
                            Comenzar Curso
                        </button>
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
