import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../firebase/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth, ROLES } from './AuthContext';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
    const { userProfile, isAdmin, isRestaurant } = useAuth();
    const [notification, setNotification] = useState(null);
    const [visible, setVisible] = useState(false);
    const lastSeenTimestamps = useRef(new Map());
    const audioRef = useRef(null);

    useEffect(() => {
        if (!typeof window !== 'undefined') {
            audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3'); // Notification sound
        }
    }, []);

    useEffect(() => {
        if (!userProfile?.id) return;

        const ordersRef = collection(db, 'orders');
        let q;

        if (isAdmin) {
            q = query(
                ordersRef,
                where('status', 'in', ['pending', 'preparing', 'accepted', 'picked_up'])
            );
        } else if (isRestaurant && userProfile.restaurantId) {
            q = query(
                ordersRef,
                where('restaurantId', '==', userProfile.restaurantId),
                where('status', 'in', ['pending', 'preparing', 'accepted', 'picked_up'])
            );
        } else {
            return;
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const orderData = change.doc.data();
                const orderId = change.doc.id;

                if (change.type === 'modified' || change.type === 'added') {
                    const lastMsgTime = orderData.lastMessageTimestamp?.toMillis();

                    if (lastMsgTime) {
                        const previousTime = lastSeenTimestamps.current.get(orderId);

                        // If it's a NEW message and NOT from the restaurant (assuming senderType restaurant for dashboard)
                        if (
                            (!previousTime || lastMsgTime > previousTime) &&
                            orderData.lastMessageSenderType !== 'restaurant'
                        ) {
                            // Trigger Notification
                            setNotification({
                                orderId: orderId,
                                title: orderData.lastMessageSenderName || (orderData.lastMessageSenderType === 'client' ? 'Client' : 'Livreur'),
                                message: orderData.lastMessage,
                                ...orderData
                            });
                            setVisible(true);

                            // Play sound if possible
                            try {
                                audioRef.current?.play().catch(e => console.log("Audio play blocked", e));
                            } catch (e) { }
                        }

                        lastSeenTimestamps.current.set(orderId, lastMsgTime);
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [userProfile?.id, isAdmin, isRestaurant, userProfile?.restaurantId]);

    return (
        <NotificationContext.Provider value={{ setNotification, setVisible }}>
            {children}

            {/* Simple Web Toast */}
            {visible && notification && (
                <div className="fixed top-20 right-5 z-[9999] bg-white border border-stroke rounded-lg shadow-default p-4 flex flex-col gap-2 min-w-[300px] animate-fade-in-down">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">💬</span>
                            <div className="flex flex-col">
                                <span className="font-bold text-black dark:text-white text-sm">{notification.title}</span>
                                <span className="text-xs text-bodydark mt-1">Order #{notification.orderId?.slice(0, 6)}</span>
                            </div>
                        </div>
                        <button onClick={() => setVisible(false)} className="text-bodydark hover:text-black">✕</button>
                    </div>
                    <p className="text-sm text-black dark:text-white border-l-4 border-primary pl-3 py-1 bg-gray-2 dark:bg-meta-4">
                        "{notification.message}"
                    </p>
                    <button
                        onClick={() => {
                            // In a web dashboard, we don't have navigate easily here without more setup
                            // but we can just hide and maybe search for the order.
                            setVisible(false);
                        }}
                        className="text-xs text-primary font-bold self-end hover:underline"
                    >
                        Voir la commande
                    </button>
                </div>
            )}

            <style jsx>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.3s ease-out forwards;
                }
            `}</style>
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
