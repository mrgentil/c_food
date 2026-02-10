import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import * as ImagePicker from 'expo-image-picker';

const VehicleScreen = () => {
    const { driverProfile, refreshProfile } = useAuth();
    const navigation = useNavigation();
    const [vehicleType, setVehicleType] = useState(driverProfile?.vehicleType || 'moto');
    const [plateNumber, setPlateNumber] = useState(driverProfile?.plateNumber || '');
    const [loading, setLoading] = useState(false);

    const vehicleTypes = [
        { id: 'moto', label: 'Moto', icon: 'motorbike' },
        { id: 'car', label: 'Voiture', icon: 'car' },
        { id: 'bike', label: 'Vélo', icon: 'bike' },
    ];

    const handleSave = async () => {
        setLoading(true);
        try {
            const driverRef = doc(db, 'user', driverProfile.id);
            await updateDoc(driverRef, {
                vehicleType,
                plateNumber
            });
            await refreshProfile();
            Alert.alert("Succès", "Informations du véhicule mises à jour !");
            navigation.goBack();
        } catch (error) {
            console.error("Error updating vehicle:", error);
            Alert.alert("Erreur", "Impossible de mettre à jour les informations.");
        } finally {
            setLoading(false);
        }
    };

    const pickDocument = async (docType) => {
        // Mock upload functionality
        Alert.alert("Upload", `Fonctionnalité d'upload pour ${docType} bientôt disponible.`);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111C44" />
                </TouchableOpacity>
                <Text style={styles.title}>Mon Véhicule</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    <Text style={styles.saveText}>{loading ? "..." : "Enregistrer"}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <Text style={styles.sectionTitle}>Type de véhicule</Text>
                <View style={styles.typesContainer}>
                    {vehicleTypes.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[styles.typeCard, vehicleType === type.id && styles.typeCardActive]}
                            onPress={() => setVehicleType(type.id)}
                        >
                            <MaterialCommunityIcons
                                name={type.icon}
                                size={32}
                                color={vehicleType === type.id ? 'white' : '#64748B'}
                            />
                            <Text style={[styles.typeLabel, vehicleType === type.id && styles.typeLabelActive]}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.sectionTitle}>Plaque d'immatriculation</Text>
                <TextInput
                    style={styles.input}
                    value={plateNumber}
                    onChangeText={setPlateNumber}
                    placeholder="Ex: 1234AB01"
                    placeholderTextColor="#94A3B8"
                />

                <Text style={styles.sectionTitle}>Documents</Text>

                <TouchableOpacity style={styles.docCard} onPress={() => pickDocument('Permis')}>
                    <View style={styles.docIcon}>
                        <Ionicons name="card-outline" size={24} color="#0EA5E9" />
                    </View>
                    <View style={styles.docInfo}>
                        <Text style={styles.docTitle}>Permis de conduire</Text>
                        <Text style={styles.docStatus}>Non vérifié</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.docCard} onPress={() => pickDocument('Assurance')}>
                    <View style={styles.docIcon}>
                        <Ionicons name="shield-checkmark-outline" size={24} color="#0EA5E9" />
                    </View>
                    <View style={styles.docInfo}>
                        <Text style={styles.docTitle}>Assurance Véhicule</Text>
                        <Text style={styles.docStatus}>Non vérifié</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: 'white' },
    backButton: { padding: 8 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#111C44' },
    saveText: { color: '#0EA5E9', fontWeight: 'bold', fontSize: 16 },
    content: { padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111C44', marginTop: 20, marginBottom: 12 },
    typesContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    typeCard: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0'
    },
    typeCardActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
    typeLabel: { marginTop: 8, fontSize: 12, fontWeight: '600', color: '#64748B' },
    typeLabelActive: { color: 'white' },
    input: { backgroundColor: 'white', padding: 16, borderRadius: 16, fontSize: 16, color: '#111C44', borderWidth: 1, borderColor: '#E2E8F0' },
    docCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 12 },
    docIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0F9FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    docInfo: { flex: 1 },
    docTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
    docStatus: { fontSize: 12, color: '#EF4444', marginTop: 2 }
});

export default VehicleScreen;
