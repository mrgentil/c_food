import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../../firebase/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import InAppNotification from '../components/InAppNotification';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children, navigationRef }) => {
    const { driverProfile } = useAuth();
    const [notification, setNotification] = useState(null);
    const [visible, setVisible] = useState(false);

    // To keep track of the last seen timestamps for each order to avoid double alerts on mount
    const lastSeenTimestamps = useRef(new Map());

    useEffect(() => {
        if (!driverProfile?.id) return;

        // Listen for active orders related to this driver
        const ordersRef = collection(db, 'orders');
        const q = query(
            ordersRef,
            where('driverId', '==', driverProfile.id),
            where('status', 'in', ['accepted', 'preparing', 'picked_up'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const orderData = change.doc.data();
                const orderId = change.doc.id;

                if (change.type === 'modified' || change.type === 'added') {
                    const lastMsgTime = orderData.lastMessageTimestamp?.toMillis();

                    if (lastMsgTime) {
                        const previousTime = lastSeenTimestamps.current.get(orderId);

                        // If it's a NEW message and NOT from the driver
                        if (
                            (!previousTime || lastMsgTime > previousTime) &&
                            orderData.lastMessageSenderType !== 'driver'
                        ) {
                            // Trigger Notification
                            setNotification({
                                orderId: orderId,
                                title: orderData.lastMessageSenderName || 'Client',
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
    }, [driverProfile?.id]);

    const handlePress = () => {
        if (notification && navigationRef?.current) {
            navigationRef.current.navigate('ChatScreen', {
                orderId: notification.orderId,
                clientName: `${notification.userFirstName} ${notification.userLastName}`,
                clientId: notification.userId
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
