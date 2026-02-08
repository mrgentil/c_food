import { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import OrdersList from "./OrdersList";

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("paymentStatus", "==", "pending_verification"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let item = [];
      querySnapshot.forEach((doc) => {
        item.push({ ...doc.data(), id: doc.id });
      });
      setOrders(item);
      console.log("Pending orders:", item);
    }, (error) => {
      console.error("Error fetching orders:", error);
    });

    return unsubscribe; // Cleanup function to unsubscribe from real-time updates
  }, []);

  return (
    <>
      <OrdersList orders={orders} />
    </>
  );
};

export default Orders;
