import { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { useRestaurant } from "../../contexts/RestaurantContext";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const { restaurantId, loading, error } = useRestaurant();

  useEffect(() => {
    if (restaurantId) getOrders(); else if (!loading) setLoadingData(false);
  }, [restaurantId, loading]);

  const getOrders = async () => {
    setLoadingData(true);
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("restaurantId", "==", restaurantId), orderBy("createdAt", "desc"));
      const items = (await getDocs(q)).docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setOrders(items);
    } catch (err) { console.error(err); } finally { setLoadingData(false); }
  };

  const filteredOrders = orders.filter(o => {
    return o.id.includes(searchTerm.toLowerCase()) ||
      (o.userFirstName && o.userFirstName.toLowerCase().includes(searchTerm.toLowerCase()));
  });
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatCurrency = (val) => new Intl.NumberFormat('fr-CD').format(val) + ' FC';
  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusInfo = (status) => {
    const map = {
      pending: { color: 'text-warning bg-warning', label: 'Attente' },
      accepted: { color: 'text-primary bg-primary', label: 'Acceptée' },
      preparing: { color: 'text-warning bg-warning', label: 'Cuisine' },
      picked_up: { color: 'text-primary bg-primary', label: 'Livraison' },
      delivered: { color: 'text-success bg-success', label: 'Livrée' },
      cancelled: { color: 'text-danger bg-danger', label: 'Annulée' }
    };
    return map[status] || { color: 'text-bodydark bg-gray', label: status };
  };

  if (loading || loadingData) return <div className="p-10">Chargement...</div>;

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-black dark:text-white">Historique ({orders.length})</h2>
        <input
          type="text"
          placeholder="Rechercher..."
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
                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">Date</th>
                <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Client</th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Montant</th>
                <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Statut</th>
                <th className="min-w-[100px] py-4 px-4 font-medium text-black dark:text-white">Preuve</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((item) => {
                const statusInfo = getStatusInfo(item.status);
                return (
                  <tr key={item.id}>
                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                      <p className="text-black dark:text-white">{formatDate(item.createdAt)}</p>
                      <p className="text-xs text-gray-500">#{item.id.slice(0, 6)}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white font-medium">{item.userFirstName} {item.userLastName}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">{formatCurrency(item.total)}</p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      {item.deliveryPhotoURL ? (
                        <a href={item.deliveryPhotoURL} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-500 hover:underline">
                          📸 Preuve
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
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

export default OrderHistory;
