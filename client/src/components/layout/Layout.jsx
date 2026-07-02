import { Outlet, useLocation, Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import Navbar from './Navbar';
import Footer from './Footer';

function AuthHeader() {
  return (
    <header className="w-full bg-white border-b border-slate-200/50 py-4 px-6 sm:px-10 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5">
        <img src={logoImg} alt="TrustBridge" style={{ height: 36, width: "auto", objectFit: "contain", display: "block" }} />
      </Link>
      <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
        Back to Home
      </Link>
    </header>
  );
}

export default function Layout() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {isAuthPage ? <AuthHeader /> : <Navbar />}
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
}
