import React, { useState } from 'react';
import { api } from '../../api/api';

const SecurityView = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState(""); // 'success' or 'error'

    // Access Password State
    const [accessPassword, setAccessPassword] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });

    // Transaction PIN State
    const [transactionPin, setTransactionPin] = useState({
        current_password: "",
        transaction_pin: "",
        confirm_pin: ""
    });

    const handleAccessPasswordChange = (e) => {
        const { name, value } = e.target;
        setAccessPassword(prev => ({ ...prev, [name]: value }));
    };

    const handleTransactionPinChange = (e) => {
        const { name, value } = e.target;
        setTransactionPin(prev => ({ ...prev, [name]: value }));
    };

    const handleChangeAccessPassword = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        // Validations
        if (!accessPassword.current_password) {
            setMessage("Por favor ingresa tu contraseña actual");
            setMessageType("error");
            setLoading(false);
            return;
        }

        if (!accessPassword.new_password || accessPassword.new_password.length < 8) {
            setMessage("La nueva contraseña debe tener al menos 8 caracteres");
            setMessageType("error");
            setLoading(false);
            return;
        }

        if (accessPassword.new_password !== accessPassword.confirm_password) {
            setMessage("Las contraseñas no coinciden");
            setMessageType("error");
            setLoading(false);
            return;
        }

        if (accessPassword.current_password === accessPassword.new_password) {
            setMessage("La nueva contraseña debe ser diferente a la actual");
            setMessageType("error");
            setLoading(false);
            return;
        }

        try {
            const response = await api.put('/auth/change-password', {
                current_password: accessPassword.current_password,
                new_password: accessPassword.new_password
            });

            setMessage("✅ Contraseña de acceso actualizada exitosamente");
            setMessageType("success");
            setAccessPassword({
                current_password: "",
                new_password: "",
                confirm_password: ""
            });

            // Clear message after 3 seconds
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            const errorMsg = error.response?.data?.detail || "Error al cambiar la contraseña";
            setMessage(`❌ ${errorMsg}`);
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    const handleSetTransactionPin = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        // Validations
        if (!transactionPin.current_password) {
            setMessage("Por favor ingresa tu contraseña actual");
            setMessageType("error");
            setLoading(false);
            return;
        }

        if (!transactionPin.transaction_pin || transactionPin.transaction_pin.length < 6) {
            setMessage("La clave de transacción debe tener exactamente 6 dígitos");
            setMessageType("error");
            setLoading(false);
            return;
        }

        if (!/^\d+$/.test(transactionPin.transaction_pin)) {
            setMessage("La clave de transacción solo debe contener números");
            setMessageType("error");
            setLoading(false);
            return;
        }

        if (transactionPin.transaction_pin !== transactionPin.confirm_pin) {
            setMessage("Las claves de transacción no coinciden");
            setMessageType("error");
            setLoading(false);
            return;
        }

        try {
            const response = await api.put('/auth/set-transaction-pin', {
                current_password: transactionPin.current_password,
                transaction_pin: transactionPin.transaction_pin
            });

            setMessage("✅ Clave de transacción configurada exitosamente");
            setMessageType("success");
            setTransactionPin({
                current_password: "",
                transaction_pin: "",
                confirm_pin: ""
            });

            // Clear message after 3 seconds
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            const errorMsg = error.response?.data?.detail || "Error al configurar la clave de transacción";
            setMessage(`❌ ${errorMsg}`);
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent mb-2">
                    🔒 Seguridad
                </h1>
                <p className="text-gray-600">Gestiona tus contraseñas y claves de seguridad</p>
            </div>

            {/* General Message */}
            {message && (
                <div className={`rounded-lg p-4 ${messageType === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    {message}
                </div>
            )}

            {/* Change Access Password */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">🔐 Cambiar Contraseña de Acceso</h2>
                    <p className="text-gray-600">Actualiza tu contraseña de acceso a la plataforma</p>
                </div>

                <form onSubmit={handleChangeAccessPassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Contraseña Actual
                        </label>
                        <input
                            type="password"
                            name="current_password"
                            value={accessPassword.current_password}
                            onChange={handleAccessPasswordChange}
                            placeholder="Ingresa tu contraseña actual"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nueva Contraseña
                        </label>
                        <input
                            type="password"
                            name="new_password"
                            value={accessPassword.new_password}
                            onChange={handleAccessPasswordChange}
                            placeholder="Mínimo 8 caracteres"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Confirmar Nueva Contraseña
                        </label>
                        <input
                            type="password"
                            name="confirm_password"
                            value={accessPassword.confirm_password}
                            onChange={handleAccessPasswordChange}
                            placeholder="Repite la nueva contraseña"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 font-semibold disabled:opacity-50"
                    >
                        {loading ? 'Actualizando...' : '💾 Actualizar Contraseña'}
                    </button>
                </form>
            </div>

            {/* Set Transaction PIN */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">🔑 Clave de Transacciones (PIN)</h2>
                    <p className="text-gray-600">
                        Configura un PIN numérico de 6 dígitos para proteger tus retiros y compras.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                        <strong>💡 Información:</strong> La clave de transacciones es requerida para:
                    </p>
                    <ul className="text-sm text-blue-800 mt-2 ml-4 space-y-1">
                        <li>• Compras de productos con saldo disponible</li>
                        <li>• Retiro de dinero de la billetera al banco</li>
                    </ul>
                </div>

                <form onSubmit={handleSetTransactionPin} className="space-y-4">
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-4">
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                            Paso 1: Tu Contraseña de Inicio de Sesión
                        </label>
                        <p className="text-xs text-gray-600 mb-2">
                            Para tu seguridad, ingresa la contraseña con la que inicias sesión en la página (NO es una clave anterior).
                        </p>
                        <input
                            type="password"
                            name="current_password"
                            value={transactionPin.current_password}
                            onChange={handleTransactionPinChange}
                            placeholder="Tu contraseña de acceso principal"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Paso 2: Nueva Clave (PIN)
                            </label>
                            <input
                                type="password"
                                name="transaction_pin"
                                value={transactionPin.transaction_pin}
                                onChange={handleTransactionPinChange}
                                placeholder="6 dígitos (ej: 123456)"
                                required
                                maxLength={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirmar Nueva Clave
                            </label>
                            <input
                                type="password"
                                name="confirm_pin"
                                value={transactionPin.confirm_pin}
                                onChange={handleTransactionPinChange}
                                placeholder="Repite los 6 dígitos"
                                required
                                maxLength={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-bold text-lg disabled:opacity-50 shadow-md mt-4"
                    >
                        {loading ? 'Configurando...' : '💾 Guardar Clave de Transacciones'}
                    </button>
                </form>
            </div>

            {/* Security Tips */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                <h3 className="text-lg font-bold text-gray-800 mb-3">⚠️ Recomendaciones de Seguridad</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                    <li>✓ Usa contraseñas fuertes con letras mayúsculas, minúsculas, números y símbolos</li>
                    <li>✓ No compartas tu contraseña ni clave de transacciones con nadie</li>
                    <li>✓ Cambia tu contraseña regularmente (cada 3-6 meses)</li>
                    <li>✓ Utiliza una clave de transacciones diferente a tu contraseña de acceso</li>
                    <li>✓ Ten cuidado con enlaces sospechosos o correos de phishing</li>
                </ul>
            </div>
        </div>
    );
};

export default SecurityView;
