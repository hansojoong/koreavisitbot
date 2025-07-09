// frontend/src/App.jsx
import React from 'react';
import Chatbot from './components/Chatbot.jsx'; // Chatbot 컴포넌트를 임포트

function App() {
  return (
    // 전체 화면 높이와 너비를 사용하고, flexbox를 이용한 중앙 정렬, 배경색 설정
    // p-4는 전체 패딩, w-screen은 화면 너비 100%
    <div className="min-h-screen w-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* 챗봇 컨테이너: 배경색, 패딩, 둥근 모서리, 그림자, 최대 너비 및 높이 설정 */}
      {/* max-w-4xl로 너비를 더 넓게, h-full로 부모 높이를 채우도록 설정 */}
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-4xl w-full h-full flex flex-col">
        {/* Chatbot 컴포넌트를 렌더링 */}
        <Chatbot />
      </div>
    </div>
  );
}

export default App; // App 컴포넌트를 기본 내보내기로 설정
