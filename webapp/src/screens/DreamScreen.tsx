import { useRoute, RouteProp } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { trpc } from "../lib/trpc";

import type { RootStackParamList } from "../navigation/RootStackParamList";

type DreamScreenRouteProp = RouteProp<RootStackParamList, "Dream">;

export const DreamScreen = () => {
  const route = useRoute<DreamScreenRouteProp>();
  const { data, isLoading, error } = trpc.getDream.useQuery({
    id: route.params.id,
  });

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

  if (!data.dream) {
    return (
      <View style={styles.container}>
        <Text>Dream not found.</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.description}>Dream id: {data.dream.id}</Text>
      <Text style={styles.description}>{data.dream.nickname}</Text>
      <Text style={styles.description}>{data.dream.title}</Text>
      <Text style={styles.description}>{data.dream.description}</Text>
      <Text style={styles.description}>{data.dream.text}</Text>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

const COLORS = {
  background: "#fff",
  cardBackground: "#f7f7f7",
  descriptionColor: "#555",
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
    marginTop: 24,
    padding: 14,
  },
  description: {
    color: COLORS.descriptionColor,
    fontSize: 16,
    margin: 12,
  },
});
