import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  TouchableOpacity,
  TextInput,
  Text,
  View,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { UserAuth } from "../contexts/AuthContext";
import { EnvelopeIcon, LockClosedIcon, ExclamationCircleIcon, ArrowRightIcon } from "react-native-heroicons/outline";
import { getFriendlyErrorMessage } from "../utils/firebaseErrors";
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

const SignIn = () => {
  const [value, setValue] = useState({
    email: "",
    password: "",
    emailError: "",
    passwordError: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const navigation = useNavigation();
  const { signInUser } = UserAuth();

  const validateEmail = (email) => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const onSignIn = async () => {
    let emailError = "";
    let passwordError = "";
    setSubmissionError("");

    if (value.email === "") {
      emailError = "L'email ne peut pas être vide.";
    } else if (!validateEmail(value.email)) {
      emailError = "Format d'email invalide.";
    }

    if (value.password === "") {
      passwordError = "Le mot de passe ne peut pas être vide.";
    } else if (!validatePassword(value.password)) {
      passwordError = "Le mot de passe doit contenir au moins 6 caractères.";
    }

    setValue({
      ...value,
      emailError,
      passwordError,
    });

    if (emailError || passwordError) {
      return;
    }

    setIsLoading(true);
    try {
      await signInUser(value.email, value.password);
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(error.code);
      setSubmissionError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, text) => {
    setValue({ ...value, [field]: text, [`${field}Error`]: "" });
    if (submissionError) setSubmissionError("");
  };

  return (
    <View className="flex-1 bg-[#F0F9FF]">
      <StatusBar style="dark" />

      {/* Background Decor */}
      <View className="absolute top-0 left-0 -mt-20 -ml-20 w-80 h-80 bg-blue-400 rounded-full opacity-10 blur-3xl" />
      <View className="absolute bottom-0 right-0 -mb-20 -mr-20 w-80 h-80 bg-orange-400 rounded-full opacity-10 blur-3xl" />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>

            {/* Header with 3D Image */}
            <View className="items-center justify-center pt-10 pb-6">
              <Animatable.View animation="bounceIn" duration={1500} className="shadow-2xl shadow-blue-500/30">
                <Image
                  source={{ uri: "https://cdn-icons-png.flaticon.com/512/7350/7350285.png" }} // 3D Chef
                  className="w-48 h-48"
                  resizeMode="contain"
                />
              </Animatable.View>
            </View>

            {/* Main Content Card */}
            <Animatable.View
              animation="fadeInUp"
              duration={1000}
              className="mx-5 bg-white/80 p-8 rounded-[40px] shadow-xl border border-white/60 backdrop-blur-md"
            >
              <View className="mb-6">
                <Text className="text-3xl font-extrabold text-center text-gray-800">
                  Content de vous revoir ! 👋
                </Text>
                <Text className="text-center text-gray-500 mt-2 font-medium">
                  Vos plats préférés vous attendent.
                </Text>
              </View>

              {/* Error Banner */}
              {submissionError ? (
                <Animatable.View animation="shake" className="bg-red-50 border border-red-200 rounded-2xl p-4 flex-row items-center space-x-3 mb-6">
                  <ExclamationCircleIcon size={24} color="#EF4444" />
                  <Text className="text-red-600 font-medium flex-1 text-sm leading-5">
                    {submissionError}
                  </Text>
                </Animatable.View>
              ) : null}

              <View className="space-y-5">
                {/* Email Input */}
                <View>
                  <Text className="text-gray-700 font-bold ml-4 mb-2">Email</Text>
                  <View className={`flex-row items-center border-2 rounded-2xl px-4 py-4 bg-gray-50/50 ${value.emailError ? "border-red-400 bg-red-50" : "border-gray-100 focus:border-[#0EA5E9] focus:bg-white"} transition-all duration-200`}>
                    <EnvelopeIcon size={22} color={value.emailError ? "#EF4444" : "#9CA3AF"} />
                    <TextInput
                      placeholder="votre@email.com"
                      value={value.email}
                      className="flex-1 ml-3 text-gray-800 font-semibold text-base"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onChangeText={(text) => handleChange('email', text)}
                      placeholderTextColor="#CBD5E1"
                    />
                  </View>
                  {value.emailError !== "" && (
                    <Animatable.Text animation="fadeInLeft" className="text-red-500 text-xs ml-4 mt-1 font-bold">{value.emailError}</Animatable.Text>
                  )}
                </View>

                {/* Password Input */}
                <View>
                  <Text className="text-gray-700 font-bold ml-4 mb-2">Mot de passe</Text>
                  <View className={`flex-row items-center border-2 rounded-2xl px-4 py-4 bg-gray-50/50 ${value.passwordError ? "border-red-400 bg-red-50" : "border-gray-100 focus:border-[#0EA5E9] focus:bg-white"} transition-all duration-200`}>
                    <LockClosedIcon size={22} color={value.passwordError ? "#EF4444" : "#9CA3AF"} />
                    <TextInput
                      placeholder="••••••••"
                      className="flex-1 ml-3 text-gray-800 font-semibold text-base"
                      onChangeText={(text) => handleChange('password', text)}
                      secureTextEntry={true}
                      placeholderTextColor="#CBD5E1"
                    />
                  </View>
                  {value.passwordError !== "" && (
                    <Animatable.Text animation="fadeInLeft" className="text-red-500 text-xs ml-4 mt-1 font-bold">{value.passwordError}</Animatable.Text>
                  )}
                  <TouchableOpacity className="self-end mt-2 mr-2">
                    <Text className="text-[#0EA5E9] font-bold text-xs">Mot de passe oublié ?</Text>
                  </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  onPress={onSignIn}
                  disabled={isLoading}
                  className={`w-full items-center py-4 rounded-2xl shadow-lg shadow-blue-400/50 mt-4 active:scale-95 duration-100 flex-row justify-center ${isLoading ? "bg-[#0EA5E9]/70" : "bg-gradient-to-r bg-[#0EA5E9]"}`}
                  style={{ backgroundColor: '#0EA5E9' }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text className="text-center text-white font-bold text-lg mr-2 uppercase tracking-wider">
                        Se Connecter
                      </Text>
                      <ArrowRightIcon size={20} color="white" strokeWidth={2.5} />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Footer Switch */}
              <View className="flex-row justify-center items-center mt-8 space-x-1">
                <Text className="text-gray-500 font-medium">
                  Nouveau client ?
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate("SignUp")} disabled={isLoading}>
                  <Text className="text-[#0EA5E9] font-extrabold text-base">Créer un compte</Text>
                </TouchableOpacity>
              </View>
            </Animatable.View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default SignIn;
