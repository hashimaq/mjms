"use client";

import { ProductAssistantPanel } from "@/components/catalogue/assistant/ProductAssistantPanel";
import { Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export function ProductAssistantLauncher() {
  const titleId = useId();
  const dialogId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);
  const openModal = useCallback(() => setOpen(true), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="catalogue-assistant-fab"
        onClick={openModal}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        title="Open AI Assistant"
      >
        <Sparkles className="catalogue-assistant-fab-icon" aria-hidden />
        <span className="catalogue-assistant-fab-label">AI Assistant</span>
      </button>

      <div
        className="catalogue-assistant-modal-root"
        data-open={open ? "true" : "false"}
        aria-hidden={!open}
      >
        <button
          type="button"
          className="catalogue-assistant-modal-backdrop"
          aria-label="Close AI Assistant"
          tabIndex={open ? 0 : -1}
          onClick={close}
        />

        <div
          id={dialogId}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="catalogue-assistant-modal"
          tabIndex={-1}
        >
          <header className="catalogue-assistant-modal-header">
            <div className="catalogue-assistant-modal-header-text">
              <h2 id={titleId} className="catalogue-assistant-modal-title">
                AI Assistant
              </h2>
              <p className="catalogue-assistant-modal-subtitle">
                Find products using natural language
              </p>
            </div>
            <button
              type="button"
              className="catalogue-assistant-modal-close"
              onClick={close}
              aria-label="Close AI Assistant"
            >
              <X aria-hidden />
            </button>
          </header>

          <div className="catalogue-assistant-modal-body">
            <ProductAssistantPanel embedded />
          </div>
        </div>
      </div>
    </>
  );
}
