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
            ? 'border-amber-300/70 bg-amber-300/10 text-amber-200'
            : 'border-zinc-700 bg-zinc-900/70 text-zinc-300 hover:text-amber-200 hover:border-amber-300/40'
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
      <div className="pointer-events-auto flex items-center gap-5 rounded-full border border-zinc-700 bg-zinc-950/80 px-5 py-3 backdrop-blur">
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
