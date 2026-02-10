import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const EditProfileScreen = () => {
    const { driverProfile, refreshProfile } = useAuth();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    // Form state
    const [firstName, setFirstName] = useState(driverProfile?.firstName || '');
    const [lastName, setLastName] = useState(driverProfile?.lastName || '');
    const [phone, setPhone] = useState(driverProfile?.phone || '');
    const [city, setCity] = useState(driverProfile?.city || '');

    const handleSave = async () => {
        if (!firstName || !lastName || !phone) {
            Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires.");
            return;
        }

        setLoading(true);
        try {
            const driverRef = doc(db, 'user', driverProfile.id);
            await updateDoc(driverRef, {
                firstName,
                lastName,
                phone,
                city
            });
            await refreshProfile(); // Refresh context
            Alert.alert("Succès", "Profil mis à jour !");
            navigation.goBack();
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert("Erreur", "Impossible de mettre à jour le profil.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111C44" />
                </TouchableOpacity>
                <Text style={styles.title}>Modifier Profil</Text>
                <TouchableOpacity onPress={handleSave} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#0EA5E9" />
                    ) : (
                        <Text style={styles.saveText}>Enregistrer</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Prénom</Text>
                    <TextInput
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Votre prénom"
                        placeholderTextColor="#94A3B8"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nom</Text>
                    <TextInput
                        style={styles.input}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Votre nom"
                        placeholderTextColor="#94A3B8"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Téléphone</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Votre numéro"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Ville</Text>
                    <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Votre ville"
                        placeholderTextColor="#94A3B8"
                    />
                </View>

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
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 8 },
    input: { backgroundColor: 'white', padding: 16, borderRadius: 12, fontSize: 16, color: '#111C44', borderWidth: 1, borderColor: '#E2E8F0' },
});

export default EditProfileScreen;
