
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
const firebaseConfig = {
  apiKey: "AIzaSyA6OPyN4xzrHwhv0MN3CDf_E-G0GzI_Eu8",
  authDomain: "interviewiq-24e7d.firebaseapp.com",
  projectId: "interviewiq-24e7d",
  storageBucket: "interviewiq-24e7d.firebasestorage.app",
  messagingSenderId: "804041794955",
  appId: "1:804041794955:web:6454c562d570ac9b78fb8e"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider()

export { auth, provider }