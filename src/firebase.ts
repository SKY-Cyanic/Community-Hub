
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Firebase 콘솔(https://console.firebase.google.com)에서 프로젝트 생성 후 아래 설정을 본인 것으로 교체하세요.
const firebaseConfig = {
  apiKey: "AIzaSyD-REPLACE_WITH_YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
