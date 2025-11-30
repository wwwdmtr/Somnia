import { ScrollView, StyleSheet } from "react-native";

import { SignUpForm } from "../../components/forms/SignUpForm";

export const SignUpScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <SignUpForm />
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
