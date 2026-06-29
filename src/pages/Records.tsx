import React from 'react';
import { Navigate } from 'react-router-dom';

export function Records() {
  // Redirecting to Patients view as it handles the Prontuários list in this app structure
  return <Navigate to="/patients" replace />;
}
