import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute: Verifica si el usuario está autenticado (tiene token en localStorage)
 * Si no está autenticado, redirige a /login guardando la ruta de origen para regresar después
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  const location = useLocation();

  if (!token) {
    const targetPath = `${location.pathname}${location.search || ''}`;
    return <Navigate to="/login" state={{ from: targetPath }} replace />;
  }

  // Token existe, muestra el contenido
  return children;
};

export default ProtectedRoute;
