import { useFormik } from "formik";
import React from "react";
import { View, TextInput, Button } from "react-native";

export const AddDreamForm = () => {
  const { values, setFieldValue, handleSubmit } = useFormik({
    initialValues: {
      title: "",
      description: "",
      text: "",
    },
    onSubmit: (values) => {
      console.info("Dream submitted:", values);
    },
  });

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Dream title"
        value={values.title}
        onChangeText={(text) => setFieldValue("title", text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Dream description"
        value={values.description}
        onChangeText={(text) => setFieldValue("description", text)}
        style={styles.input}
      />
      <TextInput
        placeholder="Dream text"
        value={values.text}
        onChangeText={(text) => setFieldValue("text", text)}
        multiline
        style={styles.textArea}
      />
      <Button title="Submit Dream" onPress={() => handleSubmit()} />
    </View>
  );
};

const styles = {
  container: {
    padding: 20,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
  },
  textArea: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    height: 100,
  },
};
