import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../../firebase/firebase";
import { collection, query, where, orderBy, getDocs, limit } from "firebase/firestore";

const WalletScreen = () => {
    const { driverProfile } = useAuth();
    const navigation = useNavigation();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(driverProfile?.walletBalance || 0);

    useEffect(() => {
        fetchTransactions();
    }, [driverProfile?.id]);

    const fetchTransactions = async () => {
        if (!driverProfile?.id) return;
        setLoading(true);
        try {
            // Fetch recent delivered orders as "Earnings"
            const q = query(
                collection(db, "orders"),
                where("driverId", "==", driverProfile.id),
                where("status", "==", "delivered"),
                orderBy("updatedAt", "desc"),
                limit(20)
            );

            const querySnapshot = await getDocs(q);
            const earnings = querySnapshot.docs.map(doc => ({
                id: doc.id,
                type: 'earning',
                amount: (doc.data().total || 0) * 0.1, // Assuming 10% commission for driver for now, or total? 
                // Let's assume driver gets delivery fee? Or percentage?
                // For now, let's display the full Order Total as a placeholder for "Cash Collected" vs "Commission"
                // Let's just show "Commission (10%)" as earning.
                date: doc.data().updatedAt,
                reference: `Course #${doc.id.slice(0, 5)}`
            }));

            setTransactions(earnings);

            // Calculate balance if not present (mock logic)
            const totalEarned = earnings.reduce((acc, item) => acc + item.amount, 0);
            setBalance(totalEarned); // Simple mock balance

        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayoutRequest = () => {
        Alert.alert(
            "Retrait",
            "Fonctionnalité de retrait bientôt disponible. Veuillez contacter le support pour un retrait manuel.",
            [{ text: "OK" }]
        );
    };

    const formatPrice = (price) => new Intl.NumberFormat('fr-CD').format(price || 0) + ' FC';

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const renderTransaction = ({ item }) => (
        <View style={styles.transactionCard}>
            <View style={[styles.iconContainer, { backgroundColor: item.type === 'earning' ? '#DCFCE7' : '#FEE2E2' }]}>
                <MaterialCommunityIcons
                    name={item.type === 'earning' ? "arrow-down-left" : "arrow-top-right"}
                    size={24}
                    color={item.type === 'earning' ? "#166534" : "#991B1B"}
                />
            </View>
            <View style={styles.transactionContent}>
                <Text style={styles.transactionTitle}>{item.type === 'earning' ? 'Commission Course' : 'Retrait'}</Text>
                <Text style={styles.transactionRef}>{item.reference}</Text>
            </View>
            <View style={styles.transactionRight}>
                <Text style={[styles.transactionAmount, { color: item.type === 'earning' ? '#166534' : '#991B1B' }]}>
                    {item.type === 'earning' ? '+' : '-'}{formatPrice(item.amount)}
                </Text>
                <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111C44" />
                </TouchableOpacity>
                <Text style={styles.title}>Mon Portefeuille</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Solde Disponible</Text>
                <Text style={styles.balanceValue}>{formatPrice(balance)}</Text>
                <TouchableOpacity style={styles.payoutButton} onPress={handlePayoutRequest}>
                    <Text style={styles.payoutText}>Demander un retrait</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Transactions récentes</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#0EA5E9" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={item => item.id}
                    renderItem={renderTransaction}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Aucune transaction récente</Text>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F7FE' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    backButton: { padding: 8, backgroundColor: 'white', borderRadius: 12 },
    title: { fontSize: 18, fontWeight: 'bold', color: '#111C44' },
    balanceCard: {
        margin: 16,
        padding: 24,
        backgroundColor: '#111C44',
        borderRadius: 24,
        alignItems: 'center'
    },
    balanceLabel: { color: '#A3AED0', fontSize: 14, marginBottom: 8 },
    balanceValue: { color: 'white', fontSize: 32, fontWeight: 'bold', marginBottom: 24 },
    payoutButton: {
        backgroundColor: '#0EA5E9',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center'
    },
    payoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111C44', marginLeft: 16, marginBottom: 12 },
    list: { paddingHorizontal: 16, paddingBottom: 20 },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12
    },
    iconContainer: { padding: 10, borderRadius: 12, marginRight: 16 },
    transactionContent: { flex: 1 },
    transactionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111C44' },
    transactionRef: { fontSize: 12, color: '#A3AED0' },
    transactionRight: { alignItems: 'flex-end' },
    transactionAmount: { fontSize: 16, fontWeight: 'bold' },
    transactionDate: { fontSize: 12, color: '#A3AED0' },
    emptyText: { textAlign: 'center', color: '#A3AED0', marginTop: 20 }
});

export default WalletScreen;
