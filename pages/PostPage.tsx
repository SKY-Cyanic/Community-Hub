
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { Post, Comment } from '../types';
import CommentSection from '../components/CommentSection';
import { ThumbsUp, ThumbsDown, Share2, Eye, Clock, BarChart2, Ban, Trash2, Bookmark, Sparkles, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PostPage: React.FC = () => {
  const { boardId, postId } = useParams<{ boardId: string; postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthorMenu, setShowAuthorMenu] = useState(false);
  const { user, refreshUser } = useAuth();
  const [isScrapped, setIsScrapped] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (postId) {
        const postData = await api.getPost(postId);
        setPost(postData);
        
        const unsubscribe = storage.subscribeComments(postId, (updatedComments) => {
          setComments(updatedComments);
        });
        
        setLoading(false);
        return () => unsubscribe();
      }
    };
    fetchData();
  }, [postId]);

  useEffect(() => {
      if (user && post && user.scrapped_posts?.includes(post.id)) {
          setIsScrapped(true);
      } else {
          setIsScrapped(false);
      }
  }, [user, post]);

  const handleVote = async (type: 'up' | 'down') => {
    if (!post || !user) {
        alert('로그인이 필요합니다.');
        return;
    }
    if (post.liked_users && post.liked_users.includes(user.id)) {
        alert('이미 평가한 게시물입니다.');
        return;
    }
    const success = await api.votePost(post.id, type, user.id);
    if (success) {
        setPost(prev => {
            if(!prev) return null;
            return {
                ...prev,
                upvotes: type === 'up' ? prev.upvotes + 1 : prev.upvotes,
                downvotes: type === 'down' ? prev.downvotes + 1 : prev.downvotes,
                liked_users: [...(prev.liked_users || []), user.id]
            }
        });
    }
  };

  const handlePollVote = (optionId: string) => {
    if (!user) return alert('로그인이 필요합니다.');
    if (!post || !post.poll) return;
    const updatedPost = { ...post };
    if (updatedPost.poll!.voted_users.includes(user.id)) {
      return alert('이미 투표하셨습니다.');
    }
    updatedPost.poll!.voted_users.push(user.id);
    updatedPost.poll!.options = updatedPost.poll!.options.map(opt => 
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );
    storage.updatePost(updatedPost);
    setPost(updatedPost);
  };

  const handleScrap = async () => {
      if (!user || !post) return alert('로그인이 필요합니다.');
      await storage.toggleScrap(user.id, post.id);
      setIsScrapped(!isScrapped);
      refreshUser();
  };

  const handleDelete = async () => {
      if (!post) return;
      if (confirm('정말로 게시글을 삭제하시겠습니까?')) {
          await api.deletePost(post.id);
          alert('게시글이 삭제되었습니다.');
          navigate(`/board/${boardId}`);
      }
  };

  const handleBlock = (targetId: string) => {
      if(!user) return;
      if(confirm('이 사용자를 차단하시겠습니까?')) {
          storage.blockUser(user.id, targetId);
          refreshUser();
          alert('차단되었습니다.');
          navigate(`/board/${boardId}`);
      }
  };

  const processContent = (html: string) => {
    // Process Youtube Links
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
    return html.replace(youtubeRegex, (match, videoId) => {
      return `<div class="aspect-w-16 aspect-h-9 my-4"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen class="w-full h-full rounded shadow-lg" style="min-height: 300px;"></iframe></div>`;
    });
  };

  if (loading) return <div className="p-8 text-center dark:text-gray-300 animate-pulse">데이터 노드 동기화 중...</div>;
  if (!post) return <div className="p-8 text-center text-red-500">데이터가 손상되었거나 존재하지 않습니다.</div>;

  const hasVoted = user && post.liked_users && post.liked_users.includes(user.id);
  const canDelete = user && (user.is_admin || user.id === post.author_id);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-sm p-4 md:p-6 transition-colors">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <div className="flex items-center space-x-2 text-sm text-indigo-600 dark:text-indigo-400 font-bold mb-2">
           <Link to={`/board/${boardId}`} className="hover:underline">{boardId}</Link>
           {post.category && <span className="text-gray-400">/ {post.category}</span>}
        </div>
        <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-3">{post.title}</h1>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4 relative">
            <span 
                className="font-bold cursor-pointer hover:underline"
                onClick={() => setShowAuthorMenu(!showAuthorMenu)}
                style={{ color: post.author.active_items?.name_color }}
            >
                {post.author.active_items?.badge} {post.author.username}
            </span>
            {showAuthorMenu && user && user.id !== post.author_id && (
                <div className="absolute top-6 left-0 bg-white dark:bg-gray-700 shadow-xl border border-gray-200 dark:border-gray-600 rounded py-1 z-10 w-32">
                    <button onClick={() => handleBlock(post.author_id)} className="flex items-center gap-2 px-3 py-1.5 text-xs w-full text-left hover:bg-gray-100">
                        <Ban size={12} /> 차단하기
                    </button>
                    <Link to={`/messages?target=${post.author.username}`} className="flex items-center gap-2 px-3 py-1.5 text-xs w-full text-left hover:bg-gray-100 text-indigo-600 dark:text-indigo-300">
                        <Sparkles size={12} /> 메시지 보내기
                    </Link>
                </div>
            )}
            <span><Clock size={12} className="inline mr-1"/>{new Date(post.created_at).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-3">
             <span><Eye size={12} className="inline mr-1"/>{post.view_count}</span>
             <span className="text-red-500 font-bold"><ThumbsUp size={12} className="inline mr-1"/>{post.upvotes}</span>
          </div>
        </div>
      </div>
      
      {/* Utility Bar */}
      <div className="flex gap-2 mb-4">
         <button onClick={handleScrap} className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 border rounded-full transition-all ${isScrapped ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300'}`}>
            <Bookmark size={14} fill={isScrapped ? "currentColor" : "none"}/> 스크랩
         </button>
         <button className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-gray-50 text-gray-500 border border-gray-200 rounded-full dark:bg-gray-700 dark:text-gray-400">
            <AlertTriangle size={14}/> 신고
         </button>
      </div>

      {post.poll && (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600 rounded mb-6">
          <h3 className="font-bold mb-3 flex items-center gap-2"><BarChart2 size={18}/> {post.poll.question}</h3>
          <div className="space-y-2">
            {post.poll.options.map(opt => {
              const total = post.poll!.options.reduce((a, b) => a + b.votes, 0);
              const percent = total === 0 ? 0 : Math.round((opt.votes / total) * 100);
              return (
                <button key={opt.id} onClick={() => handlePollVote(opt.id)} className="w-full text-left p-3 rounded border relative overflow-hidden">
                    <div className="absolute top-0 left-0 bottom-0 bg-indigo-100 dark:bg-indigo-900/40" style={{ width: `${percent}%` }}></div>
                    <div className="relative flex justify-between text-sm font-medium">
                       <span>{opt.text}</span>
                       <span>{percent}% ({opt.votes}표)</span>
                    </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="py-6 min-h-[200px] leading-7">
        <div dangerouslySetInnerHTML={{ __html: processContent(post.content) }} />
      </div>

      <div className="flex justify-center space-x-4 my-8">
        <button onClick={() => handleVote('up')} disabled={hasVoted || !user} className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 transition-all ${hasVoted ? 'border-gray-300 text-gray-400' : 'border-red-500 text-red-500 hover:scale-105'}`}>
          <ThumbsUp size={24} />
          <span className="font-bold text-lg">{post.upvotes}</span>
        </button>
        <button onClick={() => handleVote('down')} disabled={hasVoted || !user} className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 transition-all ${hasVoted ? 'border-gray-300 text-gray-400' : 'border-blue-500 text-blue-500 hover:scale-105'}`}>
          <ThumbsDown size={24} />
          <span className="font-bold text-lg">{post.downvotes}</span>
        </button>
      </div>

      <div className="flex justify-between items-center border-t border-b py-3 mb-6">
         <div className="flex gap-2">
           <button className="text-gray-500 text-sm hover:text-gray-800"><Share2 size={16} className="inline mr-1"/> 공유</button>
           {canDelete && <button onClick={handleDelete} className="text-red-500 text-sm"><Trash2 size={16} className="inline mr-1"/> 삭제</button>}
         </div>
         <Link to={`/board/${boardId}`} className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded text-sm font-bold">목록으로</Link>
      </div>

      <CommentSection comments={comments} postId={post.id} postAuthorId={post.author_id} />
    </div>
  );
};

export default PostPage;
