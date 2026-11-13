import React, { useState } from 'react';
import { api } from '../../api/api';
import { Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck, Key, Lock, Check, X, Sparkles } from 'lucide-react';

const COMMON_SYMBOLS = ['*', '#', '$', '%', '&', '/', '@', '!', '?', '.', '-', '_'];

const SecurityView = () => {
    // Separate loading states
    const [loadingAccess, setLoadingAccess] = useState(false);
    const [loadingPin, setLoadingPin] = useState(false);

    // Form-specific messages
    const [accessMsg, setAccessMsg] = useState({ type: '', text: '' });
    const [pinMsg, setPinMsg] = useState({ type: '', text: '' });

    // Visibility toggles
    const [showAccessCurrent, setShowAccessCurrent] = useState(false);
    const [showAccessNew, setShowAccessNew] = useState(false);
    const [showAccessConfirm, setShowAccessConfirm] = useState(false);

    const [showPinCurrent, setShowPinCurrent] = useState(false);
    const [showPinNew, setShowPinNew] = useState(false);
    const [showPinConfirm, setShowPinConfirm] = useState(false);

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
        if (accessMsg.text) setAccessMsg({ type: '', text: '' });
    };

    const handleTransactionPinChange = (e) => {
        const { name, value } = e.target;
        setTransactionPin(prev => ({ ...prev, [name]: value }));
        if (pinMsg.text) setPinMsg({ type: '', text: '' });
    };

    const handleInsertSymbol = (symbol) => {
        setTransactionPin(prev => {
            const current = prev.transaction_pin || '';
            if (current.length >= 12) return prev;
            return { ...prev, transaction_pin: current + symbol };
        });
        if (pinMsg.text) setPinMsg({ type: '', text: '' });
    };

    // Helper to safely extract error message from API
    const parseApiError = (error, defaultMsg) => {
        if (error.response?.data?.detail) {
            const detail = error.response.data.detail;
            if (typeof detail === 'string') return detail;
            if (Array.isArray(detail)) return detail.map(d => d.msg || JSON.stringify(d)).join(', ');
            return JSON.stringify(detail);
        }
        if (error.message) return error.message;
        return defaultMsg;
    };

    // Live validation rules for transaction PIN
    const pin = transactionPin.transaction_pin || '';
    const confirmPin = transactionPin.confirm_pin || '';
    
    // Check uppercase including Spanish accents/Ñ
    const hasUppercase = /[A-ZÁÉÍÓÚÑ]/.test(pin);
    // Check number 0-9
    const hasNumber = /[0-9]/.test(pin);
    // Check special character
    const hasSpecial = /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s]/.test(pin) || /[*#$%\&/()=?¿!¡+\-_.:;,@~^{}\[\]<>|\\'"\`]/.test(pin);
    // Length check
    const hasLength = pin.length >= 8 && pin.length <= 12;
    // Match check
    const hasMatch = pin.length > 0 && confirmPin.length > 0 && pin === confirmPin;

    const pinRules = {
        length: hasLength,
        uppercase: hasUppercase,
        number: hasNumber,
        special: hasSpecial,
        match: hasMatch
    };

    const handleChangeAccessPassword = async (e) => {
        e.preventDefault();
        setAccessMsg({ type: '', text: '' });
        setLoadingAccess(true);

        if (!accessPassword.current_password) {
            setAccessMsg({ type: 'error', text: "Por favor ingresa tu contraseña actual." });
            setLoadingAccess(false);
            return;
        }

        if (!accessPassword.new_password || accessPassword.new_password.length < 8) {
            setAccessMsg({ type: 'error', text: "La nueva contraseña debe tener al menos 8 caracteres." });
            setLoadingAccess(false);
            return;
        }

        if (accessPassword.new_password !== accessPassword.confirm_password) {
            setAccessMsg({ type: 'error', text: "Las contraseñas no coinciden." });
            setLoadingAccess(false);
            return;
        }

        if (accessPassword.current_password === accessPassword.new_password) {
            setAccessMsg({ type: 'error', text: "La nueva contraseña debe ser diferente a la actual." });
            setLoadingAccess(false);
            return;
        }

        try {
            await api.put('/auth/change-password', {
                current_password: accessPassword.current_password,
                new_password: accessPassword.new_password
            });

            setAccessMsg({ type: 'success', text: "✅ Contraseña de acceso actualizada exitosamente." });
            setAccessPassword({
                current_password: "",
                new_password: "",
                confirm_password: ""
            });

            setTimeout(() => setAccessMsg({ type: '', text: '' }), 5000);
        } catch (error) {
            const errorMsg = parseApiError(error, "Error al cambiar la contraseña.");
            setAccessMsg({ type: 'error', text: `❌ ${errorMsg}` });
        } finally {
            setLoadingAccess(false);
        }
    };

    const handleSetTransactionPin = async (e) => {
        e.preventDefault();
        setPinMsg({ type: '', text: '' });
        setLoadingPin(true);

        // Step 1 check
        if (!transactionPin.current_password) {
            setPinMsg({ type: 'error', text: "❌ Por favor ingresa tu contraseña de inicio de sesión en el Paso 1." });
            setLoadingPin(false);
            return;
        }

        // Granular PIN validation with individual messages
        if (!pinRules.length) {
            setPinMsg({ type: 'error', text: `❌ Tu clave debe tener entre 8 y 12 caracteres (actualmente tiene ${pin.length}).` });
            setLoadingPin(false);
            return;
        }

        if (!pinRules.uppercase) {
            setPinMsg({ type: 'error', text: "❌ Falta al menos una letra mayúscula (A-Z). Asegúrate de incluir una letra en mayúscula." });
            setLoadingPin(false);
            return;
        }

        if (!pinRules.number) {
            setPinMsg({ type: 'error', text: "❌ Falta al menos un número (0-9). Agrega al menos un dígito a tu clave." });
            setLoadingPin(false);
            return;
        }

        if (!pinRules.special) {
            setPinMsg({ type: 'error', text: "❌ Falta un símbolo especial. Agrega al menos un símbolo como *, #, $, %, &, /, @, !, ?, ., -, _" });
            setLoadingPin(false);
            return;
        }

        if (!pinRules.match) {
            setPinMsg({ type: 'error', text: "❌ Las claves de transacción no coinciden. Verifica que la confirmación sea exactamente igual." });
            setLoadingPin(false);
            return;
        }

        try {
            await api.put('/auth/set-transaction-pin', {
                current_password: transactionPin.current_password,
                transaction_pin: transactionPin.transaction_pin
            });

            setPinMsg({ type: 'success', text: "✅ ¡Clave de transacciones guardada exitosamente! Ahora tus retiros y transferencias están 100% protegidos." });
            setTransactionPin({
                current_password: "",
                transaction_pin: "",
                confirm_pin: ""
            });

            setTimeout(() => setPinMsg({ type: '', text: '' }), 8000);
        } catch (error) {
            const errorMsg = parseApiError(error, "Error al configurar la clave de transacción.");
            setPinMsg({ type: 'error', text: `❌ ${errorMsg}` });
        } finally {
            setLoadingPin(false);
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-8 h-8 text-red-600 inline" /> Seguridad
                </h1>
                <p className="text-gray-600 text-sm md:text-base">Gestiona tus contraseñas de acceso y claves de seguridad para transacciones.</p>
            </div>

            {/* Change Access Password */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
                <div className="mb-6 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">🔐 Cambiar Contraseña de Acceso</h2>
                        <p className="text-gray-500 text-sm">Actualiza tu contraseña con la que ingresas a la plataforma</p>
                    </div>
                </div>

                {accessMsg.text && (
                    <div className={`rounded-xl p-4 mb-5 flex items-center gap-3 text-sm font-semibold transition-all ${
                        accessMsg.type === 'success'
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                        {accessMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                        <span>{accessMsg.text}</span>
                    </div>
                )}

                <form onSubmit={handleChangeAccessPassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Contraseña Actual
                        </label>
                        <div className="relative">
                            <input
                                type={showAccessCurrent ? "text" : "password"}
                                name="current_password"
                                value={accessPassword.current_password}
                                onChange={handleAccessPasswordChange}
                                placeholder="Ingresa tu contraseña actual"
                                required
                                className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowAccessCurrent(!showAccessCurrent)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                title={showAccessCurrent ? "Ocultar" : "Mostrar"}
                            >
                                {showAccessCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Nueva Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showAccessNew ? "text" : "password"}
                                    name="new_password"
                                    value={accessPassword.new_password}
                                    onChange={handleAccessPasswordChange}
                                    placeholder="Mínimo 8 caracteres"
                                    required
                                    className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAccessNew(!showAccessNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                    title={showAccessNew ? "Ocultar" : "Mostrar"}
                                >
                                    {showAccessNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                Confirmar Nueva Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showAccessConfirm ? "text" : "password"}
                                    name="confirm_password"
                                    value={accessPassword.confirm_password}
                                    onChange={handleAccessPasswordChange}
                                    placeholder="Repite la nueva contraseña"
                                    required
                                    className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAccessConfirm(!showAccessConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                    title={showAccessConfirm ? "Ocultar" : "Mostrar"}
                                >
                                    {showAccessConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loadingAccess}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold disabled:opacity-50 shadow-md"
                    >
                        {loadingAccess ? 'Actualizando...' : '💾 Actualizar Contraseña de Acceso'}
                    </button>
                </form>
            </div>

            {/* Set Transaction PIN */}
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
                <div className="mb-6 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Key className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">🔑 Clave de Transacciones (PIN)</h2>
                        <p className="text-gray-500 text-sm">
                            Configura una clave segura de 8 a 12 caracteres para proteger tus retiros y operaciones financieras.
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <p className="text-sm font-semibold text-blue-900">
                        💡 ¿Para qué se utiliza la Clave de Transacciones?
                    </p>
                    <ul className="text-xs md:text-sm text-blue-800 mt-2 space-y-1">
                        <li>• Retiros de dinero de la billetera a tu cuenta bancaria</li>
                        <li>• Compras de productos utilizando tu saldo disponible</li>
                        <li>• Pagos en servicios de transporte y comercios aliados</li>
                        <li>• Transferencias directas de saldo entre usuarios</li>
                    </ul>
                </div>

                <form onSubmit={handleSetTransactionPin} className="space-y-5">
                    {/* Paso 1: Contraseña de sesión */}
                    <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200">
                        <label className="block text-sm font-bold text-gray-800 mb-1">
                            Paso 1: Tu Contraseña de Inicio de Sesión
                        </label>
                        <p className="text-xs text-gray-600 mb-2">
                            Para tu seguridad, ingresa la contraseña con la que inicias sesión en la página TEI (NO es una clave anterior ni un PIN).
                        </p>
                        <div className="relative">
                            <input
                                type={showPinCurrent ? "text" : "password"}
                                name="current_password"
                                value={transactionPin.current_password}
                                onChange={handleTransactionPinChange}
                                placeholder="Tu contraseña con la que entras a la plataforma"
                                required
                                className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPinCurrent(!showPinCurrent)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                title={showPinCurrent ? "Ocultar" : "Mostrar"}
                            >
                                {showPinCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Paso 2: Nuevo PIN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-bold text-gray-800">
                                    Paso 2: Nueva Clave (PIN)
                                </label>
                                <span className={`text-xs font-mono font-bold ${pin.length >= 8 && pin.length <= 12 ? 'text-green-600' : 'text-gray-500'}`}>
                                    {pin.length}/12 caracteres
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                                Entre 8 y 12 caracteres (mayúscula, número y símbolo).
                            </p>
                            <div className="relative">
                                <input
                                    type={showPinNew ? "text" : "password"}
                                    name="transaction_pin"
                                    value={transactionPin.transaction_pin}
                                    onChange={handleTransactionPinChange}
                                    placeholder="Ej: Tei*2026 o Clave#789"
                                    required
                                    maxLength={12}
                                    className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-base"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPinNew(!showPinNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                    title={showPinNew ? "Ocultar" : "Mostrar"}
                                >
                                    {showPinNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Barra rápida de símbolos para insertar */}
                            <div className="mt-2">
                                <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-1">
                                    <Sparkles className="w-3 h-3 text-blue-500" />
                                    <span>Haz clic para agregar un símbolo:</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {COMMON_SYMBOLS.map((sym) => (
                                        <button
                                            key={sym}
                                            type="button"
                                            onClick={() => handleInsertSymbol(sym)}
                                            className="px-2 py-0.5 text-xs font-bold font-mono bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded transition-colors active:scale-95"
                                            title={`Agregar símbolo ${sym}`}
                                        >
                                            {sym}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-800 mb-1">
                                Confirmar Nueva Clave
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Repite exactamente la misma clave para confirmar.
                            </p>
                            <div className="relative">
                                <input
                                    type={showPinConfirm ? "text" : "password"}
                                    name="confirm_pin"
                                    value={transactionPin.confirm_pin}
                                    onChange={handleTransactionPinChange}
                                    placeholder="Repite la nueva clave"
                                    required
                                    maxLength={12}
                                    className="w-full px-4 py-3 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-base"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPinConfirm(!showPinConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                    title={showPinConfirm ? "Ocultar" : "Mostrar"}
                                >
                                    {showPinConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Requisitos visuales claros en tiempo real */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                            Estado de Requisitos en Tiempo Real:
                        </span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {/* Requisito 1: Longitud */}
                            <div className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                                pinRules.length 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                                    : 'bg-red-50/70 border-red-200 text-red-800'
                            }`}>
                                <div className="flex items-center gap-1.5 font-medium">
                                    {pinRules.length ? <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <X className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                    <span>8 a 12 caracteres ({pin.length}/12)</span>
                                </div>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    pinRules.length ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                                }`}>
                                    {pinRules.length ? '✓ Cumplido' : '✗ Falta'}
                                </span>
                            </div>

                            {/* Requisito 2: Mayúscula */}
                            <div className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                                pinRules.uppercase 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                                    : 'bg-red-50/70 border-red-200 text-red-800'
                            }`}>
                                <div className="flex items-center gap-1.5 font-medium">
                                    {pinRules.uppercase ? <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <X className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                    <span>Al menos una mayúscula (A-Z)</span>
                                </div>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    pinRules.uppercase ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                                }`}>
                                    {pinRules.uppercase ? '✓ Cumplido' : '✗ Falta'}
                                </span>
                            </div>

                            {/* Requisito 3: Número */}
                            <div className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                                pinRules.number 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                                    : 'bg-red-50/70 border-red-200 text-red-800'
                            }`}>
                                <div className="flex items-center gap-1.5 font-medium">
                                    {pinRules.number ? <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <X className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                    <span>Al menos un número (0-9)</span>
                                </div>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    pinRules.number ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                                }`}>
                                    {pinRules.number ? '✓ Cumplido' : '✗ Falta'}
                                </span>
                            </div>

                            {/* Requisito 4: Símbolo Especial */}
                            <div className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                                pinRules.special 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                                    : 'bg-red-50/70 border-red-200 text-red-800'
                            }`}>
                                <div className="flex items-center gap-1.5 font-medium">
                                    {pinRules.special ? <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <X className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                    <span>Un símbolo (*, #, $, @, !, etc.)</span>
                                </div>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    pinRules.special ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                                }`}>
                                    {pinRules.special ? '✓ Cumplido' : '✗ Falta'}
                                </span>
                            </div>

                            {/* Requisito 5: Coincidencia */}
                            {pin.length > 0 && confirmPin.length > 0 && (
                                <div className={`sm:col-span-2 flex items-center justify-between p-2 rounded-lg border text-xs ${
                                    pinRules.match 
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                                        : 'bg-red-50/70 border-red-200 text-red-800'
                                }`}>
                                    <div className="flex items-center gap-1.5 font-medium">
                                        {pinRules.match ? <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <X className="w-4 h-4 text-red-500 flex-shrink-0" />}
                                        <span>{pinRules.match ? '¡Las dos claves coinciden exactamente!' : 'Las dos claves no coinciden todavía'}</span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                        pinRules.match ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                                    }`}>
                                        {pinRules.match ? '✓ Coinciden' : '✗ No coinciden'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mensaje de estado visible DIRECTAMENTE en el formulario */}
                    {pinMsg.text && (
                        <div className={`rounded-xl p-4 flex items-center gap-3 text-sm font-semibold transition-all ${
                            pinMsg.type === 'success'
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                            {pinMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                            <span>{pinMsg.text}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loadingPin}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3.5 rounded-xl transition-all duration-300 font-bold text-base md:text-lg disabled:opacity-50 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                        {loadingPin ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Guardando Clave...
                            </>
                        ) : (
                            '💾 Guardar Clave de Transacciones'
                        )}
                    </button>
                </form>
            </div>

            {/* Security Tips */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-600" /> Recomendaciones de Seguridad
                </h3>
                <ul className="space-y-1.5 text-xs md:text-sm text-gray-700">
                    <li>✓ No compartas tu contraseña ni clave de transacciones con nadie, ni siquiera con el equipo de soporte.</li>
                    <li>✓ Utiliza una clave de transacciones diferente a tu contraseña de inicio de sesión.</li>
                    <li>✓ Puedes hacer clic en cualquiera de los símbolos rápidos (<code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">* # $ % &amp; / @ ! ? . - _</code>) para insertarlo al instante.</li>
                    <li>✓ Cambia tus contraseñas regularmente para mantener tu cuenta segura.</li>
                </ul>
            </div>
        </div>
    );
};

export default SecurityView;
