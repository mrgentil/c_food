import { View, Text, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect } from "react";
import * as Animatable from "react-native-animatable";
import * as Progress from "react-native-progress";

const PreparingOrderScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    setTimeout(() => {
      navigation.navigate("Main");
      Alert.alert("Commande Passée ! 🎉", "Votre commande a été créée avec succès !", [
        {
          text: "OK",
          onPress: () => navigation.navigate("Main", { screen: "Orders" }),
          style: "cancel",
        },
      ]);
    }, 4000);
  }, []);

  return (
    <SafeAreaView className="bg-[#0EA5E9] flex-1 justify-center items-center">
      <Animatable.Image
        source={require("../assets/orderLoding.gif")}
        animation="slideInUp"
        iterationCount={1}
        className="h-96 w-96"
      />
      <Animatable.Text
        animation="slideInUp"
        iterationCount={1}
        className="text-xl my-10 text-white font-bold text-center"
      >
        En attente d'acceptation du restaurant...
      </Animatable.Text>
      <Progress.Circle size={60} indeterminate={true} color="white" />
    </SafeAreaView>
  );
};

export default PreparingOrderScreen;
