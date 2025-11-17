import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns/format';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, ScrollView, Button } from 'react-native';

import ScreenName from '../constants/ScreenName';
import { trpc } from '../lib/trpc';

import type { FeedStackParamList } from '../navigation/FeedStackParamList';
import type { UserDreamStackParamList } from '../navigation/UserDreamStackParamList';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type DreamScreenRouteProp = RouteProp<
  FeedStackParamList & UserDreamStackParamList,
  ScreenName.Dream
>;
type DreamScreenStackParamList = FeedStackParamList & UserDreamStackParamList;
type DreamScreenNavProp = NativeStackNavigationProp<
  DreamScreenStackParamList,
  ScreenName.Dream
>;

export const DreamScreen = () => {
  const route = useRoute<DreamScreenRouteProp>();
  const navigation = useNavigation<DreamScreenNavProp>();
  const { data, isLoading, error } = trpc.getDream.useQuery({
    id: route.params.id,
  });
  const { data: meData } = trpc.getMe.useQuery();

  if (isLoading) {
    return (
      <ScrollView style={styles.container}>
        <Text>Loading...</Text>
        <StatusBar style="auto" />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <ScrollView style={styles.container}>
        <Text>Error: {error.message}</Text>
        <StatusBar style="auto" />
      </ScrollView>
    );
  }

  if (!data.dream) {
    return (
      <ScrollView style={styles.container}>
        <Text>Dream not found.</Text>
        <StatusBar style="auto" />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.description}>Dream id: {data.dream.id}</Text>
      <Text style={styles.description}>By: {data.dream.author.nickname}</Text>
      <Text style={styles.description}>{data.dream.title}</Text>
      <Text style={styles.description}>{data.dream.description}</Text>
      <Text style={styles.description}>{data.dream.text}</Text>
      <Text style={styles.description}>
        Created At: {format(new Date(data.dream.createdAt), 'dd-MM-yyyy HH:mm')}
      </Text>
      {meData?.me?.id === data.dream.author.id ? (
        <Button
          title="Edit dream"
          onPress={() =>
            navigation.navigate(ScreenName.EditDream, {
              id: String(data.dream.id),
            })
          }
        />
      ) : null}
      <StatusBar style="auto" />
    </ScrollView>
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
