import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';

const promos = [
    {
        id: 1,
        title: "50% sur le 1er achat",
        subtitle: "Commandez miam miam",
        color: "bg-orange-500",
        image: "https://links.papareact.com/gn7" // Placeholder image or local asset if available
    },
    {
        id: 2,
        title: "Livraison Gratuite",
        subtitle: "Sur tout Kinshasa",
        color: "bg-blue-500",
        image: "https://links.papareact.com/gn7"
    },
    {
        id: 3,
        title: "Offre Spéciale",
        subtitle: "Menu Duo à -20%",
        color: "bg-purple-500",
        image: "https://links.papareact.com/gn7"
    }
];

const PromoBanner = () => {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 10 }}
            className="mt-2"
        >
            {promos.map((promo) => (
                <TouchableOpacity
                    key={promo.id}
                    className={`mr-4 relative overflow-hidden rounded-3xl p-5 w-72 h-36 ${promo.color} shadow-lg`}
                >
                    <View className="z-10 bg-black/10 absolute inset-0" />

                    <View className="z-20 flex-1 justify-center space-y-1">
                        <Text className="text-white font-bold text-2xl w-2/3 shadow-sm">
                            {promo.title}
                        </Text>
                        <Text className="text-white font-semibold text-sm opacity-90 shadow-sm">
                            {promo.subtitle}
                        </Text>
                        <View className="mt-2 bg-white/20 px-3 py-1 rounded-full self-start">
                            <Text className="text-white text-xs font-bold">Voir l'offre</Text>
                        </View>
                    </View>

                    {/* Decorative overlapping circle */}
                    <View className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full" />
                    <View className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-white/10 rounded-full" />

                    {/* Image (Optional) - Can be absolutely positioned for effect */}
                    {/* <Image 
            source={{ uri: promo.image }} 
            className="absolute right-2 bottom-2 w-20 h-20 opacity-80" 
          /> */}
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

export default PromoBanner;
