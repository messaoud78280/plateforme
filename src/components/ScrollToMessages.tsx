"use client";

import { useEffect } from "react";

function scrollToMessages() {
  if (typeof window !== "undefined" && window.location.hash === "#messages") {
    const el = document.getElementById("messages");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}

export function ScrollToMessages() {
  useEffect(() => {
    scrollToMessages();
    window.addEventListener("hashchange", scrollToMessages);
    return () => window.removeEventListener("hashchange", scrollToMessages);
  }, []);

  return null;
}
