import { useRoute, RouteProp } from '@react-navigation/native';
import { format } from 'date-fns/format';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import ScreenName from '../constants/ScreenName';
import { trpc } from '../lib/trpc';

import type { FeedStackParamList } from '../navigation/FeedStackParamList';
import type { UserDreamStackParamList } from '../navigation/UserDreamStackParamList';

type DreamScreenRouteProp = RouteProp<
  FeedStackParamList & UserDreamStackParamList,
  ScreenName.Dream
>;

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
    <View style={styles.container}>
      <Text style={styles.description}>Dream id: {data.dream.id}</Text>
      <Text style={styles.description}>{data.dream.nickname}</Text>
      <Text style={styles.description}>{data.dream.title}</Text>
      <Text style={styles.description}>{data.dream.description}</Text>
      <Text style={styles.description}>{data.dream.text}</Text>
      <Text style={styles.description}>
        Created At: {format(new Date(data.dream.createdAt), 'yyyy-MM-dd')}
      </Text>
      <StatusBar style="auto" />
    </View>
  );
};

const COLORS = {
  background: '#fff',
  cardBackground: '#f7f7f7',
  descriptionColor: '#555',
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
