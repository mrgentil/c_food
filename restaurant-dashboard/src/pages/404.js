/**
 * 📄 PAGE 404 PERSONNALISÉE
 * Affichée quand une page n'existe pas
 */
export default function Custom404() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl">🔍</span>
                </div>
                <h1 className="text-6xl font-black text-gray-800 mb-2">404</h1>
                <h2 className="text-xl font-bold text-gray-600 mb-4">Page introuvable</h2>
                <p className="text-gray-500 mb-6">
                    La page que vous recherchez n&apos;existe pas ou a été déplacée.
                </p>
                <a
                    href="/"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                    Retour à l&apos;accueil
                </a>
            </div>
        </div>
    );
}
