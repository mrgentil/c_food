import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import {
    BoltIcon,
    MapPinIcon,
    BanknotesIcon,
    StarIcon
} from "react-native-heroicons/solid";

const FilterPills = () => {
    const [activeCategory, setActiveCategory] = useState("Offres");

    const filters = [
        { id: "Offres", name: "Offres", icon: BanknotesIcon },
        { id: "Mieux_notes", name: "Mieux notés", icon: StarIcon },
        { id: "Rapide", name: "Rapide", icon: BoltIcon },
        { id: "Pres_de_moi", name: "Près de moi", icon: MapPinIcon },
        // A future filter could be "Healthy" or specific cuisine types if needed
    ];

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 15, gap: 10 }}
            className="pb-2 pt-3"
        >
            {filters.map((filter) => {
                let isActive = filter.id === activeCategory;
                return (
                    <TouchableOpacity
                        key={filter.id}
                        onPress={() => setActiveCategory(filter.id)}
                        className={`flex-row items-center space-x-1 px-4 py-2 rounded-full ${isActive ? "bg-[#0EA5E9]" : "bg-gray-100"
                            }`}
                    >
                        {/* Render Icon if available */}
                        {filter.icon && (
                            <filter.icon size={16} color={isActive ? "white" : "gray"} />
                        )}

                        <Text
                            className={`font-semibold text-xs ${isActive ? "text-white" : "text-gray-700"
                                }`}
                        >
                            {filter.name}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
};

export default FilterPills;
