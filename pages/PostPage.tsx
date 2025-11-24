
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { aiService } from '../services/ai';
import { Post, Comment, Poll } from '../types';
import CommentSection from '../components/CommentSection';
import { ThumbsUp, ThumbsDown, Share2, AlertTriangle, Eye, Clock, BarChart2, Ban, Trash2, Zap, Search, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PostPage: React.FC = () => {
  const { boardId, postId } = useParams<{ boardId: string; postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthorMenu, setShowAuthorMenu] = useState(false);
  const { user, refreshUser } = useAuth();

  // AI States
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const [showFactCheck, setShowFactCheck] = useState(false);
  const [factCheckResult, setFactCheckResult] = useState<{text: string, sources: {title:string, uri:string}[]} | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const [engagementTriggered, setEngagementTriggered] = useState(false);
  
  // Shortcuts logic
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

      if (e.key.toLowerCase() === 'a') {
        // console.log('Prev Post');
      } else if (e.key.toLowerCase() === 'q') {
        navigate(`/board/${boardId}`);
      } else if (e.key.toLowerCase() === 'w') {
        if(post && user) handleVote('up');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [boardId, post, user]);

  useEffect(() => {
    const fetchData = async () => {
      if (postId) {
        const postData = await api.getPost(postId);
        setPost(postData);
        const commentData = await api.getComments(postId);
        setComments(commentData);

        // Engagement Bot Logic (Run once per load)
        if (!engagementTriggered && postData && commentData.length === 0) {
           // Mock time check: if post is older than 10 seconds (simulating "ignored post")
           const diff = Date.now() - new Date(postData.created_at).getTime();
           if (diff > 10000) {
               setEngagementTriggered(true);
               aiService.generateComment(postData.content).then(async (aiComment) => {
                   if (aiComment) {
                       const botUser = storage.getBotUser();
                       const created = await api.createComment(postData.id, aiComment, botUser);
                       setComments(prev => [...prev, created]);
                   }
               });
           }
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [postId]);

  const handleSummarize = async () => {
    if (summaryText) return; // Already done
    setIsSummarizing(true);
    if (post) {
        const result = await aiService.summarize(post.content);
        setSummaryText(result);
    }
    setIsSummarizing(false);
  };

  const handleFactCheck = async () => {
    if (factCheckResult) return;
    setIsChecking(true);
    if (post) {
        const result = await aiService.factCheck(post.content);
        setFactCheckResult(result);
    }
    setIsChecking(false);
  };

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
    if (!updatedPost.poll) return;

    if (updatedPost.poll.voted_users.includes(user.id)) {
      return alert('이미 투표하셨습니다.');
    }

    updatedPost.poll.voted_users.push(user.id);
    updatedPost.poll.options = updatedPost.poll.options.map(opt => 
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );

    storage.updatePost(updatedPost);
    setPost(updatedPost);
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
          alert('차단되었습니다. 이제 이 사용자의 글이 보이지 않습니다.');
          navigate(`/board/${boardId}`);
      }
  };

  const processContent = (html: string) => {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/g;
    let processed = html.replace(youtubeRegex, (match, videoId) => {
      return `<div class="aspect-w-16 aspect-h-9 my-4"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="w-full h-full rounded shadow-lg" style="min-height: 360px;"></iframe></div>`;
    });
    return processed;
  };

  if (loading) return <div className="p-8 text-center dark:text-gray-300">로딩중...</div>;
  if (!post) return <div className="p-8 text-center text-red-500">게시글이 존재하지 않습니다.</div>;

  if (user && user.blocked_users.includes(post.author_id)) {
      return (
          <div className="p-8 text-center border rounded bg-gray-100 dark:bg-gray-800">
              <div className="text-gray-500 mb-4">차단한 사용자의 게시글입니다.</div>
              <button onClick={() => navigate(-1)} className="text-indigo-600 underline">뒤로가기</button>
          </div>
      )
  }

  const hasVoted = user && post.liked_users && post.liked_users.includes(user.id);
  
  const canDelete = user && (
      user.is_admin || 
      (user.id === post.author_id && (Date.now() - new Date(post.created_at).getTime()) < 24 * 60 * 60 * 1000)
  );

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm shadow-sm p-4 md:p-6 transition-colors">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <div className="flex items-center space-x-2 text-sm text-indigo-600 dark:text-indigo-400 font-bold mb-2">
           <Link to={`/board/${boardId}`} className="hover:underline">
              {boardId === 'free' ? '자유게시판' : boardId}
           </Link>
           {post.category && <span className="text-gray-400">/ {post.category}</span>}
        </div>
        <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white mb-3">{post.title}</h1>
        
        <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4 relative">
            <span 
                className="font-bold text-gray-700 dark:text-gray-300 cursor-pointer hover:underline"
                onClick={() => setShowAuthorMenu(!showAuthorMenu)}
                style={{ 
                    color: post.author.active_items?.name_color,
                    fontWeight: post.author.active_items?.name_style === 'bold' ? 'bold' : 'normal'
                }}
            >
                {post.author.active_items?.badge} {post.author.username}
            </span>
            
            {showAuthorMenu && user && user.id !== post.author_id && (
                <div className="absolute top-6 left-0 bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 rounded py-1 z-10 w-32">
                    <button onClick={() => handleBlock(post.author_id)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left">
                        <Ban size={12} /> 차단하기
                    </button>
                </div>
            )}

            {post.ip_addr && <span className="text-xs text-gray-400">({post.ip_addr})</span>}
            <span className="flex items-center gap-1"><Clock size={12}/> {new Date(post.created_at).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-3">
             <span className="flex items-center gap-1"><Eye size={12}/> {post.view_count}</span>
             <span className="flex items-center gap-1 text-red-500 font-bold"><ThumbsUp size={12}/> {post.upvotes}</span>
          </div>
        </div>
      </div>
      
      {/* AI Feature Buttons */}
      <div className="flex gap-2 mb-4">
        <button 
            onClick={() => { setShowSummary(!showSummary); handleSummarize(); }}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-full hover:bg-indigo-100 transition-colors dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
        >
            <Zap size={14} /> 3줄 요약
        </button>
        <button 
            onClick={() => { setShowFactCheck(!showFactCheck); handleFactCheck(); }}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-green-50 text-green-600 border border-green-100 rounded-full hover:bg-green-100 transition-colors dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
        >
            <Search size={14} /> 팩트 체크
        </button>
      </div>

      {/* AI Summary Box */}
      {showSummary && (
          <div className="mb-4 p-4 bg-indigo-50/50 dark:bg-gray-700/50 rounded-lg border border-indigo-100 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-indigo-500" />
                  <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">AI 파딱 요약</span>
              </div>
              {isSummarizing ? (
                  <div className="text-xs text-gray-500 animate-pulse">열심히 요약하는 중... (잠시만 기다려주세요)</div>
              ) : (
                  <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {summaryText}
                  </div>
              )}
          </div>
      )}

      {/* AI Fact Check Box */}
      {showFactCheck && (
          <div className="mb-4 p-4 bg-green-50/50 dark:bg-gray-700/50 rounded-lg border border-green-100 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                  <Search size={16} className="text-green-600" />
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">AI 팩트 체크</span>
              </div>
              {isChecking ? (
                  <div className="text-xs text-gray-500 animate-pulse">Google 검색 중...</div>
              ) : (
                  <div>
                      <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed mb-3">
                          {factCheckResult?.text}
                      </div>
                      {factCheckResult?.sources && factCheckResult.sources.length > 0 && (
                          <div className="border-t border-green-100 dark:border-gray-600 pt-2">
                              <div className="text-xs text-gray-500 mb-1">참고 출처:</div>
                              <ul className="space-y-1">
                                  {factCheckResult.sources.map((src, i) => (
                                      <li key={i} className="text-xs">
                                          <a href={src.uri} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate block">
                                              {src.title}
                                          </a>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      )}
                  </div>
              )}
          </div>
      )}

      {/* Poll Section */}
      {post.poll && (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 border border-gray-200 dark:border-gray-600 rounded mb-6">
          <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <BarChart2 size={18} className="text-indigo-600"/> {post.poll.question}
          </h3>
          <div className="space-y-2">
            {post.poll.options.map(opt => {
              const totalVotes = post.poll!.options.reduce((acc, curr) => acc + curr.votes, 0);
              const percent = totalVotes === 0 ? 0 : Math.round((opt.votes / totalVotes) * 100);
              const hasVotedPoll = post.poll!.voted_users.includes(user?.id || '');
              
              return (
                <div key={opt.id} className="relative">
                  <button 
                    onClick={() => handlePollVote(opt.id)}
                    disabled={hasVotedPoll}
                    className={`w-full text-left p-3 rounded border relative overflow-hidden transition-all ${hasVotedPoll ? 'cursor-default' : 'hover:border-indigo-400'}`}
                    style={{ borderColor: 'transparent' }}
                  >
                    <div className="absolute top-0 left-0 bottom-0 bg-indigo-100 dark:bg-indigo-900/40 z-0 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                    <div className="relative z-10 flex justify-between items-center">
                       <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">{opt.text}</span>
                       <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">{percent}% ({opt.votes}표)</span>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
          <div className="mt-2 text-right text-xs text-gray-500">
             {post.poll.voted_users.length}명 참여
          </div>
        </div>
      )}

      {/* Content */}
      <div className="py-6 min-h-[200px] text-gray-800 dark:text-gray-200 leading-7 overflow-x-hidden">
        <div dangerouslySetInnerHTML={{ __html: processContent(post.content) }} />
      </div>

      {/* Vote Buttons */}
      <div className="flex justify-center space-x-4 my-8">
        <button 
            onClick={() => handleVote('up')}
            disabled={hasVoted || !user}
            className={`group flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 transition-colors ${hasVoted ? 'border-gray-300 text-gray-400 bg-gray-50' : 'border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer'}`}
        >
          <ThumbsUp size={24} className="mb-1 group-active:scale-125 transition-transform" />
          <span className="font-bold text-lg">{post.upvotes}</span>
        </button>
        <button 
            onClick={() => handleVote('down')}
            disabled={hasVoted || !user}
            className={`group flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 transition-colors ${hasVoted ? 'border-gray-300 text-gray-400 bg-gray-50' : 'border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'}`}
        >
          <ThumbsDown size={24} className="mb-1 group-active:scale-125 transition-transform" />
          <span className="font-bold text-lg">{post.downvotes}</span>
        </button>
      </div>
      <div className="text-center text-xs text-gray-400 mb-4">
         {hasVoted ? "이미 평가하셨습니다." : "단축키: 추천(W) / 목록(Q)"}
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center border-t border-b border-gray-200 dark:border-gray-700 py-3 mb-6">
         <div className="flex space-x-2">
           <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-800 dark:hover:text-gray-200 px-2 py-1">
             <Share2 size={16} /> 공유
           </button>
           <button className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm hover:text-red-600 px-2 py-1">
             <AlertTriangle size={16} /> 신고
           </button>
           {canDelete && (
             <button 
                onClick={handleDelete}
                className="flex items-center gap-1 text-red-500 text-sm hover:text-red-700 px-2 py-1"
             >
                <Trash2 size={16} /> 삭제
             </button>
           )}
         </div>
         <Link to={`/board/${boardId}`} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
           목록으로
         </Link>
      </div>

      <CommentSection comments={comments} postId={post.id} />
    </div>
  );
};

export default PostPage;
