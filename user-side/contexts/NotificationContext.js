import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { UserAuth } from './AuthContext';
import InAppNotification from '../components/InAppNotification';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children, navigationRef }) => {
    const { user } = UserAuth();
    const [notification, setNotification] = useState(null);
    const [visible, setVisible] = useState(false);

    // To keep track of the last seen timestamps for each order to avoid double alerts on mount
    const lastSeenTimestamps = useRef(new Map());

    useEffect(() => {
        if (!user) return;

        // Listen for active orders related to this user
        const ordersRef = collection(db, 'orders');
        const q = query(
            ordersRef,
            where('userId', '==', user.uid),
            where('status', 'in', ['pending', 'preparing', 'accepted', 'picked_up'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const orderData = change.doc.data();
                const orderId = change.doc.id;

                if (change.type === 'modified' || change.type === 'added') {
                    const lastMsgTime = orderData.lastMessageTimestamp?.toMillis();

                    if (lastMsgTime) {
                        const previousTime = lastSeenTimestamps.current.get(orderId);

                        // If it's a NEW message and NOT from the client
                        if (
                            (!previousTime || lastMsgTime > previousTime) &&
                            orderData.lastMessageSenderType !== 'client'
                        ) {
                            // Trigger Notification
                            setNotification({
                                orderId: orderId,
                                title: orderData.lastMessageSenderName || (orderData.lastMessageSenderType === 'driver' ? 'Livreur' : 'Restaurant'),
                                message: orderData.lastMessage,
                                ...orderData
                            });
                            setVisible(true);
                        }

                        // Update ref
                        lastSeenTimestamps.current.set(orderId, lastMsgTime);
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [user]);

    const handlePress = () => {
        if (notification && navigationRef?.current) {
            navigationRef.current.navigate('ChatScreen', {
                orderId: notification.orderId,
                driverId: notification.driverId,
                driverName: notification.driverName || 'Livreur',
                driverPhoto: notification.driverPhoto
            });
            setVisible(false);
        }
    };

    return (
        <NotificationContext.Provider value={{ setNotification, setVisible }}>
            {children}
            <InAppNotification
                visible={visible}
                notification={notification}
                onHide={() => setVisible(false)}
                onPress={handlePress}
            />
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
