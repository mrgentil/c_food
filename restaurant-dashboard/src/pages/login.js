import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

/**
 * 🔐 PAGE DE CONNEXION
 * Interface de login pour Admin et Restaurant
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

        // Validation
        if (!email || !password) {
            setError('Veuillez remplir tous les champs');
            setIsLoading(false);
            return;
        }

        const result = await signIn(email, password);

        if (result.success) {
            // Rediriger selon le rôle
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
        <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-pink-500 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Login Card */}
            <div className="relative w-full max-w-md">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg mb-4">
                            <span className="text-3xl">🍔</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">C-Food Dashboard</h1>
                        <p className="text-gray-500 mt-1">Connectez-vous pour accéder à votre espace</p>
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
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="votre@email.com"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
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

                    {/* Footer */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            Accès réservé aux administrateurs et restaurants
                        </p>
                    </div>
                </div>

                {/* Info cards */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center text-white">
                        <span className="text-2xl">👑</span>
                        <p className="text-sm mt-1 font-medium">Admin</p>
                        <p className="text-xs opacity-80">Accès complet</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center text-white">
                        <span className="text-2xl">🍽️</span>
                        <p className="text-sm mt-1 font-medium">Restaurant</p>
                        <p className="text-xs opacity-80">Mon espace</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
