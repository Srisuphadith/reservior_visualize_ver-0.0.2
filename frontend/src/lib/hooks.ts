import { useCallback, useEffect, useState } from "react";
import { parseFilters, serializeFilters, type Filters } from "./filters";

/** Filters live in the URL query string so a view can be shared. */
export function useUrlFilters(): [Filters, (patch: Partial<Filters>) => void] {
  const [filters, setFilters] = useState(() => parseFilters(window.location.search));

  useEffect(() => {
    const onPop = () => setFilters(parseFilters(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const update = useCallback((patch: Partial<Filters>) => {
    setFilters((prev) => {
      const next = { ...prev, ...patch };
      const url = `${window.location.pathname}${serializeFilters(next)}`;
      window.history.replaceState(null, "", url);
      return next;
    });
  }, []);

  return [filters, update];
}

export function useColorScheme(): "light" | "dark" {
  const query = "(prefers-color-scheme: dark)";
  const [dark, setDark] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return dark ? "dark" : "light";
}
