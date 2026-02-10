import { useEffect, useState } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
  ScrollView,
  StyleSheet
} from "react-native";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import MapViewDirections from "react-native-maps-directions";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  updateDoc,
  doc,
  collection,
  where,
  query,
  getDocs,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import { useAuth } from "../../contexts/AuthContext";

const GOOGLE_MAPS_API_KEY = "AIzaSyCi-MWuhMrs1DfJqTycPWS8N9KorPuAs-0";

const OrderDelivery = ({ route }) => {
  const { order } = route.params;
  const { driverProfile } = useAuth();
  const [driverLocation, setDriverLocation] = useState(null);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalKm, setTotalKm] = useState(0);
  const [orderStatus, setOrderStatus] = useState(order.status || "preparing");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();

  const restaurantLocation = {
    latitude: order.restaurantLatitude || -4.4419,
    longitude: order.restaurantLongitude || 15.2663,
  };
  const deliveryLocation = {
    latitude: order.userLatitude || -4.4419,
    longitude: order.userLongitude || 15.2663,
  };

  useEffect(() => {
    getDriverLocation();
  }, []);

  // 🔔 Listen for new messages
  useEffect(() => {
    if (!order?.id) return;
    const chatRef = collection(db, 'orders', order.id, 'chat');
    const unsubscribeChat = onSnapshot(chatRef, (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(doc => doc.data());
        // Sort by date to get the most recent one
        docs.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));

        const lastMsg = docs[docs.length - 1];
        // If the last message is from the client, show badge
        if (lastMsg && lastMsg.senderType === 'client') {
          setUnreadCount(1);
        } else {
          setUnreadCount(0);
        }
      }
    });

    return () => unsubscribeChat();
  }, [order?.id]);

  const getDriverLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission refusée", "L'accès à la localisation est nécessaire");
      return;
    }
    let location = await Location.getCurrentPositionAsync();
    setDriverLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  };

  const updateOrderStatus = async (newStatus) => {
    setLoading(true);
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        ...(newStatus === 'picked_up' && { driverId: driverProfile?.id })
      });
      setOrderStatus(newStatus);
    } catch (e) {
      console.error("Erreur mise à jour:", e);
      Alert.alert("Erreur", "Impossible de mettre à jour le statut");
    }
    setLoading(false);
  };

  const getButtonConfig = () => {
    switch (orderStatus) {
      case 'preparing':
        return { label: "🏢 Arrivé au restaurant", color: "#0EA5E9", nextStatus: "arrived_at_restaurant" };
      case 'arrived_at_restaurant':
        return { label: "📦 Commande Récupérée", color: "#3B82F6", nextStatus: "picked_up" };
      case 'picked_up':
        return { label: "📍 Arrivé chez le client", color: "#F59E0B", nextStatus: "arrived_at_customer" };
      case 'arrived_at_customer':
        return { label: "✅ Commande Livrée", color: "#10B981", nextStatus: "delivered" };
      default:
        return null;
    }
  };



  const handleMainAction = () => {
    const config = getButtonConfig();
    if (!config) return;

    if (config.nextStatus === 'delivered') {
      Alert.alert(
        "Livraison terminée",
        "Confirmez-vous avoir livré la commande au client ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Oui, livrée", onPress: async () => {
              await updateOrderStatus("delivered");
              Alert.alert("🎉 Bravo !", "Livraison effectuée avec succès !", [{ text: "OK", onPress: () => navigation.goBack() }]);
            }
          }
        ]
      );
    } else {
      updateOrderStatus(config.nextStatus);
    }
  };

  const callClient = () => {
    if (order.userPhoneNumber) Linking.openURL(`tel:${order.userPhoneNumber}`);
    else Alert.alert("Erreur", "Numéro non disponible");
  };

  const openChat = () => {
    navigation.navigate("ChatScreen", {
      orderId: order.id,
      clientName: `${order.userFirstName} ${order.userLastName}`,
      clientId: order.userId
    });
  };

  const formatPrice = (price) => new Intl.NumberFormat('fr-CD').format(price || 0) + ' FC';

  if (!driverLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const buttonConfig = getButtonConfig();

  return (
    <View style={styles.container}>
      {/* Map - 40% height */}
      <View style={{ height: height * 0.4 }}>
        <MapView
          style={{ flex: 1 }}
          showsUserLocation
          initialRegion={{
            latitude: driverLocation.latitude,
            longitude: driverLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <MapViewDirections
            origin={driverLocation}
            destination={orderStatus === "preparing" || orderStatus === "arrived_at_restaurant" ? restaurantLocation : deliveryLocation}
            strokeWidth={5}
            strokeColor="#0EA5E9"
            apikey={GOOGLE_MAPS_API_KEY}
            onReady={(result) => { setTotalMinutes(result.duration); setTotalKm(result.distance); }}
          />
          <Marker coordinate={restaurantLocation} title={order.restaurantName}>
            <View style={[styles.marker, { backgroundColor: (orderStatus === 'preparing' || orderStatus === 'arrived_at_restaurant') ? '#0EA5E9' : '#6B7280' }]}>
              <MaterialIcons name="restaurant" size={20} color="white" />
            </View>
          </Marker>
          <Marker coordinate={deliveryLocation} title={order.userFirstName}>
            <View style={[styles.marker, { backgroundColor: (orderStatus === 'picked_up' || orderStatus === 'arrived_at_customer') ? '#0EA5E9' : '#111C44' }]}>
              <FontAwesome5 name="user" size={18} color="white" />
            </View>
          </Marker>
        </MapView>

        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111C44" />
        </TouchableOpacity>

        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.statusText, { color: '#D97706' }]}>
            {buttonConfig?.label || 'COMMANDE'}
          </Text>
        </View>
      </View>

      {/* Details - 60% height */}
      <ScrollView style={styles.detailsContainer} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalMinutes.toFixed(0)}</Text>
            <Text style={styles.statLabel}>min</Text>
          </View>
          <View style={styles.statIcon}>
            <FontAwesome5 name="shopping-bag" size={24} color="#0EA5E9" />
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalKm.toFixed(1)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
        </View>

        {/* Restaurant */}
        <Text style={styles.sectionTitle}>{order.restaurantName}</Text>
        <Text style={styles.sectionSubtitle}>{order.restaurantAddress}</Text>

        {/* Client */}
        <View style={styles.clientCard}>
          <View style={styles.clientRow}>
            <FontAwesome5 name="user" size={18} color="#0EA5E9" />
            <Text style={styles.clientName}>{order.userFirstName} {order.userLastName}</Text>
          </View>
          <View style={styles.clientRow}>
            <FontAwesome5 name="map-marker-alt" size={18} color="#0EA5E9" />
            <Text style={styles.clientAddress}>{order.userAddress}</Text>
          </View>
        </View>

        {/* Contact Buttons */}
        <View style={styles.contactRow}>
          <TouchableOpacity onPress={callClient} style={[styles.contactButton, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="call" size={20} color="#3B82F6" />
            <Text style={[styles.contactText, { color: '#3B82F6' }]}>Appeler</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openChat} style={[styles.contactButton, { backgroundColor: '#F0F9FF', position: 'relative' }]}>
            <Ionicons name="chatbubble" size={20} color="#0EA5E9" />
            <Text style={[styles.contactText, { color: '#0EA5E9' }]}>Message</Text>
            {unreadCount > 0 && (
              <View style={{
                position: 'absolute',
                top: -5,
                right: -5,
                backgroundColor: '#EF4444',
                width: 20,
                height: 20,
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 2,
                borderColor: 'white'
              }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>!</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total à encaisser</Text>
          <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
        </View>
      </ScrollView>

      {/* Action Button */}
      {buttonConfig && (
        <TouchableOpacity onPress={handleMainAction} disabled={loading} style={[styles.actionButton, { backgroundColor: buttonConfig.color }]}>
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.actionText}>{buttonConfig.label}</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FE' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111C44' },
  loadingText: { color: 'white', marginTop: 16 },
  marker: { padding: 8, borderRadius: 20, borderWidth: 3, borderColor: 'white' },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'white', padding: 12, borderRadius: 16 },
  statusBadge: { position: 'absolute', top: 50, right: 20, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  statusText: { fontWeight: 'bold', fontSize: 12 },
  detailsContainer: { flex: 1, backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -20, paddingHorizontal: 20, paddingTop: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  statItem: { alignItems: 'center', marginHorizontal: 20 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#111C44' },
  statLabel: { color: '#6B7280', fontSize: 12 },
  statIcon: { width: 50, height: 50, backgroundColor: '#F0FDF4', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111C44', marginTop: 16 },
  sectionSubtitle: { color: '#6B7280', marginBottom: 16 },
  clientCard: { backgroundColor: '#F4F7FE', padding: 16, borderRadius: 16, marginBottom: 16 },
  clientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  clientName: { marginLeft: 12, fontWeight: '600', color: '#111C44', fontSize: 16 },
  clientAddress: { marginLeft: 12, color: '#6B7280', flex: 1 },
  contactRow: { flexDirection: 'row', marginBottom: 16 },
  contactButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, marginHorizontal: 4 },
  contactText: { marginLeft: 8, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalLabel: { color: '#6B7280' },
  totalValue: { fontSize: 24, fontWeight: 'bold', color: '#3FC060' },
  actionButton: { position: 'absolute', bottom: 30, left: 20, right: 20, paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  actionText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});

export default OrderDelivery;
