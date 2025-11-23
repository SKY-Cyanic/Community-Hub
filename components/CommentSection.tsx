import React, { useState } from 'react';
import { Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CornerDownRight, MessageCircle } from 'lucide-react';

interface CommentProps {
  comment: Comment;
  allComments: Comment[];
  onReply: (parentId: string, content: string) => void;
}

const CommentItem: React.FC<CommentProps> = ({ comment, allComments, onReply }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  
  const children = allComments.filter(c => c.parent_id === comment.id);

  const handleSubmitReply = () => {
    if(!replyContent.trim()) return;
    onReply(comment.id, replyContent);
    setReplyContent('');
    setIsReplying(false);
  };

  return (
    <div className={`py-3 ${comment.depth > 0 ? 'ml-4 md:ml-8 border-l-2 border-gray-100 pl-3' : 'border-t border-gray-100'}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2">
          {comment.depth > 0 && <CornerDownRight size={14} className="text-gray-400" />}
          <span className="font-bold text-sm text-gray-700">{comment.author.username}</span>
          <span className="text-xs text-gray-400 font-mono">
            {new Date(comment.created_at).toLocaleString()}
          </span>
        </div>
        <div className="flex space-x-2">
           <button onClick={() => setIsReplying(!isReplying)} className="text-xs text-gray-500 hover:underline">
             답글
           </button>
        </div>
      </div>
      
      <div className="mt-1 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
        {comment.content}
      </div>

      {isReplying && (
        <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
          <textarea 
            className="w-full text-sm border p-2 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" 
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
            <CommentItem key={child.id} comment={{...child, depth: comment.depth + 1}} allComments={allComments} onReply={onReply} />
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
  const { user } = useAuth();
  
  // Update local state when props change
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

  return (
    <div className="bg-white border border-gray-200 mt-4 rounded-sm">
      <div className="bg-gray-50 p-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <MessageCircle size={16} /> 댓글 <span className="text-indigo-600">{comments.length}</span>
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
            />
          ))
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="mb-2 text-sm font-bold text-gray-700">댓글 작성</div>
        <textarea 
          className="w-full border border-gray-300 p-3 rounded text-sm focus:outline-none focus:border-indigo-500"
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
