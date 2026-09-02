import React, { createContext, useState, useContext, useEffect } from 'react';

// Decode JWT without external library
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        return JSON.parse(window.atob(base64));
    } catch (e) {
        console.error("JWT Decode error:", e);
        return {};
    }
}

// Crear el contexto
const AdminContext = createContext();

// Proveedor del contexto
export const AdminProvider = ({ children }) => {
    // Lista de países gestionables (Fase 1)
    const [countries] = useState([
        'Todos',
        'Argentina',
        'Bolivia',
        'Brasil',
        'Chile',
        'Colombia',
        'Costa Rica',
        'Cuba',
        'Ecuador',
        'El Salvador',
        'Guatemala',
        'Haití',
        'Honduras',
        'Jamaica',
        'México',
        'Nicaragua',
        'Panamá',
        'Paraguay',
        'Perú',
        'Puerto Rico',
        'República Dominicana',
        'Uruguay',
        'Venezuela',
    ]);

    // Read role and assigned country from JWT token
    const getAdminInfo = () => {
        const token = localStorage.getItem('access_token');
        if (!token) return { role: 'user', assignedCountries: [] };
        const payload = parseJwt(token);
        
        let countries = [];
        if (payload.admin_country) {
            countries = payload.admin_country.split(',').map(c => c.trim()).filter(c => c);
        }
        return {
            role: payload.admin_role || 'user',
            assignedCountries: countries,
        };
    };

    const adminInfo = getAdminInfo();
    const isCountryAdmin = adminInfo.role === 'country_admin';
    const isSuperAdmin = adminInfo.role === 'superadmin';

    // País global seleccionado
    // country_admin: defaults to their FIRST assigned country
    // superadmin / no-role: defaults to 'Todos'
    const [globalCountry, _setGlobalCountry] = useState(
        isCountryAdmin ? (adminInfo.assignedCountries[0] || 'Todos') : 'Todos'
    );

    const setGlobalCountry = (value) => {
        // Country admins can ONLY select from their assigned countries
        if (isCountryAdmin && !adminInfo.assignedCountries.includes(value)) return;
        _setGlobalCountry(value);
    };

    return (
        <AdminContext.Provider value={{
            globalCountry,
            setGlobalCountry,
            countries,
            adminRole: adminInfo.role,
            assignedCountries: adminInfo.assignedCountries,
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
