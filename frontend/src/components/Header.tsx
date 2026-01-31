import WalletConnect from './WalletConnect';
import { Badge } from './ui/Badge';

export default function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 glass-panel border-b-0 border-b-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                            <span className="text-white font-bold text-xl tracking-tighter">1R</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                                One Recurr
                            </h1>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                                Gasless Protocol
                            </p>
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex">
                            <Badge status="warning" text="Sepolia Testnet" />
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-2 hidden md:block"></div>
                        <WalletConnect />
                    </div>
                </div>
            </div>
        </header>
    );
}
