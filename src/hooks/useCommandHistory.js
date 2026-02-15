import { useRef, useCallback } from "react";

export function useCommandHistory(setInputValue) {
  const historyRef = useRef([]);
  const indexRef = useRef(-1);
  const tempRef = useRef("");

  const pushCommand = useCallback((cmd) => {
    if (cmd.trim()) {
      historyRef.current = [...historyRef.current, cmd.trim()];
    }
    indexRef.current = -1;
    tempRef.current = "";
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      const history = historyRef.current;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (history.length === 0) return;
        if (indexRef.current === -1) {
          tempRef.current = e.target.value;
          indexRef.current = history.length - 1;
        } else if (indexRef.current > 0) {
          indexRef.current--;
        }
        setInputValue(history[indexRef.current]);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (indexRef.current === -1) return;
        if (indexRef.current < history.length - 1) {
          indexRef.current++;
          setInputValue(history[indexRef.current]);
        } else {
          indexRef.current = -1;
          setInputValue(tempRef.current);
        }
      }
    },
    [setInputValue]
  );

  return { pushCommand, handleKeyDown };
}
