import { useState, useEffect } from "react";
import { db } from "../../firebase/firebase";
import { doc, updateDoc } from "firebase/firestore";
import ImageUpload from "../ImageUpload";

const EditDishModal = ({ dish, setIsActive, onUpdate }) => {
    const [name, setName] = useState(dish.name || "");
    const [image, setImage] = useState(dish.image || "");
    const [price, setPrice] = useState(dish.price || "");
    const [description, setDescription] = useState(dish.description || "");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateDoc(doc(db, "dishes", dish.id), {
                name,
                image,
                price: Number(price),
                description,
                updatedAt: new Date()
            });
            onUpdate({ ...dish, name, image, price: Number(price), description });
            setIsActive(false);
        } catch (err) {
            console.error("Error updating dish:", err);
            alert("Erreur lors de la mise à jour");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 w-full h-full bg-black opacity-60"
                onClick={() => setIsActive(false)}
            ></div>
            <div className="flex items-center min-h-screen px-4 py-8">
                <div className="relative w-full max-w-2xl p-6 mx-auto bg-white rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-2xl font-bold text-gray-800">Modifier le Plat</h4>
                        <button
                            className="p-2 text-gray-500 rounded-lg hover:bg-red-100"
                            onClick={() => setIsActive(false)}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du plat</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nom"
                                className="w-full px-3 py-2 text-gray-700 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prix (FC)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="Prix"
                                className="w-full px-3 py-2 text-gray-700 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                            <ImageUpload
                                initialValue={image}
                                onUpload={(url) => setImage(url)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Description du plat"
                                rows={3}
                                className="w-full px-3 py-2 text-gray-700 bg-white border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsActive(false)}
                                className="flex-1 py-2 px-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-2 px-4 text-white bg-blue-500 rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50"
                            >
                                {saving ? "Enregistrement..." : "Enregistrer"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditDishModal;
