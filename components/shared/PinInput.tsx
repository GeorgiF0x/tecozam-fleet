import React, { useRef, useState } from "react";
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from "react-native";
import { colors, radius, spacing } from "@/lib/theme";

interface PinInputProps {
  value: string;
  onChange: (pin: string) => void;
  length?: number;
  /** Show error state (red border) */
  error?: boolean;
}

export function PinInput({ value, onChange, length = 4, error = false }: PinInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const digits = value.padEnd(length, "").split("").slice(0, length);

  function handleChange(text: string, index: number) {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length === 0) return;

    const char = cleaned[cleaned.length - 1];
    const newDigits = [...digits];
    newDigits[index] = char;
    const newPin = newDigits.join("").replace(/ /g, "");
    onChange(newPin);

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) {
    if (e.nativeEvent.key === "Backspace") {
      const newDigits = [...digits];
      if (newDigits[index] && newDigits[index] !== " ") {
        newDigits[index] = "";
        onChange(newDigits.join("").replace(/ /g, ""));
      } else if (index > 0) {
        newDigits[index - 1] = "";
        onChange(newDigits.join("").replace(/ /g, ""));
        inputRefs.current[index - 1]?.focus();
      }
    }
  }

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, i) => {
        const filled = i < value.length;
        return (
          <TextInput
            key={i}
            ref={(r) => { inputRefs.current[i] = r; }}
            style={[
              styles.box,
              filled && styles.boxFilled,
              error && styles.boxError,
            ]}
            value={filled ? "●" : ""}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            caretHidden
            textAlign="center"
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
  },
  box: {
    width: 60,
    height: 68,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    fontSize: 24,
    color: colors.foreground,
    textAlign: "center",
  },
  boxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "15",
  },
  boxError: {
    borderColor: colors.danger,
    backgroundColor: colors.danger + "10",
  },
});
