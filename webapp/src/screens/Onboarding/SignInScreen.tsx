import { ScrollView, StyleSheet } from "react-native";

import { SignInForm } from "../../components/SignInForm";

export const SignInScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <SignInForm />
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
