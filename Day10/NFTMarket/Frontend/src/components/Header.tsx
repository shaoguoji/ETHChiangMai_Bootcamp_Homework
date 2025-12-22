
import { Link, useLocation } from 'react-router-dom';

export function Header() {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path
            ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600'
            : 'text-gray-500 hover:text-indigo-500 transition-colors duration-200';
    };

    return (
        <header className="fixed top-0 w-full z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="container mx-auto px-6 h-16 flex justify-between items-center">
                <div className="flex items-center gap-10">
                    <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                        NFT Market
                    </Link>
                    <nav className="hidden md:flex gap-8 text-sm">
                        <Link to="/market" className={`py-5 ${isActive('/market')}`}>Market</Link>
                        <Link to="/" className={`py-5 ${isActive('/')}`}>My Collection</Link>
                        <Link to="/history" className={`py-5 ${isActive('/history')}`}>Activity</Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {/* @ts-expect-error - web component */}
                    <appkit-button />
                </div>
            </div>
        </header>
    );
}
