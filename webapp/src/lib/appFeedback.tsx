import { Ionicons } from "@expo/vector-icons";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { COLORS, typography } from "../theme/typography";

type AppFeedbackKind = "success" | "error" | "loading";

type AppFeedbackState = {
  id: number;
  kind: AppFeedbackKind;
  title: string;
  message?: string;
};

type ShowFeedbackInput = {
  kind: AppFeedbackKind;
  title?: string;
  message?: string;
  durationMs?: number;
};

type AppFeedbackContextValue = {
  hideFeedback: () => void;
  showError: (message?: string, title?: string) => void;
  showFeedback: (input: ShowFeedbackInput) => void;
  showLoading: (title?: string, message?: string) => void;
  showSuccess: (title?: string, message?: string) => void;
};

const DEFAULT_FEEDBACK_DURATION_MS = 3000;
const FEEDBACK_ERROR_DELAY_MS = 650;
const FEEDBACK_FADE_IN_MS = 320;
const FEEDBACK_FADE_OUT_MS = 520;
const IGNORED_LOAD_ERROR_PARTS = [
  "unauthorized",
  "cannot read properties of undefined",
];

const AppFeedbackContext = createContext<AppFeedbackContextValue | null>(null);

const getDefaultTitle = (kind: AppFeedbackKind) => {
  if (kind === "success") {
    return "Готово";
  }

  if (kind === "loading") {
    return "Загрузка...";
  }

  return "Ошибка";
};

export const getErrorMessage = (
  error: unknown,
  fallback = "Что-то пошло не так",
) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export const AppFeedbackProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [animationProgress] = useState(() => new Animated.Value(0));
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackIdRef = useRef(0);
  const [feedback, setFeedback] = useState<AppFeedbackState | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const clearDismissTimer = useCallback(() => {
    if (!dismissTimerRef.current) {
      return;
    }

    clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = null;
  }, []);

  const hideFeedback = useCallback(
    (targetFeedbackId?: number) => {
      if (
        targetFeedbackId !== undefined &&
        targetFeedbackId !== feedbackIdRef.current
      ) {
        return;
      }

      clearDismissTimer();

      Animated.timing(animationProgress, {
        easing: Easing.in(Easing.cubic),
        duration: FEEDBACK_FADE_OUT_MS,
        toValue: 0,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          return;
        }

        if (
          targetFeedbackId !== undefined &&
          targetFeedbackId !== feedbackIdRef.current
        ) {
          return;
        }

        setIsVisible(false);
        setFeedback(null);
      });
    },
    [animationProgress, clearDismissTimer],
  );

  const showFeedback = useCallback(
    ({ kind, title, message, durationMs }: ShowFeedbackInput) => {
      const nextFeedbackId = feedbackIdRef.current + 1;
      feedbackIdRef.current = nextFeedbackId;
      clearDismissTimer();

      setFeedback({
        id: nextFeedbackId,
        kind,
        message,
        title: title ?? getDefaultTitle(kind),
      });
      setIsVisible(true);
      animationProgress.stopAnimation();
      animationProgress.setValue(0);

      Animated.timing(animationProgress, {
        easing: Easing.out(Easing.cubic),
        duration: FEEDBACK_FADE_IN_MS,
        toValue: 1,
        useNativeDriver: true,
      }).start();

      if (kind === "loading") {
        return;
      }

      dismissTimerRef.current = setTimeout(() => {
        hideFeedback(nextFeedbackId);
      }, durationMs ?? DEFAULT_FEEDBACK_DURATION_MS);
    },
    [animationProgress, clearDismissTimer, hideFeedback],
  );

  useEffect(() => {
    return () => {
      clearDismissTimer();
    };
  }, [clearDismissTimer]);

  const value = useMemo<AppFeedbackContextValue>(
    () => ({
      hideFeedback: () => hideFeedback(),
      showError: (message, title) =>
        showFeedback({
          kind: "error",
          message,
          title: title ?? "Ошибка",
        }),
      showFeedback,
      showLoading: (title, message) =>
        showFeedback({
          kind: "loading",
          message,
          title: title ?? "Загрузка...",
        }),
      showSuccess: (title, message) =>
        showFeedback({
          kind: "success",
          message,
          title: title ?? "Готово",
        }),
    }),
    [hideFeedback, showFeedback],
  );

  return (
    <AppFeedbackContext.Provider value={value}>
      <View style={styles.providerRoot}>
        {children}
        <AppFeedbackOverlay
          animationProgress={animationProgress}
          feedback={feedback}
          isVisible={isVisible}
        />
      </View>
    </AppFeedbackContext.Provider>
  );
};

