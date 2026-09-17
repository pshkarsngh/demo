"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant?: "success" | "error" | "info" | "warning";
}

export interface NotificationPrefs {
  admissionDeadlines: boolean;
  scholarshipAlerts: boolean;
  applicationUpdates: boolean;
  featuredRecommendations: boolean;
  emailDigest: boolean;
}

interface AppContextValue {
  savedColleges: string[];
  savedCourses: string[];
  compareList: string[];
  recentViews: string[];
  recentSearches: string[];
  recentLocations: string[];
  compareHistory: string[][];
  prefs: NotificationPrefs;
  toasts: ToastItem[];

  isSaved: (id: string) => boolean;
  toggleSave: (id: string, name?: string) => void;

  isCourseSaved: (slug: string) => boolean;
  toggleCourseSave: (slug: string, name?: string) => void;

  isComparing: (id: string) => boolean;
  compareFull: boolean;
  toggleCompare: (id: string, name?: string) => void;
  clearCompare: () => void;
  recordComparison: (ids: string[]) => void;

  addRecentView: (id: string) => void;
  addRecentSearch: (query: string) => void;
  addRecentLocation: (loc: string) => void;

  setPrefs: (p: Partial<NotificationPrefs>) => void;

  showToast: (t: Omit<ToastItem, "id">) => void;
  dismissToast: (id: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const MAX_COMPARE = 4;

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [savedColleges, setSavedColleges] = useState<string[]>([]);
  const [savedCourses, setSavedCourses] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [recentViews, setRecentViews] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentLocations, setRecentLocations] = useState<string[]>([]);
  const [compareHistory, setCompareHistory] = useState<string[][]>([]);
  const [prefs, setPrefsState] = useState<NotificationPrefs>({
    admissionDeadlines: true,
    scholarshipAlerts: true,
    applicationUpdates: true,
    featuredRecommendations: true,
    emailDigest: false,
  });
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    // Hydrate persisted state from localStorage on first mount only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSavedColleges(load("cp_saved", []));
    setSavedCourses(load("cp_saved_courses", []));
    setCompareList(load("cp_compare", []));
    setRecentViews(load("cp_recent_views", []));
    setRecentSearches(load("cp_recent_searches", []));
    setRecentLocations(load("cp_recent_locations", []));
    setCompareHistory(load("cp_compare_history", []));
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    save("cp_saved", savedColleges);
  }, [savedColleges]);
  useEffect(() => {
    if (!hydrated.current) return;
    save("cp_saved_courses", savedCourses);
  }, [savedCourses]);
  useEffect(() => {
    if (!hydrated.current) return;
    save("cp_compare", compareList);
  }, [compareList]);
  useEffect(() => {
    if (!hydrated.current) return;
    save("cp_recent_views", recentViews);
  }, [recentViews]);
  useEffect(() => {
    if (!hydrated.current) return;
    save("cp_recent_searches", recentSearches);
  }, [recentSearches]);
  useEffect(() => {
    if (!hydrated.current) return;
    save("cp_recent_locations", recentLocations);
  }, [recentLocations]);
  useEffect(() => {
    if (!hydrated.current) return;
    save("cp_compare_history", compareHistory);
  }, [compareHistory]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (t: Omit<ToastItem, "id">) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
      window.setTimeout(() => dismissToast(id), 3600);
    },
    [dismissToast],
  );

  const toggleSave = useCallback(
    (id: string, name?: string) => {
      setSavedColleges((prev) => {
        const exists = prev.includes(id);
        if (exists) {
          showToast({
            variant: "info",
            title: "Removed from saved",
            description: name ? `${name} removed from your list.` : undefined,
          });
          return prev.filter((x) => x !== id);
        }
        showToast({
          variant: "success",
          title: "College saved",
          description: name ? `${name} added to your saved colleges.` : undefined,
        });
        return [id, ...prev];
      });
    },
    [showToast],
  );

  const toggleCourseSave = useCallback(
    (slug: string, name?: string) => {
      setSavedCourses((prev) => {
        const exists = prev.includes(slug);
        if (exists) {
          showToast({ variant: "info", title: "Course removed", description: name ? `${name} removed.` : undefined });
          return prev.filter((x) => x !== slug);
        }
        showToast({ variant: "success", title: "Course saved", description: name ? `${name} saved to your dashboard.` : undefined });
        return [slug, ...prev];
      });
    },
    [showToast],
  );

  const toggleCompare = useCallback(
    (id: string, name?: string) => {
      setCompareList((prev) => {
        const exists = prev.includes(id);
        if (exists) {
          showToast({
            variant: "info",
            title: "Removed from compare",
            description: name ? `${name} removed.` : undefined,
          });
          return prev.filter((x) => x !== id);
        }
        if (prev.length >= MAX_COMPARE) {
          showToast({
            variant: "warning",
            title: "Comparison full",
            description: "You can compare up to 4 colleges at a time.",
          });
          return prev;
        }
        showToast({
          variant: "success",
          title: "Added to compare",
          description: `${name ?? ""} added. Compare up to 4 colleges.`,
        });
        return [...prev, id];
      });
    },
    [showToast],
  );

  const clearCompare = useCallback(() => {
    setCompareList([]);
    showToast({ variant: "info", title: "Comparison cleared" });
  }, [showToast]);

  const recordComparison = useCallback((ids: string[]) => {
    setCompareHistory((prev) => {
      const key = ids.join("|");
      const next = [ids, ...prev.filter((l) => l.join("|") !== key)];
      return next.slice(0, 6);
    });
  }, []);

  const addRecentView = useCallback((id: string) => {
    setRecentViews((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 12));
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;
    setRecentSearches((prev) => [q, ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 8));
  }, []);

  const addRecentLocation = useCallback((loc: string) => {
    setRecentLocations((prev) => [loc, ...prev.filter((x) => x !== loc)].slice(0, 6));
  }, []);

  const setPrefs = useCallback((p: Partial<NotificationPrefs>) => {
    setPrefsState((prev) => ({ ...prev, ...p }));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      savedColleges,
      savedCourses,
      compareList,
      recentViews,
      recentSearches,
      recentLocations,
      compareHistory,
      prefs,
      toasts,
      isSaved: (id) => savedColleges.includes(id),
      toggleSave,
      isCourseSaved: (slug) => savedCourses.includes(slug),
      toggleCourseSave,
      isComparing: (id) => compareList.includes(id),
      compareFull: compareList.length >= MAX_COMPARE,
      toggleCompare,
      clearCompare,
      recordComparison,
      addRecentView,
      addRecentSearch,
      addRecentLocation,
      setPrefs,
      showToast,
      dismissToast,
    }),
    [
      savedColleges,
      savedCourses,
      compareList,
      recentViews,
      recentSearches,
      recentLocations,
      compareHistory,
      prefs,
      toasts,
      toggleSave,
      toggleCourseSave,
      toggleCompare,
      clearCompare,
      recordComparison,
      addRecentView,
      addRecentSearch,
      addRecentLocation,
      setPrefs,
      showToast,
      dismissToast,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}