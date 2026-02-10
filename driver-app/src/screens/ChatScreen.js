import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

import { db } from '../../firebase/firebase';
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
import { useAuth } from '../contexts/AuthContext';

const ChatScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { orderId, clientName, clientId } = route.params;
    const { driverProfile } = useAuth();

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
                senderId: driverProfile?.id,
                senderType: 'driver',
                senderName: `${driverProfile?.firstName || ''} ${driverProfile?.lastName || ''}`.trim() || 'Livreur',
                createdAt: serverTimestamp()
            });

            // Mettre à jour la commande parente pour les notifications globales
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
                lastMessage: newMessage.trim(),
                lastMessageTimestamp: serverTimestamp(),
                lastMessageSenderType: 'driver',
                lastMessageSenderName: `${driverProfile?.firstName || ''} ${driverProfile?.lastName || ''}`.trim() || 'Livreur'
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
    const renderMessage = ({ item }) => {
        const isMyMessage = item.senderType === 'driver';

        return (
            <View style={{
                marginBottom: 12,
                maxWidth: '80%',
                alignSelf: isMyMessage ? 'flex-end' : 'flex-start'
            }}>
                {/* Sender label */}
                {!isMyMessage && (
                    <Text style={{ color: '#6B7280', fontSize: 12, marginBottom: 4, marginLeft: 4 }}>
                        {clientName}
                    </Text>
                )}

                {/* Message Bubble */}
                <View style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 20,
                    backgroundColor: isMyMessage ? '#3FC060' : 'white',
                    borderBottomRightRadius: isMyMessage ? 4 : 20,
                    borderBottomLeftRadius: isMyMessage ? 20 : 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 1
                }}>
                    <Text style={{ color: isMyMessage ? 'white' : '#1F2937', fontSize: 15 }}>
                        {item.text}
                    </Text>
                </View>

                {/* Time */}
                <Text style={{
                    fontSize: 11,
                    color: '#9CA3AF',
                    marginTop: 4,
                    alignSelf: isMyMessage ? 'flex-end' : 'flex-start',
                    marginHorizontal: 4
                }}>
                    {formatTime(item.createdAt)}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F7FE' }}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={{
                backgroundColor: 'white',
                paddingHorizontal: 20,
                paddingVertical: 16,
                flexDirection: 'row',
                alignItems: 'center',
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2
            }}>
                <TouchableOpacity
                    onPress={navigation.goBack}
                    style={{
                        backgroundColor: '#F4F7FE',
                        padding: 10,
                        borderRadius: 12,
                        marginRight: 16
                    }}
                >
                    <Ionicons name="arrow-back" size={22} color="#111C44" />
                </TouchableOpacity>

                <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#E0E7FF',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <Ionicons name="person" size={24} color="#4F46E5" />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111C44' }}>
                        {clientName}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3FC060', marginRight: 6 }} />
                        <Text style={{ color: '#3FC060', fontSize: 12, fontWeight: '500' }}>Client</Text>
                    </View>
                </View>
            </View>

            {/* Messages List */}
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={{ padding: 16, flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
                            <Text style={{ fontSize: 60, marginBottom: 16 }}>💬</Text>
                            <Text style={{ color: '#6B7280', fontSize: 16, textAlign: 'center' }}>
                                Commencez la conversation{'\n'}avec le client
                            </Text>
                        </View>
                    }
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                {/* Input Area */}
                <View style={{
                    backgroundColor: 'white',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6'
                }}>
                    <TextInput
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Votre message..."
                        placeholderTextColor="#9CA3AF"
                        style={{
                            flex: 1,
                            backgroundColor: '#F4F7FE',
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderRadius: 24,
                            marginRight: 12,
                            fontSize: 15,
                            color: '#1F2937'
                        }}
                        multiline
                        maxLength={500}
                    />

                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={sending || !newMessage.trim()}
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: newMessage.trim() ? '#3FC060' : '#E5E7EB',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        <Ionicons
                            name="send"
                            size={20}
                            color={newMessage.trim() ? 'white' : '#9CA3AF'}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChatScreen;
