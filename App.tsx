import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BoardPage from './pages/BoardPage';
import PostPage from './pages/PostPage';
import WritePage from './pages/WritePage';
import MyPage from './pages/MyPage';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="board/:boardId" element={<BoardPage />} />
            <Route path="board/:boardId/:postId" element={<PostPage />} />
            <Route path="write" element={<WritePage />} />
            <Route path="mypage" element={<MyPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
