import Header from './components/Header';
import SessionKeyManager from './components/SessionKeyManager';
import ActionExecutorDemo from './components/ActionExecutorDemo';
import { useWallet } from './context/WalletContext';
import './App.css';

function App() {
  const { connectedAddress } = useWallet();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to One Recurr
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Experience gasless, session-based transactions powered by EIP-7702,
            Yellow Network state channels, and intelligent paymasters.
          </p>
        </div>

        {connectedAddress ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Session Key Manager */}
            <div className="md:col-span-2">
              <SessionKeyManager
                contractAddress={import.meta.env.VITE_ACTION_EXECUTOR_ADDRESS || '0x29e26275177A5DD5cc92bE0dF2700D1BE2F9D6BE'}
              />
            </div>

            {/* Action Executor */}
            <ActionExecutorDemo />

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Yellow Network Tipping
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Send instant, off-chain tips using Yellow Network state channels.
              </p>
              <button
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed"
                disabled
              >
                Coming Soon
              </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Agentic Paymaster
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Swap tokens with intelligent gas sponsorship based on price fairness.
              </p>
              <button
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-lg cursor-not-allowed"
                disabled
              >
                Coming Soon
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connect Your Wallet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connect your Ambire Wallet to get started with session-based, gasless transactions.
            </p>
          </div>
        )}
      </main>

      <footer className="mt-auto py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Built for <span className="font-semibold text-yellow-600">Yellow Network</span> & <span className="font-semibold text-pink-600">Uniswap Foundation</span> hackathon
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
