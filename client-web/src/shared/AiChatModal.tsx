import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import type { Product } from "../services/productApi";
import { PdpQuickviewModal } from "./PdpQuickviewModal";
import { addToCart } from "../services/orderApi";

type Message = {
  role: "user" | "agent";
  text: string;
  product?: Product;
};

type ApiMessage = { role: "user" | "assistant"; content: string };

const WELCOME_MSG: Message = {
  role: "agent",
  text: "Xin chào! Tôi là Stylist AI của trustme-shop ✨\nHãy mô tả bạn đang cần mặc gì — dịp gì, thời tiết thế nào, hay style bạn thích — tôi sẽ gợi ý bộ outfit phù hợp!",
};

async function callAiChat(history: ApiMessage[]): Promise<Message> {
  try {
    const res = await axios.post("/api/ai/chat", { messages: history });
    return {
      role: "agent",
      text: res.data.reply ?? "Xin lỗi, tôi không hiểu. Bạn thử lại nhé!",
      product: res.data.product ?? undefined,
    };
  } catch (e: any) {
    const msg = e?.response?.data?.message;
    if (e?.response?.status === 429 && msg) {
      return { role: "agent", text: `⏳ ${msg}` };
    }
    return {
      role: "agent",
      text: "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Bạn thử lại sau nhé! 🙏",
    };
  }
}

type Props = {
  onClose: () => void;
};

export const AiChatModal: React.FC<Props> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Track conversation history for API (exclude welcome message)
  const historyRef = useRef<ApiMessage[]>([]);

  // PDP Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setInput("");

    // Add user message to UI + history
    setMessages((prev) => [...prev, { role: "user", text }]);
    historyRef.current = [...historyRef.current, { role: "user", content: text }];
    setThinking(true);

    try {
      const reply = await callAiChat(historyRef.current);
      // Add assistant reply to history
      historyRef.current = [...historyRef.current, { role: "assistant", content: reply.text }];
      setMessages((prev) => [...prev, reply]);
    } finally {
      setThinking(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  const handleAddToCart = (product: Product, size: string) => {
    addToCart({ product, quantity: 1, size });
  };

  return (
    <>
      <div
        className="ai-modal-backdrop"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        style={{ zIndex: selectedProduct ? 200 : 300 }}
      >
        <div className="ai-modal" role="dialog" aria-label="AI Chat">
          <div className="ai-modal-header">
            <h3>✨ AI Stylist</h3>
            <button className="ai-modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="ai-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-bubble ${msg.role}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  {msg.text.split("\n").map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < msg.text.split("\n").length - 1 && <br />}
                    </span>
                  ))}
                </div>
                {msg.product && (
                  <div 
                    onClick={() => setSelectedProduct(msg.product as Product)}
                    style={{ 
                      marginTop: 8, 
                      padding: 12, 
                      background: 'white', 
                      borderRadius: 8, 
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                    <div className="image-placeholder" style={{ width: 48, height: 48, fontSize: '1.2rem', flexShrink: 0 }}>
                      {msg.product.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--text)' }}>
                        {msg.product.name}
                      </div>
                      <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 'var(--font-sm)', marginTop: 4 }}>
                        {msg.product.price.toLocaleString("vi-VN")} ₫
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {thinking && (
              <div className="ai-bubble thinking">AI đang tìm đồ cho bạn…</div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="ai-input-bar">
            <input
              className="ai-input"
              type="text"
              placeholder="Thử nhập: 'mình cần đồ đi làm'…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              autoFocus
            />
            <button className="ai-send-btn" onClick={handleSend} disabled={!input.trim() || thinking}>
              ➤
            </button>
          </div>
        </div>
      </div>

      <PdpQuickviewModal
        isOpen={!!selectedProduct}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />
    </>
  );
};
