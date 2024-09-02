import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Pega aquí tu configuración de Firebase
  apiKey: "AIzaSyCI1fQ1g8h-qKUnFOS9GPMZl9p-BHnVti8",
  authDomain: "microcodeapp-3a649.firebaseapp.com",
  projectId: "microcodeapp-3a649",
  storageBucket: "microcodeapp-3a649.appspot.com",
  messagingSenderId: "111329839472",
  appId: "1:111329839472:web:7697074ea5661c84fbe7b5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);