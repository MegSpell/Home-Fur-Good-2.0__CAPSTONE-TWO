// src/components/FlashMessages.jsx
// ------------------------------------------------------------
// Global flash message component.
//
// This component listens for flash messages stored in AuthContext,
// displays them at the top of the page, and automatically hides
// them after a few seconds.
//
// Flash messages are ideal for:
//   - login errors
//   - signup success
//   - profile update confirmations
//   - "added to favorites" notices
//
// The structure here is intentionally simple so it can be reused
// across the entire app with minimal setup.
// ------------------------------------------------------------

import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function FlashMessages() {
  // Pull the current flash state + the function to clear it
  // from the global AuthContext.
  //
  // flash = { type: "success" | "error" | "info", message: "..." }
  const { flash, clearFlash } = useAuth();

  // ------------------------------------------------------------
  // Auto-hide logic:
  // When a flash message appears, we set a timer to clear it after
  // 4 seconds. If a new flash message comes in before the timer ends,
  // the effect re-runs and resets the timer.
  // ------------------------------------------------------------
  useEffect(() => {
    // If there's no flash message, nothing to do.
    if (!flash) return;

    // Set auto-dismiss timer.
    const timer = setTimeout(() => {
      clearFlash();
    }, 4000);

    // Cleanup: if the component unmounts or flash changes,
    // cancel the previous timer to avoid memory leaks.
    return () => clearTimeout(timer);
  }, [flash, clearFlash]);

  // If there's no flash message to display, render nothing.
  if (!flash) return null;

  // Pick a CSS class based on message type.
  // These correspond to .flash--success, .flash--error, .flash--info in CSS.
  const typeClass =
    flash.type === "success"
      ? "flash--success"
      : flash.type === "error"
      ? "flash--error"
      : "flash--info";

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="flash-container">
      <div className={`flash ${typeClass}`}>
        {/* Flash text */}
        <span>{flash.message}</span>

        {/* Manual dismiss button */}
        <button
          type="button"
          className="flash__close"
          onClick={clearFlash}
          aria-label="Dismiss message"
        >
          ×
        </button>
      </div>
    </div>
  );
}