export const useAppFeedback = () => {
  const context = useContext(AppFeedbackContext);
  if (!context) {
    throw new Error("useAppFeedback must be used inside AppFeedbackProvider");
  }

  return context;
};

export const useFeedbackOnError = (
  error: unknown,
  title = "Ошибка загрузки",
  fallbackMessage = "Не удалось загрузить данные",
  {
    delayMs = FEEDBACK_ERROR_DELAY_MS,
    enabled = true,
    ignoreTransientLoadErrors = true,
  }: {
    delayMs?: number;
    enabled?: boolean;
    ignoreTransientLoadErrors?: boolean;
  } = {},
) => {
  const { showError } = useAppFeedback();
  const lastShownErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !error) {
      lastShownErrorRef.current = null;
      return;
    }

    const message = getErrorMessage(error, fallbackMessage);
    const normalizedMessage = message.toLowerCase();
    const shouldIgnore =
      ignoreTransientLoadErrors &&
      IGNORED_LOAD_ERROR_PARTS.some((ignoredPart) =>
        normalizedMessage.includes(ignoredPart),
      );

    if (shouldIgnore) {
      return;
    }

    const errorKey = `${title}:${message}`;

    if (lastShownErrorRef.current === errorKey) {
      return;
    }

    lastShownErrorRef.current = errorKey;
    const timer = setTimeout(() => {
      showError(message, title);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [
    delayMs,
    enabled,
    error,
    fallbackMessage,
    ignoreTransientLoadErrors,
    showError,
    title,
  ]);
};

const AppFeedbackOverlay = ({
  animationProgress,
  feedback,
  isVisible,
}: {
  animationProgress: Animated.Value;
  feedback: AppFeedbackState | null;
  isVisible: boolean;
}) => {
  if (!feedback || !isVisible) {
    return null;
  }

  const isLoading = feedback.kind === "loading";
  const iconName =
    feedback.kind === "success"
      ? "checkmark-circle"
      : feedback.kind === "error"
        ? "alert-circle"
        : undefined;
  const accentColor =
    feedback.kind === "success"
      ? COLORS.success
      : feedback.kind === "error"
        ? COLORS.danger
        : COLORS.campusCyan;
  const translateY = animationProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [isLoading ? 10 : -12, 0],
  });
  const scale = animationProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlay,
        isLoading ? styles.loadingOverlay : styles.statusOverlay,
      ]}
    >
      <Animated.View
        style={[
          styles.card,
          {
            borderColor: accentColor,
            opacity: animationProgress,
            transform: [{ translateY }, { scale }],
          },
          isLoading ? styles.loadingCard : null,
        ]}
      >
        <View style={styles.iconWrap}>
          {isLoading ? (
            <ActivityIndicator color={COLORS.white100} size="small" />
          ) : iconName ? (
            <Ionicons name={iconName} size={26} color={accentColor} />
          ) : null}
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{feedback.title}</Text>
          {feedback.message ? (
            <Text style={styles.message}>{feedback.message}</Text>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: COLORS.surfaceBackgroundStrong,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    maxWidth: 420,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: COLORS.shadowInk,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    width: "100%",
  },
  iconWrap: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  loadingCard: {
    maxWidth: 360,
  },
  loadingOverlay: {
    backgroundColor: COLORS.mediaOverlay,
    justifyContent: "center",
  },
  message: {
    ...typography.caption_white85,
  },
  overlay: {
    alignItems: "center",
    bottom: 0,
    elevation: 1000,
    flex: 1,
    left: 0,
    paddingHorizontal: 14,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  providerRoot: {
    flex: 1,
  },
  statusOverlay: {
    justifyContent: "flex-start",
    paddingTop: 72,
  },
  textWrap: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    color: COLORS.white100,
    fontFamily: "SFProText-Semibold",
    fontSize: 16,
    lineHeight: 22,
  },
});
