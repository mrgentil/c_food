import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeftIcon, PaperAirplaneIcon } from 'react-native-heroicons/outline';
import { StatusBar } from 'expo-status-bar';
import * as Animatable from 'react-native-animatable';

import { db } from '../firebase';
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc
} from 'firebase/firestore';
import { UserAuth } from '../contexts/AuthContext';

const ChatScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { orderId, driverId, driverName, driverPhoto } = route.params;
    const { user } = UserAuth();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const flatListRef = useRef(null);

    // Écoute des messages en temps réel
    useEffect(() => {
        const chatRef = collection(db, 'orders', orderId, 'chat');
        const q = query(chatRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(messagesData);

            // Scroll vers le bas après chargement
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });

        return () => unsubscribe();
    }, [orderId]);

    // Envoyer un message
    const sendMessage = async () => {
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const chatRef = collection(db, 'orders', orderId, 'chat');
            await addDoc(chatRef, {
                text: newMessage.trim(),
                senderId: user.uid,
                senderType: 'client',
                senderName: user.displayName || 'Client',
                createdAt: serverTimestamp()
            });

            // Mettre à jour la commande parente pour les notifications globales
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
                lastMessage: newMessage.trim(),
                lastMessageTimestamp: serverTimestamp(),
                lastMessageSenderType: 'client',
                lastMessageSenderName: user.displayName || 'Client'
            });

            setNewMessage('');
        } catch (error) {
            console.error('Erreur envoi message:', error);
        } finally {
            setSending(false);
        }
    };

    // Formatage de l'heure
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    // Rendu d'un message
    const renderMessage = ({ item, index }) => {
        const isMyMessage = item.senderId === user.uid;

        return (
            <Animatable.View
                animation="fadeInUp"
                delay={index * 50}
                className={`mb-3 max-w-[80%] ${isMyMessage ? 'self-end' : 'self-start'}`}
            >
                {/* Photo du livreur pour ses messages */}
                {!isMyMessage && (
                    <View className="flex-row items-end mb-1">
                        <Image
                            source={{ uri: driverPhoto || 'https://via.placeholder.com/40' }}
                            className="w-6 h-6 rounded-full mr-2"
                        />
                        <Text className="text-gray-500 text-xs">{driverName}</Text>
                    </View>
                )}

                <View className={`px-4 py-3 rounded-2xl ${isMyMessage
                    ? 'bg-[#0EA5E9] rounded-br-sm'
                    : 'bg-white border border-gray-100 rounded-bl-sm'
                    }`}>
                    <Text className={`${isMyMessage ? 'text-white' : 'text-gray-800'}`}>
                        {item.text}
                    </Text>
                </View>

                <Text className={`text-xs mt-1 ${isMyMessage ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                    {formatTime(item.createdAt)}
                </Text>
            </Animatable.View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="bg-white px-5 py-4 shadow-sm border-b border-gray-100 flex-row items-center">
                <TouchableOpacity onPress={navigation.goBack} className="bg-gray-100 p-2 rounded-full mr-4">
                    <ArrowLeftIcon size={20} color="black" />
                </TouchableOpacity>

                <Image
                    source={{ uri: driverPhoto || 'https://via.placeholder.com/50' }}
                    className="w-12 h-12 rounded-full border-2 border-gray-100"
                />

                <View className="flex-1 ml-3">
                    <Text className="text-lg font-bold text-gray-900">{driverName}</Text>
                    <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                        <Text className="text-green-600 text-xs font-medium">En ligne</Text>
                    </View>
                </View>
            </View>

            {/* Messages List */}
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={{ padding: 16, flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View className="flex-1 items-center justify-center py-20">
                            <Text className="text-6xl mb-4">💬</Text>
                            <Text className="text-gray-400 text-center">
                                Commencez la conversation avec{'\n'}votre livreur
                            </Text>
                        </View>
                    }
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input Area */}
                <View className="bg-white px-4 py-3 border-t border-gray-100 flex-row items-center">
                    <TextInput
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Votre message..."
                        className="flex-1 bg-gray-100 px-4 py-3 rounded-full mr-3 text-gray-800"
                        placeholderTextColor="#A0AEC0"
                        multiline
                        maxLength={500}
                    />

                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        className={`w-12 h-12 rounded-full items-center justify-center ${newMessage.trim() ? 'bg-[#0EA5E9]' : 'bg-gray-200'
                            }`}
                    >
                        <PaperAirplaneIcon size={22} color={newMessage.trim() ? 'white' : '#A0AEC0'} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChatScreen;
