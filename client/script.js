import bot from './assets/bot.svg';
import user from './assets/user.svg';
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { firebaseConfig } from './firebaseConfig';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const form = document.querySelector('form');
const chatContainer = document.querySelector('#chat_container');

let conversationHistory = [];

let loadInterval;

firebase.auth().onAuthStateChanged(async (user) => {
  if (user) {
    // User is signed in, load conversation history
    console.log('User signed in:', user.email);
    conversationHistory = await loadConversationHistory(user);
  } else {
    // User is signed out
    console.log('User signed out');
  }
});


const registerForm = document.getElementById('register-form');
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  try {
    await firebase.auth().createUserWithEmailAndPassword(email, password);
    console.log('User registered');
  } catch (error) {
    console.error('Error registering user:', error.message);
  }
});

const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    console.log('User logged in');
  } catch (error) {
    console.error('Error logging in:', error.message);
  }
});



function loader(element) {
  element.textContent = '';

  loadInterval = setInterval(() => {
    element.textContent += '.';

    if (element.textContent === '....') {
      element.textContent = '';
    }
  }, 300)
}

function typeText(element, text) {
  let index = 0;

  let interval = setInterval(() => {
    if(index < text.length){
      element.innerHTML += text.charAt(index);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 20)
}

function generateUniqueId() {
  const timestamp = Date.now();
  const randomNumber = Math.random();
  const hexadecimalString = randomNumber.toString(16);

  return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe (isAi, value, uniqueId) {
  return (
    `
    <div class="wrapper ${isAi && 'ai'}">
      <div class="chat">
        <div class="profile">
          <img
            src="${isAi ? bot : user}"
            alt="${isAi ? 'bot' : 'user'}"
          />
        </div>
        <div class="message" id=${uniqueId}>${value}</div>
      </div>
    </div>
    `
  )
}

const handleSubmit = async (e) => {
  e.preventDefault();

  const data = new FormData(form);

  // User's chat stripe
  chatContainer.innerHTML += chatStripe(false, data.get('prompt'));

  form.reset();

  // Bot's chat stripe
  const uniqueId = generateUniqueId();
  chatContainer.innerHTML += chatStripe(true, " ", uniqueId);

  chatContainer.scrollTop = chatContainer.scrollHeight;

  const messageDiv = document.getElementById(uniqueId);

  loader(messageDiv);

  // Fetch data from server -> bot's response
  const response = await fetch('https://mycos.onrender.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: `${conversationHistory.join('\n')}\nUser: ${data.get('prompt')}`,
    }),
  });

  clearInterval(loadInterval);
  messageDiv.innerHTML = '';

  if (response.ok) {
    const responseData = await response.json();
    const parsedData = responseData.bot.trim();

    typeText(messageDiv, parsedData);

    // Update the conversation history
    conversationHistory.push({
      role: 'user',
      message: data.get('prompt'),
    });
    conversationHistory.push({
      role: 'bot',
      message: parsedData,
    });

    // Store the conversation history for the logged-in user
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
      await storeConversationHistory(currentUser, conversationHistory);
    }
  } else {
    const err = await response.text();

    messageDiv.innerHTML = "Something went wrong";

    alert(err);
  }
};

// load conversation history of user
async function loadConversationHistory(user) {
  const db = firebase.firestore();
  const userRef = db.collection('users').doc(user.uid);

  try {
    const doc = await userRef.get();
    if (doc.exists) {
      return doc.data().conversation;
    } else {
      console.log('No conversation history found');
      return [];
    }
  } catch (error) {
    console.error('Error loading conversation history:', error.message);
    return [];
  }
}

// store conversation history of user
async function storeConversationHistory(user, conversation) {
  const db = firebase.firestore();
  const userRef = db.collection('users').doc(user.uid);

  try {
    await userRef.set({ conversation });
    console.log('Conversation history stored');
  } catch (error) {
    console.error('Error storing conversation history:', error.message);
  }
}



form.addEventListener('submit', handleSubmit);
form.addEventListener('keyup', (e) => {
  if (e.keyCode === 13) {
    handleSubmit(e);
  }
})