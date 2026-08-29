// src/App.tsx
// Root app shell — routes the three Parish 25 pages.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Parish25Home from './pages/Parish25Home';
import Parish25Request from './pages/Parish25Request';
import Parish25Admin from './pages/Parish25Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Parish25Home />} />
        <Route path="/request" element={<Parish25Request />} />
        <Route path="/admin" element={<Parish25Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

