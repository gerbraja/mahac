import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute: Verifica si el usuario está autenticado (tiene token en localStorage)
 * Si no está autenticado, redirige a /login
 */
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    // No hay token, redirige a login
    return <Navigate to="/login" replace />;
  }

  // Token existe, muestra el contenido
  return children;
};

export default ProtectedRoute;
