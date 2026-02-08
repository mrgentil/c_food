import { useState, useEffect } from "react";
import { db } from "../../firebase/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useRestaurant } from "../../contexts/RestaurantContext";

const Settings = () => {
  const [restaurantData, setRestaurantData] = useState({
    name: "",
    image: "",
    address: "",
    genre: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  // 🏪 Multi-Vendor: Récupération dynamique du restaurant
  const { restaurant, restaurantId, loading, error } = useRestaurant();

  // Pré-remplir les champs avec les données actuelles du restaurant
  useEffect(() => {
    if (restaurant) {
      setRestaurantData({
        name: restaurant.name || "",
        image: restaurant.image || "",
        address: restaurant.address || "",
        genre: restaurant.genre || "",
      });
    }
  }, [restaurant]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setRestaurantData({
      ...restaurantData,
      [name]: value,
    });
    setSaveMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restaurantId) return;

    setIsSaving(true);
    setSaveMessage(null);

    const dataToUpdate = {
      updatedAt: serverTimestamp(),
    };

    // Loop through the fields and add non-empty ones to the update object
    for (const [key, value] of Object.entries(restaurantData)) {
      if (value.trim() !== "") {
        dataToUpdate[key] = value;
      }
    }

    try {
      const resRef = doc(db, "restaurants", restaurantId);
      await updateDoc(resRef, dataToUpdate);
      setSaveMessage({ type: "success", text: "✅ Modifications enregistrées !" });
    } catch (error) {
      console.log("Error updating restaurant details:", error);
      setSaveMessage({ type: "error", text: "❌ Erreur lors de la mise à jour." });
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-2xl pt-8 px-4 md:px-8 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error || !restaurantId) {
    return (
      <div className="max-w-2xl pt-8 px-4 md:px-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">⚠️ {error || "Aucun restaurant associé."}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="max-w-2xl pt-8 px-4 md:px-8">
        <div className="items-start justify-between sm:flex">
          <div>
            <h4 className="text-gray-800 text-3xl font-bold">
              Paramètres du restaurant
            </h4>
            <p className="text-gray-500 mt-1">ID: {restaurantId}</p>
          </div>
        </div>

        {saveMessage && (
          <div className={`mt-4 p-3 rounded-xl text-center font-medium ${saveMessage.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            }`}>
            {saveMessage.text}
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-6">
          <div className="rounded-3xl bg-white shadow-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900">Nom</h3>
              <input
                type="text"
                name="name"
                value={restaurantData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-2xl py-2 px-3 mt-4 focus:outline-none focus:ring focus:ring-green-200 focus:border-green-300"
                placeholder="Nom du restaurant"
              />
            </div>
          </div>
          <div className="rounded-3xl bg-white shadow-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900">Image</h3>
              <input
                type="text"
                name="image"
                value={restaurantData.image}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-2xl py-2 px-3 mt-4 focus:outline-none focus:ring focus:ring-green-200 focus:border-green-300"
                placeholder="URL de l'image"
              />
            </div>
          </div>
          <div className="rounded-3xl bg-white shadow-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900">Adresse</h3>
              <input
                type="text"
                name="address"
                value={restaurantData.address}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-2xl py-2 px-3 mt-4 focus:outline-none focus:ring focus:ring-green-200 focus:border-green-300"
                placeholder="Adresse du restaurant"
              />
            </div>
          </div>
          <div className="rounded-3xl bg-white shadow-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900">Genre</h3>
              <input
                type="text"
                name="genre"
                value={restaurantData.genre}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-2xl py-2 px-3 mt-4 focus:outline-none focus:ring focus:ring-green-200 focus:border-green-300"
                placeholder="Type de cuisine"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className={`mt-8 w-full cursor-pointer items-center gap-x-2 text-gray-700 font-semibold text-base p-3 rounded-xl hover:bg-green-100 active:bg-green-400 duration-150 bg-green-100 border-l-4 border-b-4 border-green-500 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSaving ? "Enregistrement..." : "💾 Enregistrer les modifications"}
        </button>
      </div>
    </form>
  );
}

export default Settings