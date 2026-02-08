import { createSlice, createSelector } from "@reduxjs/toolkit";
import { Alert } from "react-native";

const initialState = {
  restaurantId: null,
  items: [],
};

export const basketSlice = createSlice({
  name: "basket",
  initialState,
  reducers: {
    addToBasket: (state, action) => {
      const itemRestaurantId = action.payload.restaurantId;

      if (state.restaurantId === null) {
        state.restaurantId = itemRestaurantId;
      }

      if (state.restaurantId === itemRestaurantId) {
        state.items = [...state.items, action.payload];
      } else {
        Alert.alert(
          "Oops!",
          `Vous ne pouvez pas ajouter ${action.payload.name} car c'est d'un autre restaurant.`,
          [{ text: "OK", style: "cancel" }],
          { cancelable: true }
        );
      }
    },

    removeFromBasket: (state, action) => {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id
      );

      let newBasket = [...state.items];

      if (index >= 0) {
        newBasket.splice(index, 1);
      } else {
        console.warn(
          `Can't remove product (id: ${action.payload.id}) as it's not in basket!`
        );
      }

      state.items = newBasket;

      // Reset restaurantId if basket is empty
      if (newBasket.length === 0) {
        state.restaurantId = null;
      }
    },

    // Add one more of the same item
    increaseQuantity: (state, action) => {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        state.items = [...state.items, { ...existingItem }];
      }
    },

    // Remove one of the same item (keeps at least one, use removeFromBasket to delete all)
    decreaseQuantity: (state, action) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index >= 0) {
        let newBasket = [...state.items];
        newBasket.splice(index, 1);
        state.items = newBasket;

        // Reset restaurantId if basket is empty
        if (newBasket.length === 0) {
          state.restaurantId = null;
        }
      }
    },

    // Clear entire basket
    clearBasket: (state) => {
      state.items = [];
      state.restaurantId = null;
    },
  },
});

export const { addToBasket, removeFromBasket, increaseQuantity, decreaseQuantity, clearBasket } = basketSlice.actions;

export const selectBasketItems = (state) => state.basket.items;

export const selectBasketItemsWithId = createSelector(
  [selectBasketItems, (state, id) => id],
  (items, id) => items.filter((item) => item.id === id)
);

export const selectBasketTotal = (state) =>
  state.basket.items.reduce((total, item) => (total += item.price), 0);

export default basketSlice.reducer;

