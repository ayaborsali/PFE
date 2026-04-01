import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chat_messages");
    return saved
      ? JSON.parse(saved)
      : [
          {
            role: "bot",
            text: "Bonjour 👋 Je suis votre assistant RH. Comment puis-je vous aider ?"
          }
        ];
  });

  const [input, setInput] = useState("");
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 🔹 Sauvegarde messages
  useEffect(() => {
    localStorage.setItem("chat_messages", JSON.stringify(messages));
  }, [messages]);

  // 🔹 Scroll auto
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question: input })
      });

      const data = await response.json();

      setMessages(prev => [
        ...prev,
        { role: "bot", text: data.response }
      ]);

    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: "bot", text: "❌ Erreur serveur" }
      ]);
    }

    setLoading(false);
  };

  return (
    <>
      {/* 🔘 Bouton flottant */}
      <button
        onClick={() => setOpen(true)}
        className="fixed z-50 flex items-center justify-center w-16 h-16 text-white transition rounded-full shadow-2xl bottom-6 right-6 bg-gradient-to-br from-blue-600 to-indigo-600 hover:scale-110"
      >
        <MessageSquare className="w-7 h-7" />
      </button>

      {/* 💬 Chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 right-6 w-96 h-[520px] bg-white rounded-2xl shadow-2xl border flex flex-col z-50 overflow-hidden"
          >
            {/* 🔷 Header */}
            <div className="flex items-center justify-between p-4 text-white bg-gradient-to-r from-blue-600 to-indigo-600">
              <div>
                <h3 className="font-bold">Assistant RH</h3>
                <p className="text-xs opacity-80">En ligne</p>
              </div>
              <button onClick={() => setOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 📩 Messages */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50">
              {messages.map((msg: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "bot" && (
                    <div className="flex items-center justify-center w-8 h-8 text-sm text-white bg-blue-600 rounded-full">
                      🤖
                    </div>
                  )}

                  <div
                    className={`px-4 py-2 rounded-2xl max-w-[75%] text-sm shadow ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white text-slate-900 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {/* ⏳ Loader */}
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-full">
                    🤖
                  </div>
                  <div className="px-4 py-2 text-sm bg-white shadow rounded-2xl animate-pulse">
                    En train d'écrire...
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ⌨️ Input */}
            <div className="flex items-center gap-2 p-3 bg-white border-t">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Écrire un message..."
                className="flex-1 px-4 py-2 border rounded-full outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={e => e.key === "Enter" && sendMessage()}
              />

              <button
                onClick={sendMessage}
                className="p-3 text-white transition bg-blue-600 rounded-full hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}