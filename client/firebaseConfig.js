// firebaseConfig.js
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAiGCCnXgHj3wHQUxAmrRe65FIIRkaS1ZQ",
    authDomain: "mycos-21184.firebaseapp.com",
    projectId: "mycos-21184",
    storageBucket: "mycos-21184.appspot.com",
    messagingSenderId: "435284843275",
    appId: "1:435284843275:web:f5a1f1990e489f5630e00e",
    measurementId: "G-G3PJSZ6SHM"
  };  

firebase.initializeApp(firebaseConfig);

export default firebase;
