
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, limit, setLogLevel } from 'firebase/firestore';
import { storage, storageHooks } from './storage';
import { Post, Comment, User, WikiPage } from '../types';

// Configuration provided by user
const firebaseConfig = {
    apiKey: "AIzaSyCTwla1unjp7k73HGmPChWtQVlyya3RxV0",
    authDomain: "commu-hub-a55ae.firebaseapp.com",
    projectId: "commu-hub-a55ae",
    storageBucket: "commu-hub-a55ae.firebasestorage.app",
    messagingSenderId: "448045121716",
    appId: "1:448045121716:web:b943e0cf9b86e400aed7e1",
    measurementId: "G-BS76QRNT6J"
};

let db: any = null;
let initialized = false;
let isConnected = false;
const statusListeners: ((connected: boolean) => void)[] = [];

export const onCloudStatusChange = (callback: (connected: boolean) => void) => {
    statusListeners.push(callback);
    callback(isConnected); // Immediate callback with current status
    return () => {
        const idx = statusListeners.indexOf(callback);
        if (idx !== -1) statusListeners.splice(idx, 1);
    };
};

const updateStatus = (status: boolean) => {
    if (isConnected !== status) {
        isConnected = status;
        statusListeners.forEach(cb => cb(status));
    }
};

export const initializeCloud = () => {
  if (initialized) return isConnected;
  
  try {
    // Silence verbose SDK errors to prevent console spam when API is disabled
    setLogLevel('silent');
    
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    initialized = true;
    
    // Optimistically set to true, will be corrected by startSync listeners if they fail
    updateStatus(true);
    console.log("Firebase Cloud Sync Initialized");
    
    // Start Listeners
    startSync();
    
    // Register Hooks to sync local changes to cloud
    storageHooks.onPostSave = (post) => uploadData('posts', post);
    storageHooks.onPostDelete = (id) => deleteData('posts', id);
    storageHooks.onCommentSave = (comment) => uploadData('comments', comment);
    storageHooks.onUserSave = (user) => uploadData('users', user);
    storageHooks.onWikiSave = (page) => uploadData('wiki', page);
    
    return true;
  } catch (e) {
    console.warn("Firebase init failed (Local Mode):", e);
    updateStatus(false);
    return false;
  }
};

export const isCloudActive = () => isConnected;

const startSync = () => {
    if (!db) return;

    const handleSyncError = (context: string, error: any) => {
        // Fallback to local mode silently if permission is denied (API disabled)
        if (error?.code !== 'permission-denied') {
            console.warn(`⚠️ Cloud Sync Error (${context}):`, error.message);
        }
        updateStatus(false);
    };

    // Sync Posts (Last 100)
    const postsQuery = query(collection(db, 'posts'), orderBy('created_at', 'desc'), limit(100));
    onSnapshot(postsQuery, (snapshot) => {
        const posts: Post[] = [];
        snapshot.forEach(doc => posts.push(doc.data() as Post));
        if(posts.length > 0) storage._overwritePosts(posts);
        updateStatus(true); // Confirm connection is working
    }, (error) => handleSyncError('Posts', error));

    // Sync Comments
    const commentsQuery = query(collection(db, 'comments'), orderBy('created_at', 'asc'), limit(500));
    onSnapshot(commentsQuery, (snapshot) => {
        const comments: Comment[] = [];
        snapshot.forEach(doc => comments.push(doc.data() as Comment));
        if(comments.length > 0) storage._overwriteComments(comments);
    }, (error) => handleSyncError('Comments', error));

    // Sync Users
    const usersQuery = query(collection(db, 'users'), limit(200));
    onSnapshot(usersQuery, (snapshot) => {
        const users: User[] = [];
        snapshot.forEach(doc => users.push(doc.data() as User));
        if(users.length > 0) storage._overwriteUsers(users);
    }, (error) => handleSyncError('Users', error));

    // Sync Wiki
    const wikiQuery = query(collection(db, 'wiki'));
    onSnapshot(wikiQuery, (snapshot) => {
        const pages: WikiPage[] = [];
        snapshot.forEach(doc => pages.push(doc.data() as WikiPage));
        if(pages.length > 0) storage._overwriteWiki(pages);
    }, (error) => handleSyncError('Wiki', error));
};

const uploadData = async (collectionName: string, data: any) => {
    if (!db || !isConnected || (!data.id && !data.slug)) return;
    const id = data.id || data.slug;
    try {
        await setDoc(doc(db, collectionName, id), data);
    } catch (e) {
        // Silent fail in local mode
        updateStatus(false);
    }
};

const deleteData = async (collectionName: string, id: string) => {
    if (!db || !isConnected) return;
    try {
        await deleteDoc(doc(db, collectionName, id));
    } catch (e) {
        // Silent fail in local mode
        updateStatus(false);
    }
};
