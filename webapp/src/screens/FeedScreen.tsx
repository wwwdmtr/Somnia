import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";

import { trpc } from "../lib/trpc";

import type { FeedStackParamList } from "../navigation/FeedStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type NavigationProp = NativeStackNavigationProp<FeedStackParamList, "Feed">;

export const AllDreamsScreen = () => {
  const { data, isLoading, error } = trpc.getDreams.useQuery();

  const navigation = useNavigation<NavigationProp>();

  const handleOpenDream = (id: string) => {
    navigation.navigate("Dream", { id });
  };

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
    <View style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>All Dreams</Text>
        {data.dreams.map((dream) => (
          <View key={dream.id} style={styles.card}>
            <Text style={styles.dreamTitle}>{dream.title}</Text>
            <Text style={styles.description}>{dream.nickname}</Text>
            <TouchableOpacity onPress={() => handleOpenDream(dream.id)}>
              <Text>read more...</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const COLORS = {
  background: "#fff",
  cardBackground: "#f7f7f7",
  descriptionColor: "#555",
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
    paddingBottom: 20,
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
    padding: 14,
  },
  description: {
    color: COLORS.descriptionColor,
    fontSize: 16,
  },
  dreamTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
  },
});
