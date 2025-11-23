import { Post, Board, Comment, User } from '../types';
import { storage } from './storage';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  getBoards: async (): Promise<Board[]> => {
    // await delay(100);
    return storage.getBoards();
  },

  getPosts: async (boardSlug?: string, page: number = 1): Promise<Post[]> => {
    // await delay(200);
    let posts = storage.getPosts();
    
    if (boardSlug && boardSlug !== 'all' && boardSlug !== 'best') {
      posts = posts.filter(p => p.board_id === boardSlug);
    }
    
    // Sort by date desc
    posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return posts;
  },

  getPost: async (postId: string): Promise<Post | null> => {
    // await delay(100);
    const posts = storage.getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (post) {
       // Increment view count (simple implementation)
       const updated = { ...post, view_count: post.view_count + 1 };
       storage.updatePost(updated);
       return updated;
    }
    return null;
  },

  createPost: async (postData: Partial<Post>, user: User): Promise<Post> => {
    await delay(500);
    const newPost: Post = {
      id: `post-${Date.now()}`,
      board_id: postData.board_id || 'free',
      author_id: user.id,
      title: postData.title || '무제',
      content: postData.content || '',
      view_count: 0,
      upvotes: 0,
      downvotes: 0,
      created_at: new Date().toISOString(),
      author: {
        id: user.id,
        username: user.username,
        created_at: new Date().toISOString(),
        level: user.level
      },
      comment_count: 0,
      is_hot: false,
      has_image: (postData.images && postData.images.length > 0) || false,
      images: postData.images || []
    };
    
    storage.savePost(newPost);
    return newPost;
  },

  getComments: async (postId: string): Promise<Comment[]> => {
    // await delay(100);
    const comments = storage.getComments();
    return comments.filter(c => c.post_id === postId);
  },

  createComment: async (postId: string, content: string, user: User, parentId: string | null = null): Promise<Comment> => {
    await delay(200);
    const newComment: Comment = {
      id: `cmt-${Date.now()}`,
      post_id: postId,
      author_id: user.id,
      parent_id: parentId,
      content: content,
      created_at: new Date().toISOString(),
      author: {
        id: user.id,
        username: user.username,
        created_at: new Date().toISOString(),
        level: user.level
      },
      depth: 0 // Calculated on render
    };
    storage.saveComment(newComment);
    return newComment;
  },
  
  votePost: async (postId: string, type: 'up' | 'down'): Promise<void> => {
      const posts = storage.getPosts();
      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex !== -1) {
          if(type === 'up') posts[postIndex].upvotes++;
          else posts[postIndex].downvotes++;
          localStorage.setItem('k_community_posts', JSON.stringify(posts));
      }
  }
};
