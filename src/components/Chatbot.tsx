import { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    { role: "bot", text: "Bonjour 👋 Je suis votre assistant RH. Comment puis-je vous aider ?" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // 👉 Ici tu connecteras ton API IA
    const fakeReply = {
      role: "bot",
      text: "Je traite votre demande… (réponse IA ici)"
    };

    setTimeout(() => {
      setMessages(prev => [...prev, fakeReply]);
    }, 800);
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition z-50"
      >
        <MessageSquare className="w-7 h-7" />
      </button>

      {/* Fenêtre chatbot */}
      {open && (
        <div className="fixed bottom-24 right-6 w-96 h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-bold text-slate-900">Assistant intelligent</h3>
            <button onClick={() => setOpen(false)}>
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl max-w-[80%] ${
                  msg.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-900"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t flex items-center space-x-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Écrire un message..."
              className="flex-1 border rounded-xl px-3 py-2 outline-none"
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
