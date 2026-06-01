import { useState } from "react";

function Chatbot() {
  const [open, setOpen] = useState(false);

    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: "Hi! I’m your HabitSync Coach 👋",
        },
    ]);

const [input, setInput] = useState("");

const sendMessage = async () => {
  if (!input.trim()) return;

  const userText = input;

  setMessages((prev) => [
    ...prev,
    { sender: "user", text: userText },
  ]);

  setInput("");

  try {
    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        message: userText,
      }),
    });

    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: data.reply || "Sorry, I could not generate a reply.",
      },
    ]);
  } catch (error) {
    console.error("Chatbot frontend error:", error);

    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: "Something went wrong while contacting the chatbot.",
      },
    ]);
  }
};

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-purple-600 text-white px-5 py-3 rounded-full shadow-lg z-50"
      >
        Chat
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-[#111827] text-white rounded-2xl shadow-xl border border-white/10 flex flex-col z-50">

          {/* Header */}
          <div className="p-4 border-b border-white/10 font-semibold">
            HabitSync Coach
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
  {messages.map((msg, index) => (
    <div
      key={index}
      className={`p-3 rounded-xl max-w-[80%] text-sm ${
        msg.sender === "user"
          ? "bg-purple-600 self-end"
          : "bg-white/10 self-start"
      }`}
    >
      {msg.text}
    </div>
  ))}
</div>

          {/* Input Area */}
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
  type="text"
  placeholder="Type a message..."
  value={input}
  onChange={(e) => setInput(e.target.value)}
  className="flex-1 bg-white/10 rounded-lg px-3 py-2 outline-none text-sm"
  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
/>

            <button
  onClick={sendMessage}
  className="bg-purple-600 px-4 py-2 rounded-lg text-sm"
>
  Send
</button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;