import React, { createContext, useState, useContext, useEffect } from 'react';

// Decode JWT without external library
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch {
        return {};
    }
}

// Crear el contexto
const AdminContext = createContext();

// Proveedor del contexto
export const AdminProvider = ({ children }) => {
    // Lista de países gestionables (Fase 1)
    const [countries] = useState([
        'Todos', 'Colombia', 'Ecuador', 'El Salvador', 'Panamá', 'Perú', 'Venezuela'
    ]);

    // Read role and assigned country from JWT token
    const getAdminInfo = () => {
        const token = localStorage.getItem('token');
        if (!token) return { role: 'user', assignedCountry: null };
        const payload = parseJwt(token);
        return {
            role: payload.admin_role || 'user',
            assignedCountry: payload.admin_country || null,
        };
    };

    const adminInfo = getAdminInfo();
    const isCountryAdmin = adminInfo.role === 'country_admin';
    const isSuperAdmin = adminInfo.role === 'superadmin';

    // País global seleccionado
    // country_admin: locked to their assigned country
    // superadmin / no-role: defaults to 'Todos'
    const [globalCountry, _setGlobalCountry] = useState(
        isCountryAdmin ? (adminInfo.assignedCountry || 'Todos') : 'Todos'
    );

    const setGlobalCountry = (value) => {
        // Country admins cannot change the country filter
        if (isCountryAdmin) return;
        _setGlobalCountry(value);
    };

    return (
        <AdminContext.Provider value={{
            globalCountry,
            setGlobalCountry,
            countries,
            adminRole: adminInfo.role,
            adminCountry: adminInfo.assignedCountry,
            isCountryAdmin,
            isSuperAdmin,
        }}>
            {children}
        </AdminContext.Provider>
    );
};

// Hook personalizado para usar el contexto de administración
export const useAdmin = () => {
    return useContext(AdminContext);
};
