/* eslint-disable @typescript-eslint/no-require-imports */

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Text,
  View,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { UpdatePasswordForm } from "../../components/forms/UpdatePasswordForm";
import { UpdateProfileForm } from "../../components/forms/UpdateProfileForm";
import { AppButton } from "../../components/ui/AppButton";
import ScreenName from "../../constants/ScreenName";
import { ProfileStackParamList } from "../../navigation/ProfileStackParamList";
import { COLORS, typography } from "../../theme/typography";

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  ScreenName.UpdateProfile
>;

export const UpdateProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  return (
    <ImageBackground
      source={require("../../assets/backgrounds/application-bg.png")}
      style={styles.BackgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.goBackWrapper}
            >
              <Image
                source={require("../../assets/Icons/navIcons/goBack.png")}
              />
              <Text style={typography.body_white85}>Назад</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.name_settings_card}>
            <Text style={typography.h4_white_85}>Имя профиля</Text>
            <UpdateProfileForm />
          </View>

          <View style={styles.name_settings_card}>
            <Text style={typography.h4_white_85}>Изменение пароля</Text>
            <UpdatePasswordForm />
          </View>
        </ScrollView>
      </SafeAreaView>

      <AppButton
        title="Выйти из профиля"
        onPress={() => navigation.navigate(ScreenName.SignOut)}
        style={styles.signOutButton}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  BackgroundImage: {
    flex: 1,
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
  name_settings_card: {
    backgroundColor: COLORS.postsCardBackground,
    borderRadius: 32,
    gap: 20,
    marginBottom: 8,
    padding: 20,
  },
  signOutButton: {
    bottom: 40,
    height: 40,
    left: 16,
    position: "absolute",
    right: 16,
    width: "auto",
  },
});
