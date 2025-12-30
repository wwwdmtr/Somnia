/* eslint-disable @typescript-eslint/no-require-imports */
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddDreamForm } from "../../components/forms/AddDreamForm";
import { trpc } from "../../lib/trpc";
import { typography, COLORS } from "../../theme/typography";

import type { AddDreamStackParamList } from "../../navigation/AddDreamStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type AddDreamNavProp = NativeStackNavigationProp<
  AddDreamStackParamList,
  "AddDream"
>;

export const AddDreamScreen = () => {
  const { isLoading, error } = trpc.getPosts.useQuery();

  const navigation = useNavigation<AddDreamNavProp>();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error.message}</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.BackgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.goBackWrapper}
          >
            <Image
              source={require("../../assets/Icons/navIcons/goBack.png")}
            ></Image>
            <Text style={typography.body_white85}>Назад</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.add_dream_header}>
          <Text style={typography.h2_white85}>Новый сон</Text>
          <Image
            source={require("../../assets/Icons/decorIcons/edit-outline.png")}
          ></Image>
        </View>

        <AddDreamForm />
        <StatusBar style="auto" />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  BackgroundImage: {
    flex: 1,
  },
  add_dream_header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 20,
    marginTop: 40,
  },
  container: {
    flex: 1,
    padding: 14,
  },

  goBackWrapper: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  header: {
    alignItems: "center",
    backgroundColor: COLORS.navBarBackground,
    borderRadius: 99,
    flexDirection: "row",
    height: 44,
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
});
