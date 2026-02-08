import { db } from "../../firebase/firebase";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import AddDishModal from "./AddDishModal";
import EditDishModal from "./EditDishModal";
import { useRestaurant } from "../../contexts/RestaurantContext";
import ImageWithFallback from "../ImageWithFallback";

const Menu = ({ restaurantId: propRestaurantId }) => {
  // States
  const [dishes, setDishes] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isActive, setIsActive] = useState(false);
  const [editingDish, setEditingDish] = useState(null);

  // Context
  const restaurantContext = useRestaurant();

  // Use prop if available (Admin mode), otherwise use context (Restaurant mode)
  const restaurantId = propRestaurantId || restaurantContext?.restaurantId;
  const loading = propRestaurantId ? false : restaurantContext?.loading;
  const error = propRestaurantId ? null : restaurantContext?.error;

  useEffect(() => {
    if (restaurantId) getDishes();
    else if (!loading) setLoadingData(false);
  }, [restaurantId, loading, isActive]);

  const getDishes = async () => {
    setLoadingData(true);
    try {
      const dishesRef = collection(db, "dishes");
      const q = query(dishesRef, where("restaurantId", "==", restaurantId));
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setDishes(items);
    } catch (err) { console.error("Error fetching dishes:", err); } finally { setLoadingData(false); }
  };

  const handleRemove = async (id) => {
    if (!confirm("Supprimer ce plat ?")) return;
    try {
      await deleteDoc(doc(db, "dishes", id));
      setDishes(prev => prev.filter(item => item.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleUpdate = (updatedDish) => {
    setDishes(prev => prev.map(d => d.id === updatedDish.id ? updatedDish : d));
  };

  const filteredDishes = dishes.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredDishes.length / itemsPerPage);
  const paginatedDishes = filteredDishes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const formatPrice = (price) => new Intl.NumberFormat('fr-CD').format(price) + ' FC';

  if (loading || loadingData) return <div className="p-10">Chargement...</div>;
  if (error || !restaurantId) return <div className="p-10 text-danger">{error || "Erreur restaurant"}</div>;

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      {isActive && <AddDishModal setIsActive={setIsActive} restaurantId={restaurantId} />}
      {editingDish && (
        <EditDishModal
          dish={editingDish}
          setIsActive={() => setEditingDish(null)}
          onUpdate={handleUpdate}
        />
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-black dark:text-white">Mon Menu</h2>
        <button
          onClick={() => setIsActive(true)}
          className="inline-flex items-center justify-center rounded-md bg-[#3C50E0] py-3 px-8 text-center font-medium text-white hover:bg-opacity-90"
        >
          Ajouter un Plat
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un plat..."
          className="w-full rounded border border-stroke bg-transparent py-2 pl-4 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary sm:w-1/3"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default sm:px-7.5 xl:pb-1">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">Article</th>
                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Prix</th>
                <th className="min-w-[200px] py-4 px-4 font-medium text-black dark:text-white">Description</th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDishes.map((item) => (
                <tr key={item.id}>
                  <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="h-12.5 w-15 rounded-md flex items-center justify-center bg-gray-100 text-gray-500 overflow-hidden">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          fallback={<span className="material-symbols-outlined">restaurant_menu</span>}
                        />
                      </div>
                      <p className="text-sm font-medium text-black dark:text-white">{item.name}</p>
                    </div>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <p className="text-black dark:text-white">{formatPrice(item.price)}</p>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <p className="text-sm text-black dark:text-white truncate max-w-[200px]">{item.description || '-'}</p>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingDish(item)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        title="Modifier"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-4">
            <span className="text-sm font-medium text-gray-600">Page {currentPage} / {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded px-3 py-1 border hover:bg-gray-100 disabled:opacity-50">Préc.</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded px-3 py-1 border hover:bg-gray-100 disabled:opacity-50">Suiv.</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;

