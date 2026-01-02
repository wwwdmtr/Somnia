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

import { AddPostForm } from "../../components/forms/AddPostForm";
import { trpc } from "../../lib/trpc";
import { typography, COLORS } from "../../theme/typography";

import type { AddPostStackParamList } from "../../navigation/AddPostStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type AddPostNavProp = NativeStackNavigationProp<
  AddPostStackParamList,
  "AddPost"
>;

export const AddPostScreen = () => {
  const { isLoading, error } = trpc.getPosts.useQuery();

  const navigation = useNavigation<AddPostNavProp>();

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

        <AddPostForm />
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
