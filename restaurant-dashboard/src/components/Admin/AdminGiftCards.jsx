import { useState, useEffect } from 'react';
import { db } from '../../firebase/firebase';
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp, where } from 'firebase/firestore';

const AdminGiftCards = () => {
    const [giftCards, setGiftCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [batchSize, setBatchSize] = useState(5);
    const [cardValue, setCardValue] = useState(5000);

    useEffect(() => {
        const q = query(collection(db, 'giftCards'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setGiftCards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const generateBatch = async () => {
        setGenerating(true);
        try {
            const prefix = "CF-";
            const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No O, I, 1, 0 to avoid confusion

            for (let i = 0; i < batchSize; i++) {
                let randomCode = "";
                for (let j = 0; j < 8; j++) {
                    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                const finalCode = `${prefix}${randomCode}`;

                await addDoc(collection(db, 'giftCards'), {
                    code: finalCode,
                    value: Number(cardValue),
                    isUsed: false,
                    usedBy: null,
                    usedAt: null,
                    createdAt: serverTimestamp()
                });
            }
            alert(`${batchSize} cartes générées avec succès !`);
        } catch (error) {
            console.error("Error generating cards:", error);
            alert("Erreur lors de la génération");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#111C44]">Cartes Cadeaux</h1>
                    <p className="text-gray-400 text-sm">Générez des codes de recharge pour les clients</p>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    <div className="flex flex-col px-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Valeur (FC)</span>
                        <input
                            type="number"
                            className="bg-transparent font-bold text-[#111C44] outline-none w-24"
                            value={cardValue}
                            onChange={(e) => setCardValue(e.target.value)}
                        />
                    </div>
                    <div className="h-8 w-[1px] bg-gray-200"></div>
                    <div className="flex flex-col px-3">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Quantité</span>
                        <input
                            type="number"
                            className="bg-transparent font-bold text-[#111C44] outline-none w-16"
                            value={batchSize}
                            onChange={(e) => setBatchSize(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={generateBatch}
                        disabled={generating}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ml-2"
                    >
                        {generating ? '...' : (
                            <><span className="material-icons-outlined text-lg">auto_awesome</span> Générer</>
                        )}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Code</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Valeur</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Statut</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Utilisé par</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Date Création</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {giftCards.map((card) => (
                            <tr key={card.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <code className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-mono font-bold">{card.code}</code>
                                </td>
                                <td className="px-6 py-4 font-bold text-[#111C44]">
                                    {card.value.toLocaleString()} FC
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${card.isUsed ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {card.isUsed ? 'UTILISÉE' : 'DISPONIBLE'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {card.usedBy || '-'}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-400">
                                    {card.createdAt ? new Date(card.createdAt.seconds * 1000).toLocaleDateString() : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {giftCards.length === 0 && (
                    <div className="p-12 text-center text-gray-400 italic">Aucune carte cadeau générée</div>
                )}
            </div>
        </div>
    );
};

export default AdminGiftCards;
