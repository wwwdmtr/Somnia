//import { RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Button, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SignUpForm } from '../components/SignUpForm';
import { SignInForm } from '../components/signInForm';
import ScreenName from '../constants/ScreenName';
import { useAppContext } from '../lib/ctx';

import type { ProfileStackParamList } from '../navigation/ProfileStackParamList';

//import type { UserDreamStackParamList } from '../navigation/UserDreamStackParamList';

//type DreamScreenRouteProp = RouteProp<UserDreamStackParamList, 'UserDreams'>;

type ProfileScreenNavigationProp =
  NativeStackNavigationProp<ProfileStackParamList>;

export const ProfileScreen = () => {
  const { me, isLoading } = useAppContext();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  //  const navigation = useNavigation<DreamScreenRouteProp>();

  return (
    <SafeAreaView style={styles.container}>
      <Text>
        {isLoading
          ? 'Загрузка...'
          : me
            ? `Вы авторизованы — ${me.nickname}`
            : 'Вы не авторизованы'}
      </Text>
      <Text style={styles.description}>registration</Text>
      <SignUpForm />
      <Text style={styles.description}>Sign In</Text>
      <SignInForm />
      {me ? (
        <Button
          title="Sign Out"
          onPress={() => navigation.navigate(ScreenName.SignOut)}
        />
      ) : null}
      <StatusBar style="auto" />
    </SafeAreaView>
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
