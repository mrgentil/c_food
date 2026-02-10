import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

/**
 * 🔐 PAGE DE CONNEXION
 * Interface de login - Style cohérent avec le Dashboard
 */
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { signIn } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!email || !password) {
            setError('Veuillez remplir tous les champs');
            setIsLoading(false);
            return;
        }

        const result = await signIn(email, password);

        if (result.success) {
            if (result.profile.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/');
            }
        } else {
            setError(result.error || 'Erreur de connexion');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex font-dm-sans">
            {/* Left Side - Same style as Dashboard Sidebar */}
            <div className="hidden lg:flex lg:w-[400px] bg-[#111C44] text-white flex-col justify-between p-8">
                {/* Logo */}
                <div>
                    <h1 className="text-2xl font-bold tracking-wider uppercase">
                        C-FOOD <span className="text-blue-400">DASHBOARD</span>
                    </h1>
                </div>

                {/* Center Content */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold mb-4">Bienvenue !</h2>
                        <p className="text-gray-400 text-lg">
                            Gérez vos restaurants, commandes et menus depuis votre tableau de bord centralisé.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#1B254B] rounded-lg flex items-center justify-center">
                                <span className="text-lg">📊</span>
                            </div>
                            <span className="text-gray-300">Statistiques en temps réel</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#1B254B] rounded-lg flex items-center justify-center">
                                <span className="text-lg">🍽️</span>
                            </div>
                            <span className="text-gray-300">Gestion des menus</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#1B254B] rounded-lg flex items-center justify-center">
                                <span className="text-lg">📦</span>
                            </div>
                            <span className="text-gray-300">Suivi des commandes</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-gray-500 text-sm">
                    © {new Date().getFullYear()} C-Food. Created by <a href="https://wa.me/243812380589" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">Owr Digi</a>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 bg-[#F4F7FE] flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <h1 className="text-2xl font-bold text-[#2B3674]">
                            C-FOOD <span className="text-[#4318FF]">DASHBOARD</span>
                        </h1>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white rounded-[20px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-[#2B3674]">Connexion</h2>
                            <p className="text-[#A3AED0] mt-2">Accédez à votre espace de gestion</p>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <p className="text-red-600 text-sm font-medium flex items-center gap-2">
                                    <span>⚠️</span>
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-[#2B3674] mb-2 uppercase tracking-wider">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="votre@email.com"
                                    className="w-full px-4 py-3.5 bg-[#F4F7FE] border border-[#E9EDF7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4318FF] focus:border-transparent transition-all text-[#2B3674] placeholder:text-[#A3AED0]"
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[#2B3674] mb-2 uppercase tracking-wider">
                                    Mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3.5 bg-[#F4F7FE] border border-[#E9EDF7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4318FF] focus:border-transparent transition-all text-[#2B3674] placeholder:text-[#A3AED0]"
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-4 bg-[#4318FF] text-white font-bold rounded-xl shadow-lg shadow-[#4318FF]/30 hover:shadow-xl hover:shadow-[#4318FF]/40 transition-all ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Connexion...
                                    </span>
                                ) : (
                                    'Se connecter'
                                )}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-[#A3AED0] text-sm mt-6">
                        Accès réservé aux administrateurs et restaurants
                    </p>

                    {/* Mobile Footer */}
                    <p className="lg:hidden text-center text-[#A3AED0] text-xs mt-4">
                        © {new Date().getFullYear()} C-Food. Created by <a href="https://wa.me/243812380589" target="_blank" rel="noopener noreferrer" className="text-[#4318FF] hover:underline">Owr Digi</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
