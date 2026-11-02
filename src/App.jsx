import { Routes, Route, NavLink } from 'react-router-dom';
import PDV from './pages/PDV.jsx';
import Fiado from './pages/Fiado.jsx';

const abas = [
  { to: '/', label: 'Vender', icone: '🛒' },
  { to: '/fiado', label: 'Fiado', icone: '📒' }
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col pb-24">
      <main className="flex-1 p-4">
        <Routes>
          <Route path="/" element={<PDV />} />
          <Route path="/fiado" element={<Fiado />} />
        </Routes>
      </main>

      <nav
        aria-label="Menu principal"
        className="fixed bottom-0 inset-x-0 bg-white border-t-4 border-slate-300 grid grid-cols-2"
      >
        {abas.map((aba) => (
          <NavLink
            key={aba.to}
            to={aba.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[80px] text-xl font-bold ${
                isActive ? 'bg-blue-700 text-white' : 'text-slate-700'
              }`
            }
          >
            <span className="text-3xl" aria-hidden="true">{aba.icone}</span>
            {aba.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
