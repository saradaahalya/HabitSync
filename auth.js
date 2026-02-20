// 🔐 Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVizMs2008bavqmB5cQVeYiGOZFuFewDU",
  authDomain: "habitsync-455d3.firebaseapp.com",
  projectId: "habitsync-455d3",
  storageBucket: "habitsync-455d3.firebasestorage.app",
  messagingSenderId: "861608812567",
  appId: "1:861608812567:web:628f74d182db113b4abc52"
};

// Initialize Firebase - Check if already initialized
let auth;
let provider;

try {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized");
  } else {
    console.log("Firebase already initialized");
  }
  
  auth = firebase.auth();
  provider = new firebase.auth.GoogleAuthProvider();
  
  // Enable popup behavior
  provider.addScope('profile');
  provider.addScope('email');
  
  console.log("Firebase Auth ready");
} catch (err) {
  console.error("Firebase initialization error:", err);
  alert("Firebase setup failed. Please refresh the page.");
}

// Login button
const loginBtn = document.getElementById("googleLogin");

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    console.log("Login button clicked");
    console.log("Auth instance:", auth);
    console.log("Provider:", provider);
    
    auth.signInWithPopup(provider)
      .then((result) => {
        console.log("Login successful:", result.user);
        const user = result.user;
        localStorage.setItem("habitsync_user", user.uid);
        window.location.href = "dashboard.html";
      })
      .catch((err) => {
        console.error("Login error code:", err.code);
        console.error("Login error message:", err.message);
        console.error("Full error:", err);
        
        // Provide helpful error messages
        let errorMsg = "Login failed. Try again.";
        
        if (err.code === "auth/popup-blocked") {
          errorMsg = "Popup was blocked. Please allow popups and try again.";
        } else if (err.code === "auth/popup-closed-by-user") {
          errorMsg = "Login cancelled.";
        } else if (err.code === "auth/operation-not-supported-in-this-environment") {
          errorMsg = "Google Sign-In not supported. Check Firebase config.";
        } else if (err.code === "auth/unauthorized-domain") {
          errorMsg = "This domain is not authorized in Firebase console.";
        } else if (err.code === "auth/invalid-api-key") {
          errorMsg = "Invalid Firebase API key.";
        }
        
        alert(errorMsg);
      });
  });
}

// Check if user is logged in when page loads
// Sync Firebase auth state with localStorage
// But DON'T auto-redirect from index.html (let user see login page)
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    // Sync Firebase auth state with localStorage
    localStorage.setItem("habitsync_user", user.uid);
    console.log("User authenticated:", user.uid);
  } else {
    console.log("User not authenticated");
  }
});