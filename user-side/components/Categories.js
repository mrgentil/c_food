import { ScrollView, TouchableOpacity, Text, View } from "react-native";
import React from "react";
import CategoryCard from "./CategoryCard";

// Catégories basées sur les vrais genres de restaurants dans Firestore
const CATEGORIES = [
  { id: 'all', title: 'Tout', imgUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200', genre: null },
  { id: 'congolais', title: 'Congolais', imgUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=200', genre: 'Congolais' },
  { id: 'traditionnel', title: 'Tradition', imgUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200', genre: 'Traditionnel' },
  { id: 'italien', title: 'Italien', imgUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200', genre: 'Italien' },
  { id: 'francais', title: 'Français', imgUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200', genre: 'Français' },
  { id: 'international', title: "Int'l", imgUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=200', genre: 'International' },
  { id: 'fastfood', title: 'Fast Food', imgUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', genre: 'Fast Food' },
  { id: 'boulangerie', title: 'Boulange', imgUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200', genre: 'Boulangerie' },
  { id: 'japonais', title: 'Japonais', imgUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200', genre: 'Japonais' },
  { id: 'grill', title: 'Bar & Grill', imgUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200', genre: 'Bar & Grill' },
];

const Categories = ({ selectedCategory, onSelectCategory }) => {
  return (
    <ScrollView
      horizontal
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingTop: 10,
      }}
      showsHorizontalScrollIndicator={false}
    >
      {CATEGORIES.map((category) => (
        <CategoryCard
          key={category.id}
          imgUrl={category.imgUrl}
          title={category.title}
          isSelected={selectedCategory === category.id}
          onPress={() => onSelectCategory(category.id, category.genre)}
        />
      ))}
    </ScrollView>
  );
};

export default Categories;
