import { THEME } from "@excalidraw/excalidraw";
import { EVENT, CODES, KEYS } from "@excalidraw/common";
import { useEffect, useLayoutEffect, useState } from "react";

import type { Theme } from "@excalidraw/element/types";

import { STORAGE_KEYS } from "./app_constants";

const getDarkThemeMediaQuery = (): MediaQueryList | undefined =>
  window.matchMedia?.("(prefers-color-scheme: dark)");

export const useHandleAppTheme = () => {
  // Always force light mode - dark mode disabled
  const appTheme = THEME.LIGHT;
  const editorTheme = THEME.LIGHT;

  // Clear any stored theme preference to ensure light mode
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCAL_STORAGE_THEME, THEME.LIGHT);
  }, []);

  return {
    editorTheme,
    appTheme,
    setAppTheme: () => {}, // No-op function since theme cannot be changed
  };
};
