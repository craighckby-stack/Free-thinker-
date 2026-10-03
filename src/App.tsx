/**
 * FREE THINKER ARCHITECTURAL ROOT
 * File: src/App.tsx
 * Role: Real application root mounting MainPage within robust error boundaries.
 */

import React from 'react';
import MainPage from './components/MainPage';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <MainPage />
    </ErrorBoundary>
  );
}


