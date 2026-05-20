import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";

import ScreenName from "../constants/ScreenName";

import type { RootStackParamList } from "../navigation/RootStackParamList";
import type { NavigationProp } from "@react-navigation/native";

export const useOpenAuthScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return useCallback(() => {
    navigation.navigate(ScreenName.Onboarding);
  }, [navigation]);
};
