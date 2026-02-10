import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../../firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = ({ navigation }) => {
    const { driverProfile, signOut, refreshProfile } = useAuth();
    const [uploading, setUploading] = useState(false);

    const stats = [
        { label: 'Livraisons', value: driverProfile?.totalDeliveries || 0, icon: '📦' },
        { label: 'Note', value: driverProfile?.rating?.toFixed(1) || '5.0', icon: '⭐' },
        { label: 'Ce mois', value: driverProfile?.monthlyEarnings || '0 FC', icon: '💰' },
    ];

    const menuItems = [
        {
            icon: 'person-outline',
            label: 'Modifier mon profil',
            onPress: () => navigation.navigate('EditProfile')
        },
        {
            icon: 'car-outline',
            label: 'Mon véhicule',
            subtitle: driverProfile?.vehicleType === 'moto' ? '🛵 Moto' : '🚗 Voiture',
            onPress: () => navigation.navigate('Vehicle')
        },
        {
            icon: 'location-outline',
            label: 'Ma zone',
            subtitle: `📍 ${driverProfile?.city || 'Kinshasa'}`,
            onPress: () => { }
        },
        {
            icon: 'document-text-outline',
            label: 'Historique des livraisons',
            onPress: () => navigation.navigate('History')
        },
        {
            icon: 'wallet-outline',
            label: 'Mon Portefeuille',
            onPress: () => navigation.navigate('Wallet')
        },
        {
            icon: 'help-circle-outline',
            label: 'Aide et support',
            onPress: () => { }
        },
    ];

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Voulez-vous vraiment vous déconnecter ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: signOut
                },
            ]
        );
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Désolé', 'Nous avons besoin de la permission pour accéder à vos photos !');
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                uploadImage(uri);
            }
        } catch (error) {
            console.error("Error in pickImage:", error);
            Alert.alert("Erreur", "Une erreur est survenue lors de la sélection de l'image.");
        }
    };

    // Cloudinary Configuration
    const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dul9gmbzj/image/upload";
    const UPLOAD_PRESET = "c_food";

    const uploadImage = async (uri) => {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", {
                uri: uri,
                type: "image/jpeg",
                name: "profile.jpg",
            });
            formData.append("upload_preset", UPLOAD_PRESET);
            formData.append("folder", "driver-avatars");

            const response = await fetch(CLOUDINARY_URL, {
                method: "POST",
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                }
            });

            const data = await response.json();

            if (data.secure_url) {
                // Mise à jour du profil dans Firestore
                const driverRef = doc(db, 'user', driverProfile.id);
                await updateDoc(driverRef, {
                    photoURL: data.secure_url
                });

                await refreshProfile();
                Alert.alert("Succès", "Votre photo de profil a été mise à jour !");
            } else {
                throw new Error("Cloudinary upload failed");
            }
        } catch (error) {
            console.error("Erreur upload:", error);
            Alert.alert("Erreur", "Impossible de mettre à jour la photo.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mon Profil</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarContainer} disabled={uploading}>
                        {driverProfile?.photoURL ? (
                            <Image source={{ uri: driverProfile.photoURL }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {driverProfile?.firstName?.[0] || 'L'}
                                </Text>
                            </View>
                        )}

                        {uploading && (
                            <View style={[styles.avatar, styles.loadingOverlay]}>
                                <ActivityIndicator size="large" color="white" />
                            </View>
                        )}

                        {!uploading && (
                            <View style={styles.editBadge}>
                                <Ionicons name="camera" size={14} color="white" />
                            </View>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.name}>
                        {driverProfile?.firstName || ''} {driverProfile?.lastName || ''}
                    </Text>
                    <Text style={styles.email}>{driverProfile?.email}</Text>

                    {/* Status Badge */}
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Livreur actif</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    {stats.map((stat, index) => (
                        <View key={index} style={styles.statItem}>
                            <Text style={styles.statEmoji}>{stat.icon}</Text>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Menu Items */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={item.onPress}
                        >
                            <View style={styles.menuIcon}>
                                <Ionicons name={item.icon} size={22} color="#0EA5E9" />
                            </View>
                            <View style={styles.menuText}>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                                {item.subtitle && (
                                    <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                                )}
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                    <Text style={styles.logoutText}>Déconnexion</Text>
                </TouchableOpacity>

                {/* Version */}
                <Text style={styles.version}>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    profileCard: {
        backgroundColor: 'white',
        margin: 16,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#0EA5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '700',
        color: 'white',
    },
    editBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#0EA5E9',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        marginRight: 8,
    },
    statusText: {
        color: '#10B981',
        fontWeight: '600',
        fontSize: 13,
    },
    statsContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statEmoji: {
        fontSize: 28,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    menuContainer: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    menuIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F0F9FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuText: {
        flex: 1,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    menuSubtitle: {
        fontSize: 13,
        color: '#64748B',
        marginTop: 2,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    logoutText: {
        color: '#EF4444',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 8,
    },
    version: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 12,
        marginBottom: 32,
    },
});

export default ProfileScreen;
