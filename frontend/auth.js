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
  
  // Enable persistence - keeps user logged in across browser sessions
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
  
  console.log("Firebase Auth ready");
} catch (err) {
  console.error("Firebase initialization error:", err);
  alert("Firebase setup failed. Please refresh the page.");
}

// Function to update button visibility based on auth state
function updateAuthButtons(user) {
  const googleLoginBtn = document.getElementById("googleLogin");
  const dashboardLink = document.getElementById("dashboardLink");
  
  console.log("Updating buttons. User:", user ? user.uid : "none");
  
  if (user) {
    // User IS logged in
    localStorage.setItem("habitsync_user", user.uid);
    console.log("User authenticated:", user.uid);
    
    // Hide login button, show dashboard link
    if (googleLoginBtn) {
      googleLoginBtn.style.display = "none";
      googleLoginBtn.disabled = true;
    }
    if (dashboardLink) {
      dashboardLink.style.display = "inline-block";
      dashboardLink.style.visibility = "visible";
    }
  } else {
    // User is NOT logged in
    localStorage.removeItem("habitsync_user");
    console.log("User not authenticated");
    
    // Show login button, hide dashboard link
    if (googleLoginBtn) {
      googleLoginBtn.style.display = "inline-block";
      googleLoginBtn.style.visibility = "visible";
      googleLoginBtn.disabled = false;
    }
    if (dashboardLink) {
      dashboardLink.style.display = "none";
      dashboardLink.style.visibility = "hidden";
    }
  }
}

// Set up auth state listener
// This runs every time auth state changes (login, logout, browser restart)
firebase.auth().onAuthStateChanged((user) => {
  console.log("onAuthStateChanged triggered. User:", user ? user.uid : "none");
  updateAuthButtons(user);
});

// Login button
const loginBtn = document.getElementById("googleLogin");

if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    console.log("Login button clicked");
    console.log("Auth instance:", auth);
    console.log("Provider:", provider);
    
    auth.signInWithPopup(provider)
      .then(async (result) => {
        console.log("Login successful:", result.user);
        const user = result.user;
        localStorage.setItem("habitsync_user", user.uid);
        
        // Send login to backend
        try {
          if (typeof APIClient !== 'undefined') {
            await APIClient.loginUser(user.uid, user.email);
            console.log("Backend login recorded");
          }
        } catch (err) {
          console.warn("Backend login failed (frontend will still work):", err);
        }
        
        // Update buttons immediately
        updateAuthButtons(user);
        // Then redirect
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 100);
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