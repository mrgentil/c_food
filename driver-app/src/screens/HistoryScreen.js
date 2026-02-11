import { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { db } from "../../firebase/firebase"; // Fixed import path
import { useAuth } from "../contexts/AuthContext";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

const HistoryScreen = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { driverProfile } = useAuth();
    const navigation = useNavigation();

    useEffect(() => {
        fetchHistory();
    }, [driverProfile?.id]);

    const fetchHistory = async () => {
        if (!driverProfile?.id) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, "orders"),
                where("driverId", "==", driverProfile.id),
                where("status", "==", "delivered"),
                orderBy("updatedAt", "desc")
                // Note: Index might be required for this composite query (driverId + status + updatedAt)
            );

            const querySnapshot = await getDocs(q);
            const historyList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setOrders(historyList);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => new Intl.NumberFormat('fr-CD').format(price || 0) + ' FC';

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const [selectedImage, setSelectedImage] = useState(null);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("OrdersDeliveryScreen", { order: item })}
            activeOpacity={0.7}
        >
            <View style={styles.row}>
                <View style={styles.iconContainer}>
                    <MaterialIcons name="restaurant" size={20} color="#0EA5E9" />
                </View>
                <View style={styles.content}>
                    <Text style={styles.restaurantName}>{item.restaurantName}</Text>
                    <Text style={styles.date}>{formatDate(item.updatedAt || item.createdAt)}</Text>
                </View>
                <Text style={styles.price}>{formatPrice(item.total)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.footerRow}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>COMMISSION: {formatPrice((item.total || 0) * 0.1)}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.deliveryPhotoURL && (
                        <TouchableOpacity
                            onPress={() => setSelectedImage(item.deliveryPhotoURL)}
                            style={styles.cameraIcon}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="camera" size={20} color="#0EA5E9" />
                            <Text style={styles.cameraText}>Preuve</Text>
                        </TouchableOpacity>
                    )}
                    <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>LIVRÉE ✅</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111C44" />
                </TouchableOpacity>
                <Text style={styles.title}>Historique</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#0EA5E9" />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.centered}>
                            <Text style={styles.emptyText}>Aucune livraison effectuée</Text>
                        </View>
                    }
                />
            )}

            {/* Modal pour afficher la preuve en grand */}
            <Modal visible={!!selectedImage} transparent={true} onRequestClose={() => setSelectedImage(null)}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeModalButton} onPress={() => setSelectedImage(null)}>
                        <Ionicons name="close-circle" size={40} color="white" />
                    </TouchableOpacity>
                    <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7FE' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    backButton: { padding: 8, backgroundColor: 'white', borderRadius: 12 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#111C44' },
    list: { padding: 16 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { padding: 10, backgroundColor: '#F0F9FF', borderRadius: 12, marginRight: 12 },
    content: { flex: 1 },
    restaurantName: { fontSize: 16, fontWeight: 'bold', color: '#111C44' },
    date: { fontSize: 12, color: '#A3AED0', marginTop: 2 },
    price: { fontSize: 16, fontWeight: 'bold', color: '#05CD99' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    badge: { backgroundColor: '#F4F7FE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 10, color: '#A3AED0', fontWeight: 'bold' },
    statusBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 10, color: '#05CD99', fontWeight: 'bold' },
    emptyText: { color: '#A3AED0', fontSize: 16 },
    cameraIcon: { flexDirection: 'row', alignItems: 'center', marginRight: 10, backgroundColor: '#F0F9FF', padding: 4, borderRadius: 8 },
    cameraText: { color: '#0EA5E9', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: '100%', height: '80%' },
    closeModalButton: { position: 'absolute', top: 50, right: 20, zIndex: 10 }
});

export default HistoryScreen;
