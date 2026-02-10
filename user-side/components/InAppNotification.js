import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { ChatBubbleLeftRightIcon, XMarkIcon } from 'react-native-heroicons/solid';

const InAppNotification = ({ visible, notification, onHide, onPress }) => {
    if (!visible || !notification) return null;

    useEffect(() => {
        const timer = setTimeout(() => {
            onHide();
        }, 5000); // Hide after 5 seconds

        return () => clearTimeout(timer);
    }, [notification, onHide]);

    return (
        <Animatable.View
            animation="fadeInDown"
            duration={500}
            className="absolute top-12 left-4 right-4 z-[999]"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 10,
            }}
        >
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.9}
                className="bg-white rounded-2xl p-4 flex-row items-center border border-gray-100"
            >
                {/* Icon or Photo */}
                <View className="bg-blue-100 p-2 rounded-full mr-3">
                    <ChatBubbleLeftRightIcon size={24} color="#0EA5E9" />
                </View>

                {/* Content */}
                <View className="flex-1">
                    <Text className="text-gray-900 font-bold text-sm" numberOfLines={1}>
                        {notification.title || 'Nouveau message'}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
                        {notification.message}
                    </Text>
                </View>

                {/* Close Button */}
                <TouchableOpacity onPress={onHide} className="p-1">
                    <XMarkIcon size={20} color="#A0AEC0" />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animatable.View>
    );
};

export default InAppNotification;
