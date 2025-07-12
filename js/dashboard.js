// Dashboard main module
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { listenForTasks as listenForTasksInCalendar } from './calendar.js';
import { listenForTasks as listenForTasksInTasks } from './tasks.js';
import { logout } from './auth.js';

let currentUser = null;

// Initialize dashboard
function initDashboard() {
    // Check authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            setupDashboard(user);
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'index.html';
        }
    });
    
    // Initialize UI components
    initSidebar();
    initDarkMode();
    initTopBar();
}

// Setup dashboard with user data
function setupDashboard(user) {
    // Display user email
    const userEmail = document.getElementById('userEmail');
    if (userEmail) {
        userEmail.textContent = user.email;
    }
    
    // Start listening for tasks
    listenForTasksInCalendar(user);
    listenForTasksInTasks(user);
    
    // Show welcome message
    showWelcomeMessage(user);
}

// Initialize sidebar functionality
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            
            // Create overlay for mobile
            if (sidebar.classList.contains('open')) {
                const overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                overlay.addEventListener('click', () => {
                    sidebar.classList.remove('open');
                    overlay.remove();
                });
                document.body.appendChild(overlay);
            }
        });
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            sidebar?.classList.remove('open');
            const overlay = document.querySelector('.sidebar-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
    });
}

// Initialize dark mode
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    const html = document.documentElement;
    
    if (!darkModeToggle) return;
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.classList.toggle('dark', savedTheme === 'dark');
    
    // Update toggle button appearance
    updateDarkModeToggle(savedTheme === 'dark');
    
    darkModeToggle.addEventListener('click', () => {
        const isDark = html.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateDarkModeToggle(isDark);
    });
}

// Update dark mode toggle button
function updateDarkModeToggle(isDark) {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;
    
    const sunIcon = darkModeToggle.querySelector('.dark\\:hidden');
    const moonIcon = darkModeToggle.querySelector('.hidden.dark\\:block');
    
    if (isDark) {
        sunIcon?.classList.add('hidden');
        moonIcon?.classList.remove('hidden');
    } else {
        sunIcon?.classList.remove('hidden');
        moonIcon?.classList.add('hidden');
    }
}

// Initialize top bar
function initTopBar() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to logout?')) {
                await logout();
            }
        });
    }
}

// Show welcome message
function showWelcomeMessage(user) {
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'fixed top-20 right-4 bg-primary-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
    welcomeDiv.innerHTML = `
        <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a2 2 0 012-2z" />
            </svg>
            <span>Welcome back, ${user.displayName || user.email}!</span>
        </div>
    `;
    document.body.appendChild(welcomeDiv);
    
    setTimeout(() => {
        welcomeDiv.remove();
    }, 4000);
}

// Show dashboard statistics
function showDashboardStats(tasks) {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const highPriorityTasks = tasks.filter(task => task.priority === 'high' && !task.completed).length;
    
    // Update stats in the UI (if stats elements exist)
    const statsElements = {
        totalTasks: document.getElementById('totalTasks'),
        completedTasks: document.getElementById('completedTasks'),
        pendingTasks: document.getElementById('pendingTasks'),
        highPriorityTasks: document.getElementById('highPriorityTasks')
    };
    
    if (statsElements.totalTasks) statsElements.totalTasks.textContent = totalTasks;
    if (statsElements.completedTasks) statsElements.completedTasks.textContent = completedTasks;
    if (statsElements.pendingTasks) statsElements.pendingTasks.textContent = pendingTasks;
    if (statsElements.highPriorityTasks) statsElements.highPriorityTasks.textContent = highPriorityTasks;
}

// Handle keyboard shortcuts
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt + N: Add new task
        if (e.altKey && e.key === 'n') {
            e.preventDefault();
            const addTaskBtn = document.getElementById('addTaskBtn');
            if (addTaskBtn) {
                addTaskBtn.click();
            }
        }
        
        // Alt + D: Toggle dark mode
        if (e.altKey && e.key === 'd') {
            e.preventDefault();
            const darkModeToggle = document.getElementById('darkModeToggle');
            if (darkModeToggle) {
                darkModeToggle.click();
            }
        }
        
        // Escape: Close modals
        if (e.key === 'Escape') {
            const taskModal = document.getElementById('taskModal');
            if (taskModal && !taskModal.classList.contains('hidden')) {
                const closeModal = document.getElementById('closeModal');
                if (closeModal) {
                    closeModal.click();
                }
            }
        }
    });
}

// Initialize service worker for PWA (if available)
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('SW registered: ', registration);
                })
                .catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
}

// Show offline status
function handleOfflineStatus() {
    window.addEventListener('online', () => {
        showStatusMessage('Back online!', 'success');
    });
    
    window.addEventListener('offline', () => {
        showStatusMessage('You are offline. Changes will sync when connection is restored.', 'warning');
    });
}

// Show status message
function showStatusMessage(message, type = 'info') {
    const statusDiv = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 
                   type === 'warning' ? 'bg-yellow-500' : 
                   type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    
    statusDiv.className = `fixed top-4 left-1/2 transform -translate-x-1/2 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in`;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
        statusDiv.remove();
    }, 3000);
}

// Export current user for other modules
export function getCurrentUser() {
    return currentUser;
}

// Initialize dashboard on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    initKeyboardShortcuts();
    initServiceWorker();
    handleOfflineStatus();
});

// Export functions for use in other modules
export { 
    initDashboard, 
    setupDashboard, 
    showDashboardStats, 
    showStatusMessage,
    getCurrentUser
};
