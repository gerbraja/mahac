import React, { createContext, useState, useContext } from 'react';

// Crear el contexto
const AdminContext = createContext();

// Proveedor del contexto
export const AdminProvider = ({ children }) => {
    // Lista de países gestionables (Fase 1)
    const [countries] = useState([
        'Todos', 'Colombia', 'Ecuador', 'El Salvador', 'Panamá', 'Perú', 'Venezuela'
    ]);

    // País global seleccionado, por defecto 'Todos'
    const [globalCountry, setGlobalCountry] = useState('Todos');

    return (
        <AdminContext.Provider value={{
            globalCountry,
            setGlobalCountry,
            countries
        }}>
            {children}
        </AdminContext.Provider>
    );
};

// Hook personalizado para usar el contexto de administración
export const useAdmin = () => {
    return useContext(AdminContext);
};
