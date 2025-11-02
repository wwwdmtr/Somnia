import _ from "lodash";

export const dreams = _.times(100, (i) => ({
  id: i + 1,
  nickname: `user${i + 1}`,
  title: `Dream${i + 1}`,
  description: `I dreamed about some interesting number ${i + 1}.`,
  text: `This is a detailed description of dream number ${i + 1}. It was a fascinating experience that left a lasting impression on me. I can't wait to explore more dreams like this in the future!`,
}));
