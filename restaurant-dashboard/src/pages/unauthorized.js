import { useRouter } from 'next/router';

/**
 * 🚫 PAGE NON AUTORISÉE
 * Affichée quand un utilisateur n'a pas les permissions requises
 */
export default function UnauthorizedPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-400 via-pink-400 to-purple-500 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Card */}
            <div className="relative w-full max-w-md">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 text-center">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6">
                        <span className="text-5xl">🚫</span>
                    </div>

                    {/* Message */}
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Accès Non Autorisé</h1>
                    <p className="text-gray-500 mb-8">
                        Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
                        Seuls les administrateurs et propriétaires de restaurant peuvent se connecter.
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            Retour à la connexion
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                        >
                            Retour
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
