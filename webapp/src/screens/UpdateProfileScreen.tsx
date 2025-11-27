import { ScrollView, StyleSheet } from "react-native";

import { UpdateProfileForm } from "../components/UpdateProfileForm";

export const UpdateProfileScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <UpdateProfileForm />
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
