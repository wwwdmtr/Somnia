import { useNavigation } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppScreen } from "../../components/layout/AppScreen";
import { AppButton } from "../../components/ui/AppButton";
import ScreenName from "../../constants/ScreenName";
import TabName from "../../constants/TabName";
import { SHELL_CONTENT_WIDTH } from "../../constants/layout";
import { COLORS, typography } from "../../theme/typography";

import type { RootStackParamList } from "../../navigation/RootStackParamList";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type GreetingsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  ScreenName.Greetings
>;

export const GreetingsScreen = () => {
  const navigation = useNavigation<GreetingsNavigationProp>();

  const handleOpenFeed = () => {
    navigation.navigate(ScreenName.RootTabs, {
      screen: TabName.FeedTab,
      params: {
        screen: ScreenName.Feed,
      },
    });
  };

  return (
    <AppScreen background="auth" contentStyle={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <Text style={[typography.h2_white100, styles.title]}>
            Социальная сеть - Универ
          </Text>

          <View style={styles.textBlock}>
            <Text style={typography.body_white85}>
              Сперва хочу поблагодарить вас за проявленный интерес!
            </Text>

            <Text style={typography.body_white85}>
              Перед вами бета-версия социальной сети университета, созданная
              студентом в рамках дипломной работы.
            </Text>

            <Text style={typography.body_white85}>
              Идея проекта - собрать университетскую жизнь в одном месте. Кто-то
              ищет модель на съемку, кто-то - музыкантов или команду для
              медиа-проекта. Кто-то хочет найти кружок по рисованию, сходить на
              игру университетской команды. А может кто-нибудь однажды принесет
              проектор и устроит летний киноклуб под открытым небом - и весь
              университет узнает об этом именно здесь.
            </Text>

            <Text style={typography.body_white85}>
              Университетская жизнь состоит именно из таких вещей - и о них
              должно быть удобно узнавать.
            </Text>

            <Text style={typography.body_white85}>
              Сейчас проект находится на этапе первичного тестирования внутри
              кафедры, и именно ваши отзывы помогут понять, каким должен стать
              «Универ» дальше.
            </Text>
            <Text style={typography.body_white85}>
              P.S. В приложении есть одноименная группа &quot;Универ&quot; -
              туда я буду выкладывать новости о развитии проекта
            </Text>
            <View style={styles.contacts}>
              <Text style={typography.body_white85}>tg: @vodolazskii</Text>
              <Text style={typography.body_white85}>
                email: socialrguk@gmail.com
              </Text>
            </View>
          </View>

          <AppButton
            title="Принять участие"
            onPress={handleOpenFeed}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  button: {
    marginTop: 4,
  },
  contacts: {
    gap: 4,
    marginTop: 6,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  content: {
    alignSelf: "center",
    backgroundColor: COLORS.surfaceBackgroundStrong,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 24,
    borderWidth: 1,
    gap: 24,
    maxWidth: SHELL_CONTENT_WIDTH,
    padding: 20,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 32,
    paddingTop: 32,
  },
  textBlock: {
    gap: 16,
  },
  title: {
    textAlign: "center",
  },
});
