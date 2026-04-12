import { History, Home, User } from 'lucide-react';
import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

function Item({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `h-11 w-11 rounded-full border flex items-center justify-center transition ${
          isActive
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-emerald-200 bg-white text-emerald-500 hover:text-emerald-700 hover:border-emerald-300'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <div className="fixed bottom-5 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-5 rounded-full spring-panel px-5 py-3">
        <Item to="/history">
          <History size={18} />
        </Item>
        <Item to="/">
          <Home size={18} />
        </Item>
        <Item to="/profile">
          <User size={18} />
        </Item>
      </div>
    </div>
  );
}
