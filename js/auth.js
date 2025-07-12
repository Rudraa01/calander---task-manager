// Authentication module
import { auth } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Test Firebase connection immediately
console.log('🔧 Auth module loaded');
console.log('🔥 Firebase auth object:', auth);
console.log('🔥 Firebase auth functions available:', {
    signInWithEmailAndPassword: typeof signInWithEmailAndPassword,
    createUserWithEmailAndPassword: typeof createUserWithEmailAndPassword
});

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Debug: Check if Firebase is initialized
console.log('Firebase auth initialized:', !!auth);

// UI Elements - these will be null initially, we'll get them in DOMContentLoaded
let loginForm = null;
let registerForm = null;
let loadingSpinner = null;

// Show loading spinner
function showLoading() {
    if (loadingSpinner) {
        loadingSpinner.classList.remove('hidden');
    }
}

// Hide loading spinner
function hideLoading() {
    if (loadingSpinner) {
        loadingSpinner.classList.add('hidden');
    }
}

// Show error message
function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Login with Email and Password
async function loginWithEmail(email, password) {
    try {
        console.log('Starting login with:', email); // Debug log
        showLoading();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful:', userCredential.user.uid); // Debug log
        showSuccess('Login successful!');
        
        // Add a small delay before redirect
        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 1000);
    } catch (error) {
        console.error('Login error:', error); // Debug log
        let errorMessage = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed login attempts. Please try again later.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection.';
                break;
        }
        
        showError(errorMessage);
    } finally {
        hideLoading();
    }
}

// Register with Email and Password
async function registerWithEmail(email, password) {
    try {
        console.log('Starting registration with:', email); // Debug log
        showLoading();
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Registration successful:', userCredential.user.uid); // Debug log
        showSuccess('Account created successfully!');
        
        // Add a small delay before redirect
        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 1000);
    } catch (error) {
        console.error('Registration error:', error); // Debug log
        let errorMessage = 'Registration failed. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'An account with this email already exists.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password should be at least 6 characters.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your connection.';
                break;
        }
        
        showError(errorMessage);
    } finally {
        hideLoading();
    }
}

// Sign in with Google
async function signInWithGoogle() {
    try {
        showLoading();
        const result = await signInWithPopup(auth, googleProvider);
        showSuccess('Google sign-in successful!');
        // Redirect to dashboard
        window.location.href = '/dashboard.html';
    } catch (error) {
        console.error('Google sign-in error:', error);
        let errorMessage = 'Google sign-in failed. Please try again.';
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                errorMessage = 'Sign-in popup was closed. Please try again.';
                break;
            case 'auth/popup-blocked':
                errorMessage = 'Popup blocked. Please allow popups and try again.';
                break;
        }
        
        showError(errorMessage);
    } finally {
        hideLoading();
    }
}

// Logout user
async function logout() {
    try {
        await signOut(auth);
        showSuccess('Logged out successfully!');
        // Redirect to login page
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Logout error:', error);
        showError('Logout failed. Please try again.');
    }
}

// Check authentication state
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        console.log('Auth state changed. User:', user ? user.email : 'not signed in');
        if (user) {
            // User is signed in
            const currentPath = window.location.pathname;
            console.log('Current path:', currentPath);
            
            if (currentPath === '/' || 
                currentPath === '/index.html' || 
                currentPath.endsWith('/index.html') || 
                currentPath === '') {
                console.log('Redirecting to dashboard...');
                window.location.href = '/dashboard.html';
            }
        } else {
            // User is signed out
            const currentPath = window.location.pathname;
            console.log('Current path:', currentPath);
            
            if (currentPath.includes('dashboard.html')) {
                console.log('Redirecting to login...');
                window.location.href = '/index.html';
            }
        }
    });
}

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing auth components'); // Debug log
    
    // Initialize UI elements
    loginForm = document.getElementById('loginForm');
    registerForm = document.getElementById('registerForm');
    loadingSpinner = document.getElementById('loadingSpinner');
    
    console.log('UI elements found:', { 
        loginForm: !!loginForm, 
        registerForm: !!registerForm, 
        loadingSpinner: !!loadingSpinner 
    }); // Debug log
    
    checkAuthState();
    
    // Login form handler
    const loginFormElement = loginForm?.querySelector('form');
    if (loginFormElement) {
        console.log('Login form found and event listener attached'); // Debug log
        loginFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Login form submitted'); // Debug log
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            console.log('Login form values:', { email, password: password ? '***' : 'empty' }); // Debug log
            
            if (!email || !password) {
                showError('Please fill in all fields.');
                return;
            }
            
            await loginWithEmail(email, password);
        });
    } else {
        console.log('Login form not found'); // Debug log
    }
    
    // Register form handler
    const registerFormElement = registerForm?.querySelector('form');
    if (registerFormElement) {
        console.log('Register form found and event listener attached'); // Debug log
        registerFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Register form submitted'); // Debug log
            
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            console.log('Form values:', { email, password: password ? '***' : 'empty', confirmPassword: confirmPassword ? '***' : 'empty' }); // Debug log
            
            if (!email || !password || !confirmPassword) {
                showError('Please fill in all fields.');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('Passwords do not match.');
                return;
            }
            
            if (password.length < 6) {
                showError('Password should be at least 6 characters.');
                return;
            }
            
            await registerWithEmail(email, password);
        });
    } else {
        console.log('Register form not found'); // Debug log
    }
    
    // Google sign-in button handler
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', signInWithGoogle);
    }
    
    // Logout button handler (for dashboard)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// Export functions for use in other modules
export { loginWithEmail, registerWithEmail, signInWithGoogle, logout, checkAuthState };
