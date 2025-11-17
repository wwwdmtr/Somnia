// src/screens/EditDreamScreen.tsx

import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text } from "react-native";

import { UpdateDreamForm } from "../components/UpdateDreamForm";
import ScreenName from "../constants/ScreenName";
import { trpc } from "../lib/trpc";

import type { FeedStackParamList } from "../navigation/FeedStackParamList";
import type { UserDreamStackParamList } from "../navigation/UserDreamStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type RootStackParamList = FeedStackParamList & UserDreamStackParamList;

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

  if (!data?.dream) {
    return (
      <ScrollView style={styles.container}>
        <Text>Dream not found</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <UpdateDreamForm
        dream={data.dream}
        onSuccess={() => navigation.goBack()}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 24,
    padding: 14,
  },
});
