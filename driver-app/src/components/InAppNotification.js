import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const InAppNotification = ({ visible, notification, onHide, onPress }) => {
    if (!visible || !notification) return null;

    useEffect(() => {
        const timer = setTimeout(() => {
            onHide();
        }, 5000);

        return () => clearTimeout(timer);
    }, [notification, onHide]);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.9}
                style={styles.notification}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name="chatbubble-ellipses" size={24} color="#4F46E5" />
                </View>

                <View style={styles.content}>
                    <Text style={styles.title} numberOfLines={1}>
                        {notification.title || 'Nouveau message'}
                    </Text>
                    <Text style={styles.message} numberOfLines={1}>
                        {notification.message}
                    </Text>
                </View>

                <TouchableOpacity onPress={onHide} style={styles.closeButton}>
                    <Ionicons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        zIndex: 9999,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    notification: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    iconContainer: {
        backgroundColor: '#EEF2FF',
        padding: 10,
        borderRadius: 50,
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        color: '#111C44',
        fontWeight: 'bold',
        fontSize: 14,
    },
    message: {
        color: '#6B7280',
        fontSize: 12,
        marginTop: 2,
    },
    closeButton: {
        padding: 4,
    },
});

export default InAppNotification;
