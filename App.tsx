import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BoardPage from './pages/BoardPage';
import PostPage from './pages/PostPage';
import WritePage from './pages/WritePage';
import MyPage from './pages/MyPage';
import ShopPage from './pages/ShopPage';
import WikiPage from './pages/WikiPage';
import AdminPage from './pages/AdminPage';
import { TermsPage, PrivacyPage, YouthPolicyPage } from './pages/PolicyPages';

const { HashRouter, Routes, Route } = ReactRouterDOM as any;

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
            <Route path="shop" element={<ShopPage />} />
            <Route path="wiki" element={<WikiPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="youth-policy" element={<YouthPolicyPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;