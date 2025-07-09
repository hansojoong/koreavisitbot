import React, { useState, useRef, useEffect } from "react";

function Chatbot() {
  // 새로고침 시 초기화 (빈 배열)
  const [messages, setMessages] = useState([]);
  // 대화 누적 저장용 가상공간 상태
  const [savedMessages, setSavedMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    const trimmedMessage = inputMessage.trim();
    if (!trimmedMessage) {
      setError("질문을 입력해주세요.");
      return;
    }

    const newUserMessage = { text: trimmedMessage, sender: "user" };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedMessage, history: updatedMessages }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const newBotMessage = { text: data.reply, sender: "bot" };
      setMessages((prev) => [...prev, newBotMessage]);

      // 대화 누적 저장
      setSavedMessages((prev) => [...prev, newUserMessage, newBotMessage]);
    } catch (e) {
      console.error("Fetch error:", e);
      setError("답변을 가져오는 데 실패했습니다. 서버가 실행 중인지 확인하세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 대화내용 txt 파일로 다운로드
  const downloadChatHistory = () => {
    if (savedMessages.length === 0) {
      alert("저장된 대화 내용이 없습니다.");
      return;
    }

    const content = savedMessages
      .map((msg) => (msg.sender === "user" ? `사용자: ${msg.text}` : `봇: ${msg.text}`))
      .join("\n\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `chat_history_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="App flex flex-col h-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">한국 여행 AI 가이드</h1>

      <div className="chat-messages flex-1 overflow-y-auto p-4 bg-gray-50 rounded-lg shadow-inner mb-4 h-[calc(100vh-250px)]">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-10 whitespace-pre-line">
            한국여행에 대해 궁금하신점을 물어보세요 !
            {"\n"}Hello, please feel free to ask anything about traveling in Korea!
            {"\n"}韓国旅行についてご質問があればお気軽にどうぞ！
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex mb-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-xl shadow-md text-sm text-left ${
                msg.sender === "user"
                  ? "bg-white text-gray-800 border border-gray-300 rounded-br-none"
                  : "bg-yellow-100 text-gray-800 border border-yellow-300 rounded-bl-none"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start mb-4">
            <div className="max-w-[70%] p-3 rounded-xl shadow-md bg-yellow-100 text-gray-800 border border-yellow-300 rounded-bl-none text-left">
              <div className="flex items-center">
                <span className="animate-pulse">...</span>
                <span className="ml-2 text-sm text-gray-600">답변 생성 중</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area flex flex-col sm:flex-row gap-3 mb-4">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="한국 여행에 대해 궁금한 점을 입력하세요..."
          rows="3"
          className="flex-1 rounded-md p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200 flex-shrink-0"
        >
          {loading ? "전송 중..." : "한국 여행 질문하기"}
        </button>
      </div>

      <button
        onClick={downloadChatHistory}
        className="mb-6 px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
      >
        대화내용 다운로드 (.txt)
      </button>

      {error && <p className="error-message text-red-500 mt-2 text-sm text-center">{error}</p>}
    </div>
  );
}

export default Chatbot;
