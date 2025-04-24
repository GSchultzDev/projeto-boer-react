import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyA6TVhfKBOze7BcEd1HASU7or3qoeClPUM",
    authDomain: "apphamburguer.firebaseapp.com",
    projectId: "apphamburguer",
    storageBucket: "apphamburguer.firebasestorage.app",
    messagingSenderId: "592399568857",
    appId: "1:592399568857:web:2f90b0aca3f282002393c8",
    databaseURL: "https://apphamburguer-default-rtdb.firebaseio.com/" // Add this line
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth };