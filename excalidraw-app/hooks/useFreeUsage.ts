import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";

// Free usage constants
const FREE_GENERATIONS_LIMIT = 10;
const USAGE_STORAGE_KEY = "excalidraw_free_generations_used";

// Singleton state management
class FreeUsageManager {
  private static instance: FreeUsageManager;
  private usageCount: number = 0;
  private listeners: Set<(count: number) => void> = new Set();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): FreeUsageManager {
    if (!FreeUsageManager.instance) {
      FreeUsageManager.instance = new FreeUsageManager();
    }
    return FreeUsageManager.instance;
  }

  private loadFromStorage() {
    const savedUsage = localStorage.getItem(USAGE_STORAGE_KEY);
    if (savedUsage) {
      const parsedUsage = parseInt(savedUsage, 10);
      if (!isNaN(parsedUsage)) {
        this.usageCount = parsedUsage;
      }
    }
  }

  private saveToStorage() {
    localStorage.setItem(USAGE_STORAGE_KEY, this.usageCount.toString());
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.usageCount));
  }

  getUsageCount(): number {
    return this.usageCount;
  }

  canGenerate(isSignedIn: boolean): boolean {
    // Signed-in users have unlimited generations
    if (isSignedIn) {
      return true;
    }
    // Non-signed-in users have limited generations
    return this.usageCount < FREE_GENERATIONS_LIMIT;
  }

  incrementUsage(isSignedIn: boolean): void {
    if (!isSignedIn) {
      this.usageCount += 1;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  resetUsage(): void {
    this.usageCount = 0;
    this.saveToStorage();
    this.notifyListeners();
  }

  getRemainingGenerations(isSignedIn: boolean): number {
    if (isSignedIn) {
      return Infinity;
    }
    return Math.max(0, FREE_GENERATIONS_LIMIT - this.usageCount);
  }

  subscribe(listener: (count: number) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const useFreeUsage = () => {
  const { isSignedIn } = useUser();
  const [usageCount, setUsageCount] = useState(() =>
    FreeUsageManager.getInstance().getUsageCount(),
  );

  useEffect(() => {
    const manager = FreeUsageManager.getInstance();

    // Subscribe to usage count changes
    const unsubscribe = manager.subscribe(setUsageCount);

    // Reset usage for signed-in users
    if (!!isSignedIn) {
      manager.resetUsage();
    } else {
      // Sync with current usage count for non-signed-in users
      setUsageCount(manager.getUsageCount());
    }

    return unsubscribe;
  }, [isSignedIn]);

  const canGenerate = useCallback(() => {
    return FreeUsageManager.getInstance().canGenerate(!!isSignedIn);
  }, [isSignedIn]);

  const incrementUsage = useCallback(() => {
    FreeUsageManager.getInstance().incrementUsage(!!isSignedIn);
  }, [isSignedIn]);

  const getRemainingGenerations = useCallback(() => {
    return FreeUsageManager.getInstance().getRemainingGenerations(!!isSignedIn);
  }, [isSignedIn]);

  return {
    usageCount,
    canGenerate,
    incrementUsage,
    getRemainingGenerations,
    isSignedIn,
    maxFreeGenerations: FREE_GENERATIONS_LIMIT,
  };
};
