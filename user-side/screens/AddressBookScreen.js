import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon, PlusIcon, MapPinIcon, TrashIcon, PencilIcon, XMarkIcon } from 'react-native-heroicons/outline';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Animatable from 'react-native-animatable';
import { UserAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore';
import AddressSearchAutocomplete from '../components/AddressSearchAutocomplete';

const AddressBookScreen = () => {
    const navigation = useNavigation();
    const { user } = UserAuth();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [newAddressName, setNewAddressName] = useState(''); // e.g., "Maison"
    const [newAddressFull, setNewAddressFull] = useState('');
    const [newAddressCoords, setNewAddressCoords] = useState(null);
    const [newAddressInstructions, setNewAddressInstructions] = useState('');
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, 'user', user.uid, 'addresses'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAddresses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleSaveAddress = async () => {
        if (!newAddressName || !newAddressFull || !newAddressCoords) {
            Alert.alert('Erreur', 'Veuillez remplir le nom et sélectionner une adresse.');
            return;
        }

        setIsSubmitting(true);
        try {
            const addressData = {
                name: newAddressName,
                address: newAddressFull,
                latitude: newAddressCoords.latitude,
                longitude: newAddressCoords.longitude,
                instructions: newAddressInstructions,
                updatedAt: serverTimestamp(),
            };

            if (editingId) {
                await updateDoc(doc(db, 'user', user.uid, 'addresses', editingId), addressData);
                Alert.alert('Succès', 'Adresse mise à jour !');
            } else {
                await addDoc(collection(db, 'user', user.uid, 'addresses'), {
                    ...addressData,
                    createdAt: serverTimestamp(),
                });
                Alert.alert('Succès', 'Nouvelle adresse ajoutée !');
            }

            closeModal();
        } catch (error) {
            console.error("Error saving address:", error);
            Alert.alert('Erreur', "Impossible d'enregistrer l'adresse.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            "Supprimer l'adresse",
            "Êtes-vous sûr de vouloir supprimer cette adresse ?",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer", style: "destructive", onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'user', user.uid, 'addresses', id));
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Erreur', "Impossible de supprimer.");
                        }
                    }
                }
            ]
        );
    };

    const openEditModal = (addr) => {
        setEditingId(addr.id);
        setNewAddressName(addr.name);
        setNewAddressFull(addr.address);
        setNewAddressCoords({ latitude: addr.latitude, longitude: addr.longitude });
        setNewAddressInstructions(addr.instructions || '');
        setShowAddModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingId(null);
        setNewAddressName('');
        setNewAddressFull('');
        setNewAddressCoords(null);
        setNewAddressInstructions('');
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark" />

            {/* Header */}
            <View className="px-5 py-4 flex-row items-center justify-between bg-white shadow-sm z-10">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-gray-100 rounded-full">
                    <ArrowLeftIcon size={20} color="black" />
                </TouchableOpacity>
                <Text className="text-xl font-extrabold text-gray-900">Carnet d'adresses</Text>
                <TouchableOpacity onPress={() => setShowAddModal(true)} className="p-2 bg-[#0EA5E9] rounded-full">
                    <PlusIcon size={20} color="white" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
                {loading ? (
                    <ActivityIndicator size="large" color="#0EA5E9" className="mt-10" />
                ) : addresses.length === 0 ? (
                    <View className="items-center justify-center mt-20 opacity-60">
                        <View className="bg-gray-200 p-6 rounded-full mb-4">
                            <MapPinIcon size={40} color="#9CA3AF" />
                        </View>
                        <Text className="text-gray-500 font-medium">Aucune adresse enregistrée.</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(true)} className="mt-4">
                            <Text className="text-[#0EA5E9] font-bold">Ajouter maintenant</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    addresses.map((addr) => (
                        <Animatable.View
                            key={addr.id}
                            animation="fadeInUp"
                            className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-100 flex-row items-center"
                        >
                            <View className="bg-sky-50 p-3 rounded-full mr-4">
                                <MapPinIcon size={24} color="#0EA5E9" />
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold text-gray-800 text-lg">{addr.name}</Text>
                                <Text className="text-gray-500 text-xs mt-0.5 mb-1">{addr.address}</Text>
                                {addr.instructions ? (
                                    <Text className="text-gray-400 text-[10px] italic">Note: {addr.instructions}</Text>
                                ) : null}
                            </View>

                            <View className="flex-row space-x-2">
                                <TouchableOpacity onPress={() => openEditModal(addr)} className="p-2 bg-gray-50 rounded-lg">
                                    <PencilIcon size={18} color="#6B7280" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDelete(addr.id)} className="p-2 bg-red-50 rounded-lg">
                                    <TrashIcon size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </Animatable.View>
                    ))
                )}
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView className="flex-1 bg-white">
                    <View className="px-4 py-4 border-b border-gray-100 flex-row justify-between items-center bg-white z-20">
                        <Text className="text-lg font-extrabold text-gray-900">{editingId ? 'Modifier' : 'Nouvelle adresse'}</Text>
                        <TouchableOpacity onPress={closeModal} className="bg-gray-100 p-2 rounded-full">
                            <XMarkIcon size={24} color="black" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="flex-1 p-5" keyboardShouldPersistTaps="handled">

                        <Text className="label text-gray-500 font-bold text-xs uppercase mb-2">Nom du lieu</Text>
                        <TextInput
                            placeholder="ex: Maison, Bureau..."
                            value={newAddressName}
                            onChangeText={setNewAddressName}
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-5 font-semibold text-gray-800"
                        />

                        <Text className="label text-gray-500 font-bold text-xs uppercase mb-2">Rechercher l'adresse</Text>
                        <View className="mb-5 z-50">
                            {/* Autocomplete Component */}
                            <AddressSearchAutocomplete
                                onSelectAddress={(data) => {
                                    setNewAddressFull(data.address);
                                    setNewAddressCoords({ latitude: data.latitude, longitude: data.longitude });
                                }}
                            />
                        </View>

                        {newAddressFull ? (
                            <View className="bg-sky-50 p-3 rounded-xl border border-sky-100 mb-5 flex-row items-center">
                                <MapPinIcon size={20} color="#0EA5E9" />
                                <Text className="ml-2 text-sky-800 font-semibold flex-1">{newAddressFull}</Text>
                            </View>
                        ) : null}

                        <Text className="label text-gray-500 font-bold text-xs uppercase mb-2">Instructions (Optionnel)</Text>
                        <TextInput
                            placeholder="Code porte, étage, couleur du portail..."
                            value={newAddressInstructions}
                            onChangeText={setNewAddressInstructions}
                            multiline
                            numberOfLines={3}
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-8 font-medium text-gray-800 h-24 text-top"
                            style={{ textAlignVertical: 'top' }}
                        />

                        <TouchableOpacity
                            onPress={handleSaveAddress}
                            disabled={isSubmitting}
                            className={`w-full py-4 rounded-xl items-center shadow-lg ${isSubmitting ? 'bg-gray-300' : 'bg-[#0EA5E9]'}`}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Enregistrer</Text>
                            )}
                        </TouchableOpacity>

                    </ScrollView>
                </SafeAreaView>
            </Modal>

        </SafeAreaView>
    );
};

export default AddressBookScreen;
