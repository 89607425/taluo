import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import SessionGuard from './components/common/SessionGuard';
import HistoryDetail from './pages/HistoryDetail';
import HistoryList from './pages/HistoryList';
import LiuyaoFlow from './pages/LiuyaoFlow';
import Portal from './pages/Portal';
import Profile from './pages/Profile';
import TarotFlow from './pages/TarotFlow';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <Routes>
          <Route path="/" element={<Portal />} />
          <Route path="/liuyao" element={<SessionGuard><LiuyaoFlow /></SessionGuard>} />
          <Route path="/liuyao/result" element={<SessionGuard><LiuyaoFlow /></SessionGuard>} />
          <Route path="/tarot" element={<SessionGuard><TarotFlow /></SessionGuard>} />
          <Route path="/tarot/spread" element={<SessionGuard><TarotFlow /></SessionGuard>} />
          <Route path="/tarot/reading" element={<SessionGuard><TarotFlow /></SessionGuard>} />
          <Route path="/history" element={<SessionGuard><HistoryList /></SessionGuard>} />
          <Route path="/history/:id" element={<SessionGuard><HistoryDetail /></SessionGuard>} />
          <Route path="/profile" element={<SessionGuard><Profile /></SessionGuard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
