import React, { useState, useEffect } from "react";
import { AiChatModal } from "./AiChatModal";

const SESSION_KEY = "ai_tooltip_dismissed";

export const AiChatWidget: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [hidingTooltip, setHidingTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Only show tooltip if not dismissed this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const showTimer = setTimeout(() => setShowTooltip(true), 300);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!showTooltip) return;
    // Auto-dismiss after 5.5s (0.5s fade-out animation = 5s visible)
    const hideTimer = setTimeout(() => dismissTooltip(), 5500);
    return () => clearTimeout(hideTimer);
  }, [showTooltip]);

  const dismissTooltip = () => {
    setHidingTooltip(true);
    setTimeout(() => {
      setShowTooltip(false);
      setHidingTooltip(false);
      sessionStorage.setItem(SESSION_KEY, "1");
    }, 400); // match animation duration
  };

  const openChat = () => {
    if (showTooltip) dismissTooltip();
    setShowModal(true);
  };

  return (
    <>
      {/* FAB + Tooltip */}
      <div className="ai-widget" aria-label="AI Chat Widget">
        {showTooltip && (
          <button
            className={`ai-tooltip${hidingTooltip ? " hiding" : ""}`}
            onClick={openChat}
            aria-label="Không biết mặc gì hôm nay? Hỏi AI đi!"
          >
            Không biết mặc gì hôm nay? Hỏi AI đi!
          </button>
        )}
        <button
          id="ai-fab-btn"
          className="ai-fab"
          onClick={openChat}
          aria-label="Mở AI Stylist Chat"
        >
          ✨
        </button>
      </div>

      {/* Chat Modal */}
      {showModal && <AiChatModal onClose={() => setShowModal(false)} />}
    </>
  );
};
