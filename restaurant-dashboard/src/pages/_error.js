/**
 * 🚨 PAGE D'ERREUR PERSONNALISÉE
 * Affichée quand une erreur non gérée survient
 */
function Error({ statusCode }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-4xl">😵</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    {statusCode ? `Erreur ${statusCode}` : 'Une erreur est survenue'}
                </h1>
                <p className="text-gray-500 mb-6">
                    {statusCode === 404
                        ? 'Cette page est introuvable.'
                        : 'Une erreur inattendue est survenue.'}
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

Error.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
};

export default Error;
