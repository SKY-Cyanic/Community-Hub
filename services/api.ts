
import { Post, Board, Comment, User, WikiPage } from '../types';
import { storage } from './storage';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  getBoards: async (): Promise<Board[]> => {
    return storage.getBoards();
  },

  getPosts: async (boardSlug?: string, page: number = 1): Promise<Post[]> => {
    let posts = storage.getPosts();
    
    if (boardSlug && boardSlug !== 'all' && boardSlug !== 'best') {
      posts = posts.filter(p => p.board_id === boardSlug);
    }
    
    // Sort by date desc
    posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return posts;
  },

  getPost: async (postId: string): Promise<Post | null> => {
    const posts = storage.getPosts();
    const post = posts.find(p => p.id === postId);
    
    if (post) {
       // Increment view count (simple implementation)
       // NOTE: In a real app, we check IP/session to prevent spamming view count.
       // Here we rely on the component to not call this excessively.
       // For this demo, we won't auto-increment here to prevent infinite loop with react effects,
       // unless we separate 'read' from 'fetch'. 
       // We'll increment only if we are "viewing" it.
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
      liked_users: [],
      created_at: new Date().toISOString(),
      author: {
        id: user.id,
        username: user.username,
        created_at: new Date().toISOString(),
        level: user.level,
        active_items: user.active_items,
        is_admin: user.is_admin
      },
      comment_count: 0,
      is_hot: false,
      has_image: (postData.images && postData.images.length > 0) || false,
      images: postData.images || [],
      poll: postData.poll
    };
    
    storage.savePost(newPost);
    return newPost;
  },
  
  deletePost: async (postId: string): Promise<void> => {
      await delay(200);
      storage.deletePost(postId);
  },

  getComments: async (postId: string): Promise<Comment[]> => {
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
        level: user.level,
        active_items: user.active_items,
        is_admin: user.is_admin
      },
      depth: 0 // Calculated on render
    };
    storage.saveComment(newComment);
    return newComment;
  },
  
  votePost: async (postId: string, type: 'up' | 'down', userId: string): Promise<boolean> => {
      const posts = storage.getPosts();
      const postIndex = posts.findIndex(p => p.id === postId);
      
      if (postIndex !== -1) {
          const post = posts[postIndex];
          
          if (!post.liked_users) post.liked_users = [];

          if (post.liked_users.includes(userId)) {
              return false;
          }

          if(type === 'up') {
              posts[postIndex].upvotes++;
          } else {
              posts[postIndex].downvotes++;
          }
          
          posts[postIndex].liked_users.push(userId);
          
          storage.updatePost(posts[postIndex]);
          return true;
      }
      return false;
  },

  // User Management
  register: async (user: User): Promise<User> => {
      await delay(500);
      storage.saveUser(user);
      return user;
  },
  
  deleteUser: async (userId: string): Promise<void> => {
      storage.deleteUser(userId);
  },

  // Wiki
  getWikiPage: async (slug: string): Promise<WikiPage | undefined> => {
      return storage.getWikiPage(slug);
  },
  
  saveWikiPage: async (page: WikiPage): Promise<void> => {
      await delay(300);
      storage.saveWikiPage(page);
  }
};
