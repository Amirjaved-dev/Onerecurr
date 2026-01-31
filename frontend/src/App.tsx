import Header from './components/Header';
import SessionKeyManager from './components/SessionKeyManager';
import ActionExecutorDemo from './components/ActionExecutorDemo';
import { useWallet } from './context/WalletContext';
import { Card } from './components/ui/Card';

function App() {
    const { connectedAddress } = useWallet();

    return (
        <div className="min-h-screen bg-[#030712] text-gray-100 selection:bg-blue-500/30">
            {/* Background Gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <Header />

            <main className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {!connectedAddress ? (
                    // Hero Section for unconnected state
                    <div className="text-center max-w-3xl mx-auto mt-20 animate-slide-up">
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                            Gasless. Seamless. <br /> Recurring.
                        </h1>
                        <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                            Experience the next generation of Web3 payments.
                            Powered by <span className="text-blue-400 font-semibold">EIP-7702</span> sesssion keys and
                            <span className="text-yellow-400 font-semibold"> Yellow Network</span> state channels.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-20">
                            <FeatureCard
                                title="Session Keys"
                                desc="Sign once, execute many. No more wallet popups for every transaction."
                                icon="🔑"
                            />
                            <FeatureCard
                                title="State Channels"
                                desc="Instant, zero-gas micro-transactions off-chain."
                                icon="⚡"
                            />
                            <FeatureCard
                                title="Smart Paymaster"
                                desc="AI-driven gas sponsorship checks fair market prices."
                                icon="🤖"
                            />
                        </div>
                    </div>
                ) : (
                    // Dashboard for connected state
                    <div className="animate-fade-in space-y-8">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
                            <p className="text-gray-400">Manage your sessions and execute transactions.</p>
                        </div>

                        <SessionKeyManager
                            contractAddress={import.meta.env.VITE_ACTION_EXECUTOR_ADDRESS || '0x29e26275177A5DD5cc92bE0dF2700D1BE2F9D6BE'}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <ActionExecutorDemo />

                            {/* Placeholders for future features */}
                            <Card className="opacity-75 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                    <div className="text-4xl mb-4">⚡</div>
                                    <h3 className="text-lg font-bold text-white mb-2">Yellow Tipping</h3>
                                    <p className="text-sm text-gray-400 mb-4">Instant off-chain micropayments integration coming soon.</p>
                                    <span className="text-xs px-2 py-1 bg-white/5 rounded-full text-gray-500">In Development</span>
                                </div>
                            </Card>

                            <Card className="opacity-75 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                    <div className="text-4xl mb-4">🤖</div>
                                    <h3 className="text-lg font-bold text-white mb-2">Agentic Paymaster</h3>
                                    <p className="text-sm text-gray-400 mb-4">AI-verified gas sponsorship for fair swaps.</p>
                                    <span className="text-xs px-2 py-1 bg-white/5 rounded-full text-gray-500">In Development</span>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function FeatureCard({ title, desc, icon }: { title: string, desc: string, icon: string }) {
    return (
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
            <div className="text-3xl mb-4">{icon}</div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
        </div>
    );
}

export default App;
