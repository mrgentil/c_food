import { useState } from "react";
import OrderModal from "./OrderModal";

const OrdersList = ({ orders }) => {
  const [isActive, setIsActive] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalOrders = orders.length;

  const filteredOrders = orders.filter((o) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (o.id && o.id.includes(searchLower)) ||
      (o.userFirstName && o.userFirstName.toLowerCase().includes(searchLower))
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatCurrency = (amount) => new Intl.NumberFormat("fr-CD").format(amount) + " FC";
  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const getStatusInfo = (status) => {
    const map = {
      pending: { color: 'text-warning bg-warning', label: 'En attente' },
      accepted: { color: 'text-primary bg-primary', label: 'Acceptée' },
      preparing: { color: 'text-warning bg-warning', label: 'Cuisine' },
      picked_up: { color: 'text-primary bg-primary', label: 'Livraison' },
      delivered: { color: 'text-success bg-success', label: 'Livrée' },
      cancelled: { color: 'text-danger bg-danger', label: 'Annulée' }
    };
    return map[status] || { color: 'text-bodydark bg-gray', label: status };
  };

  return (
    <>
      {isActive && <OrderModal setIsActive={setIsActive} selectedOrder={selectedOrder} />}

      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold text-black dark:text-white">Commandes en Cours ({totalOrders})</h2>
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full rounded border border-stroke bg-transparent py-2 pl-4 pr-4 outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary sm:w-1/3"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {orders.length === 0 ? (
          <div className="p-10 text-center border border-stroke rounded bg-white">
            <p>Aucune commande en attente.</p>
          </div>
        ) : (
          <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default sm:px-7.5 xl:pb-1">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left dark:bg-meta-4">
                    <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">Date & ID</th>
                    <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">Client</th>
                    <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Total</th>
                    <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((item) => {
                    const statusInfo = getStatusInfo(item.status);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => { setSelectedOrder(item); setIsActive(true); }}
                        className="cursor-pointer hover:bg-gray-1"
                      >
                        <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                          <h5 className="font-bold text-black dark:text-white">#{item.id.slice(0, 6)}</h5>
                          <p className="text-xs text-gray-500">{formatDate(item.createdAt)}</p>
                        </td>
                        <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                          <p className="text-black dark:text-white text-sm">{item.userFirstName} {item.userLastName}</p>
                        </td>
                        <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                          <p className="text-black dark:text-white font-medium">{formatCurrency(item.total)}</p>
                        </td>
                        <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                          <p className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </p>
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
                  <button onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); }} disabled={currentPage === 1} className="rounded px-3 py-1 border hover:bg-gray-100 disabled:opacity-50">Préc.</button>
                  <button onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(totalPages, p + 1)); }} disabled={currentPage === totalPages} className="rounded px-3 py-1 border hover:bg-gray-100 disabled:opacity-50">Suiv.</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default OrdersList;
