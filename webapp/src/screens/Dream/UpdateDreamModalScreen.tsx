/* eslint-disable @typescript-eslint/no-require-imports */
// src/screens/EditDreamScreen.tsx

import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { UpdateDreamForm } from "../../components/forms/UpdateDreamForm";
import ScreenName from "../../constants/ScreenName";
import { trpc } from "../../lib/trpc";
import { typography } from "../../theme/typography";

import type { AddDreamStackParamList } from "../../navigation/AddDreamStackParamList";
import type { FeedStackParamList } from "../../navigation/FeedStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = FeedStackParamList & AddDreamStackParamList;

type EditDreamRouteProp = RouteProp<RootStackParamList, ScreenName.EditDream>;
type EditDreamNavProp = NativeStackNavigationProp<
  RootStackParamList,
  ScreenName.EditDream
>;

export const UpdateDreamScreen = () => {
  const route = useRoute<EditDreamRouteProp>();
  const navigation = useNavigation<EditDreamNavProp>();

  const { data, isLoading, error } = trpc.getDream.useQuery({
    id: String(route.params.id),
  });

  if (isLoading) {
    return (
      <ScrollView style={styles.container}>
        <Text>Loading...</Text>
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView style={styles.container}>
        <Text>Error: {error.message}</Text>
      </ScrollView>
    );
  }

  if (!data?.post) {
    return (
      <ScrollView style={styles.container}>
        <Text>Dream not found</Text>
      </ScrollView>
    );
  }

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.BackgroundImage}
    >
      <ScrollView style={styles.container}>
        <Text style={typography.h2_white100}>Изменение сна</Text>
        <View style={styles.form_container}>
          <UpdateDreamForm
            post={data.post}
            onSuccess={() => navigation.goBack()}
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  BackgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    gap: 28,
    marginTop: 24,
    padding: 14,
  },
  form_container: {
    marginTop: 40,
  },
});
