import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { trpc } from '../../lib/trpc';

export const AllDreamsPage = () => {
  const { data, isLoading, error } = trpc.getDreams.useQuery();

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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>All Dreams</Text>
        {data.dreams.map((dream) => (
          <View key={dream.nickname} style={styles.card}>
            <Text style={styles.dreamTitle}>{dream.title}</Text>
            <Text style={styles.description}>{dream.description}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const COLORS = {
  background: '#fff',
  cardBackground: '#f7f7f7',
  descriptionColor: '#555',
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 10,
    marginBottom: 12,
    padding: 12,
  },
  container: {
    backgroundColor: COLORS.background,
    flex: 1,
    padding: 20,
  },
  description: {
    color: COLORS.descriptionColor,
    fontSize: 16,
  },
  dreamTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
