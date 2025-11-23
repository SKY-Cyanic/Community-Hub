
import React, { useState } from 'react';
import { Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { storage } from '../services/storage';
import { CornerDownRight, MessageCircle, MoreHorizontal, Ban, Flag } from 'lucide-react';

interface CommentProps {
  comment: Comment;
  allComments: Comment[];
  onReply: (parentId: string, content: string) => void;
  onBlock: (userId: string) => void;
}

const CommentItem: React.FC<CommentProps> = ({ comment, allComments, onReply, onBlock }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const { user } = useAuth();
  
  const children = allComments.filter(c => c.parent_id === comment.id);

  // Blocked user check
  if (user && user.blocked_users.includes(comment.author_id)) {
      return (
          <div className={`py-3 px-4 my-2 bg-gray-100 dark:bg-gray-800 text-gray-400 text-xs rounded flex items-center justify-between ${comment.depth > 0 ? 'ml-4 md:ml-8' : ''}`}>
              <span>차단된 사용자의 댓글입니다.</span>
              <div className="flex gap-2">
                  {children.length > 0 && <span className="text-[10px]">답글 {children.length}개</span>}
              </div>
          </div>
      )
  }

  const handleSubmitReply = () => {
    if(!replyContent.trim()) return;
    onReply(comment.id, replyContent);
    setReplyContent('');
    setIsReplying(false);
  };

  return (
    <div className={`py-3 ${comment.depth > 0 ? 'ml-4 md:ml-8 border-l-2 border-gray-100 dark:border-gray-700 pl-3' : 'border-t border-gray-100 dark:border-gray-700'}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          {comment.depth > 0 && <CornerDownRight size={14} className="text-gray-400" />}
          <span 
            className="font-bold text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
            style={{ 
                color: comment.author.active_items?.name_color,
                fontWeight: comment.author.active_items?.name_style === 'bold' ? 'bold' : 'normal'
            }}
            onClick={() => setShowMenu(!showMenu)}
          >
              {comment.author.active_items?.badge} {comment.author.username}
          </span>
          <span className="text-xs text-gray-400 font-mono">
            {new Date(comment.created_at).toLocaleString()}
          </span>

          {/* User Menu Dropdown */}
          {showMenu && user && user.id !== comment.author_id && (
              <div className="absolute bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600 rounded py-1 z-10 ml-20 mt-6">
                  <button onClick={() => onBlock(comment.author_id)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left">
                      <Ban size={12} /> 차단하기
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 w-full text-left">
                      <Flag size={12} /> 신고하기
                  </button>
              </div>
          )}
        </div>
        <div className="flex space-x-2">
           <button onClick={() => setIsReplying(!isReplying)} className="text-xs text-gray-500 hover:underline">
             답글
           </button>
        </div>
      </div>
      
      <div className="mt-1 text-sm text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
        {comment.content}
      </div>

      {isReplying && (
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
          <textarea 
            className="w-full text-sm border p-2 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white" 
            rows={2} 
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="답글을 작성하세요..." 
          />
          <div className="flex justify-end mt-2">
            <button 
              onClick={handleSubmitReply}
              className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded hover:bg-indigo-700"
            >
              등록
            </button>
          </div>
        </div>
      )}

      {children.length > 0 && (
        <div className="mt-2">
          {children.map(child => (
            <CommentItem key={child.id} comment={{...child, depth: comment.depth + 1}} allComments={allComments} onReply={onReply} onBlock={onBlock} />
          ))}
        </div>
      )}
    </div>
  );
};

interface CommentSectionProps {
  comments: Comment[];
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments: initialComments, postId }) => {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const { user, refreshUser } = useAuth();
  
  React.useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const rootComments = comments.filter(c => c.parent_id === null);

  const handleCreateComment = async (content: string, parentId: string | null = null) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    try {
      const created = await api.createComment(postId, content, user, parentId);
      setComments(prev => [...prev, created]);
      setNewComment('');
    } catch (e) {
      alert('댓글 등록 실패');
    }
  };

  const handleBlock = (targetId: string) => {
      if(!user) return;
      if(confirm('이 사용자를 차단하시겠습니까?')) {
          storage.blockUser(user.id, targetId);
          refreshUser(); // Refresh context to update blocked list
          alert('차단되었습니다.');
      }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mt-4 rounded-sm transition-colors">
      <div className="bg-gray-50 dark:bg-gray-700 p-3 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <MessageCircle size={16} /> 댓글 <span className="text-indigo-600 dark:text-indigo-400">{comments.length}</span>
        </h3>
      </div>
      
      <div className="p-4">
        {rootComments.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">등록된 댓글이 없습니다.</div>
        ) : (
          rootComments.map(comment => (
            <CommentItem 
              key={comment.id} 
              comment={{...comment, depth: 0}} 
              allComments={comments} 
              onReply={(parentId, content) => handleCreateComment(content, parentId)}
              onBlock={handleBlock}
            />
          ))
        )}
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <div className="mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">댓글 작성</div>
        <textarea 
          className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded text-sm focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          rows={3}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={user ? "댓글을 입력해주세요." : "로그인 후 이용 가능합니다."}
          disabled={!user}
        />
        <div className="flex justify-between items-center mt-2">
           <div className="text-xs text-gray-400">Markdown 지원 안함</div>
           <button 
             onClick={() => handleCreateComment(newComment)}
             disabled={!user}
             className={`bg-indigo-600 text-white px-6 py-2 rounded text-sm font-bold hover:bg-indigo-700 ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             등록
           </button>
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
