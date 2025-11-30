import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, ImageBackground, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '../../components/ui/AppButton';
import ScreenName from '../../constants/ScreenName';
import { typography } from '../../theme/typography';

import type { AuthStackParamList } from '../../navigation/AuthStackParamList';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  ScreenName.Onboarding
>;

export const OnboardingScreen = () => {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();

  return (
    <ImageBackground
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      source={require('../../assets/backgrounds/onboarding-main.png')}
      style={styles.BackgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.logo}>
          <Text style={typography.h1_white100}>Somnia</Text>
          <Text style={typography.body_white85}>
            Облако для ваших сноведений
          </Text>
        </View>

        <AppButton
          title="Начать"
          onPress={() => navigation.navigate(ScreenName.SignIn)}
          style={styles.startButton}
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  BackgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  logo: {
    height: 78,
    justifyContent: 'space-between',
    marginLeft: 16,
    marginTop: 490,
    width: 244,
  },
  startButton: {
    height: 40,
    marginHorizontal: 16,
    marginTop: 120,
    width: 'auto',
  },
});
