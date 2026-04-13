import { History, Home, User } from 'lucide-react';
import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

function Item({ to, children, label }: { to: string; children: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `cf-nav-item h-12 w-12 rounded-2xl flex items-center justify-center relative ${
          isActive ? 'cf-nav-item-active' : ''
        }`
      }
      aria-label={label}
    >
      {children}
    </NavLink>
  );
}

export default function BottomNav() {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto cf-nav flex items-center gap-5 rounded-3xl px-5 py-3 shadow-2xl">
        <Item to="/history" label="历史">
          <History size={19} />
        </Item>
        <Item to="/" label="首页">
          <Home size={19} />
        </Item>
        <Item to="/profile" label="个人">
          <User size={19} />
        </Item>
      </div>
    </div>
  );
}
