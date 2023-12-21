import React from 'react';
import App from './App';
import Submit from './Submit';
import Proposals from './Proposals';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { createRoot } from 'react-dom/client';

import './index.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/proposals" element={<Proposals />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
