// ===== MAIN APP COORDINATOR =====
// Central app initialization and coordination

import { state } from './shared/state.js';
import { categories, projectStatuses, workers } from './shared/constants.js';
import { calculateTotals } from './shared/utils.js';
import { initClientsComponent } from './components/clients.js';
import { initProjectsComponent } from './components/projects.js';
import { initSuppliersComponent } from './components/suppliers.js';
import { initOrdersComponent } from './components/orders.js';
import { initSidurComponent } from './components/sidur.js';
import { initSettingsComponent } from './components/settings.js';

// Global app instance
let appInstance = null;

/**
 * Initialize the application
 */
export async function initApp(firebaseConfig) {
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const storage = firebase.storage();
    const auth = firebase.auth();

    // Development mode
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment) {
        console.log('🔧 Running in DEVELOPMENT mode (connected to production Firestore)');
    } else {
        console.log('🚀 Running in PRODUCTION mode');
    }

    console.log('Firebase initialized');
    console.log('Development mode:', isDevelopment);

    // Create context object to pass to components
    const context = {
        state,
        db,
        firebase,
        storage,
        auth,
        isDevelopment,
        categories,
        projectStatuses,
        workers,
        calculateTotals: (project) => calculateTotals(project, state),
        render: () => render(),
        updateHistory: () => updateHistory()
    };

    // Initialize components
    const clientsComponent = initClientsComponent(context);
    const projectsComponent = initProjectsComponent(context);
    const suppliersComponent = initSuppliersComponent(context);
    const ordersComponent = initOrdersComponent(context);
    const sidurComponent = initSidurComponent(context);
    const settingsComponent = initSettingsComponent(context);

    // Add cross-component dependencies to context
    context.loadProjectsForClient = projectsComponent.loadProjectsForClient;
    context.loadAllProjects = projectsComponent.loadAllProjects;

    // Create app instance with all components
    appInstance = {
        state,
        db,
        firebase,
        storage,
        auth,
        isDevelopment,
        context,
        components: {
            clients: clientsComponent,
            projects: projectsComponent,
            suppliers: suppliersComponent,
            orders: ordersComponent,
            sidur: sidurComponent,
            settings: settingsComponent
        }
    };

    // Expose handlers globally for HTML onclick handlers
    window.appHandlers = {
        clients: clientsComponent,
        projects: projectsComponent,
        suppliers: suppliersComponent,
        orders: ordersComponent,
        sidur: sidurComponent,
        settings: settingsComponent
    };

    // Expose commonly used functions globally
    window.state = state;
    window.render = render;
    window.calculateTotals = context.calculateTotals;

    // Initialize authentication
    initAuth();

    return appInstance;
}

/**
 * Authentication initialization
 */
function initAuth() {
    const { auth, state } = appInstance;
    
    // Authentication restrictions
    const ALLOWED_DOMAIN = 'elka-hashmal.co.il';
    const EMAIL_WHITELIST = [
        'admin@elka-hashmal.co.il',
        // Add more whitelisted emails here
    ];
    
    // Session management
    const SESSION_DURATION_DAYS = 7; // 1 week
    const INACTIVITY_TIMEOUT_HOURS = 24; // 24 hours
    let inactivityTimeout;
    let lastActivityTime;
    
    // Check if user email is allowed
    function isEmailAllowed(email) {
        const emailDomain = email.split('@')[1];
        return EMAIL_WHITELIST.includes(email) || emailDomain === ALLOWED_DOMAIN;
    }
    
    // Handle user session
    function handleUserSession(user) {
        if (!user) return;
        
        lastActivityTime = Date.now();
        localStorage.setItem('lastActivityTime', lastActivityTime);
        
        // Reset inactivity timeout
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
        
        inactivityTimeout = setTimeout(() => {
            console.log('Session expired due to inactivity');
            auth.signOut();
        }, INACTIVITY_TIMEOUT_HOURS * 60 * 60 * 1000);
    }
    
    // Track user activity
    function trackActivity() {
        lastActivityTime = Date.now();
        localStorage.setItem('lastActivityTime', lastActivityTime);
    }
    
    // Add event listeners for user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, trackActivity, true);
    });
    
    // Auth state observer
    auth.onAuthStateChanged(async (user) => {
        console.log('Auth state changed:', user?.email || 'no user');
        
        if (user) {
            // Check if email is allowed
            if (!isEmailAllowed(user.email)) {
                console.log('❌ Email not in whitelist:', user.email);
                alert('אין לך הרשאה לגשת למערכת זו. אנא צור קשר עם המנהל.');
                await auth.signOut();
                state.user = null;
                state.loading = false;
                render();
                return;
            }
            
            // Check session duration
            const lastActivity = localStorage.getItem('lastActivityTime');
            if (lastActivity) {
                const hoursSinceActivity = (Date.now() - parseInt(lastActivity)) / (1000 * 60 * 60);
                if (hoursSinceActivity > INACTIVITY_TIMEOUT_HOURS) {
                    console.log('Session expired - last activity was', hoursSinceActivity.toFixed(1), 'hours ago');
                    await auth.signOut();
                    state.user = null;
                    state.loading = false;
                    render();
                    return;
                }
            }
            
            console.log('✅ User authenticated:', user.email);
            state.user = user;
            handleUserSession(user);
            
            // Load initial data
            await Promise.all([
                appInstance.components.clients.loadClients(),
                appInstance.components.projects.loadAllProjects()
            ]);
            
            state.loading = false;
            
            // Handle browser history state
            const historyState = history.state;
            if (historyState) {
                restoreState(historyState);
            }
            
            render();
        } else {
            console.log('No user authenticated');
            state.user = null;
            state.loading = false;
            render();
        }
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', (event) => {
        if (event.state) {
            restoreState(event.state);
            render();
        }
    });
}

/**
 * Main render function
 */
function render() {
    const app = document.getElementById('app');
    
    if (state.loading) {
        app.innerHTML = `
            <div class="flex items-center justify-center min-h-screen">
                <div class="text-center">
                    <div class="text-2xl mb-4">⏳ טוען...</div>
                </div>
            </div>
        `;
        return;
    }
    
    if (!state.user) {
        app.innerHTML = renderLoginView();
        return;
    }
    
    // Render based on current view
    let content = '';
    
    if (state.selectedProject) {
        content = renderInvoiceView();
    } else if (state.view === 'clients') {
        content = appInstance.components.clients.renderClientsView();
    } else if (state.view === 'projects' && state.selectedClient) {
        content = renderProjectsView();
    } else if (state.view === 'suppliers') {
        content = renderSuppliersView();
    } else if (state.view === 'orders') {
        content = renderOrdersView();
    } else if (state.view === 'workSchedule') {
        content = renderWorkScheduleView();
    } else if (state.view === 'settings') {
        content = renderSettingsView();
    } else if (state.view === 'all-projects') {
        content = renderAllProjectsView();
    } else {
        content = appInstance.components.clients.renderClientsView();
    }
    
    app.innerHTML = content;
}

/**
 * Render login view (placeholder - full implementation needed)
 */
function renderLoginView() {
    return `
        <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
                <h1 class="text-3xl font-bold text-center mb-6 text-gray-800">מערכת ניהול פרויקטים</h1>
                <p class="text-center text-gray-600 mb-6">אנא התחבר באמצעות Google</p>
                <button onclick="window.appHandlers.signInWithGoogle()" 
                    class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition">
                    🔐 התחבר עם Google
                </button>
            </div>
        </div>
    `;
}

/**
 * Sign in with Google
 */
window.appHandlers = window.appHandlers || {};
window.appHandlers.signInWithGoogle = async function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await appInstance.auth.signInWithPopup(provider);
    } catch (error) {
        console.error('Error signing in:', error);
        alert('שגיאה בהתחברות: ' + error.message);
    }
};

window.appHandlers.signOut = async function() {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
        try {
            await appInstance.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
            alert('שגיאה בהתנתקות: ' + error.message);
        }
    }
};

/**
 * Browser history management
 */
function updateHistory() {
    const historyState = {
        view: state.view,
        selectedClientId: state.selectedClient?.id,
        selectedProjectId: state.selectedProject?.id
    };
    
    let url = '/';
    if (state.view === 'projects' && state.selectedClient) {
        url = `/?client=${state.selectedClient.id}`;
    } else if (state.selectedProject) {
        url = `/?client=${state.selectedClient.id}&project=${state.selectedProject.id}`;
    } else if (state.view !== 'clients') {
        url = `/?view=${state.view}`;
    }
    
    history.pushState(historyState, '', url);
}

function restoreState(historyState) {
    state.view = historyState.view || 'clients';
    
    if (historyState.selectedClientId) {
        state.selectedClient = state.clients.find(c => c.id === historyState.selectedClientId);
        if (state.selectedClient) {
            appInstance.components.projects.loadProjectsForClient(state.selectedClient.id);
        }
    }
    
    if (historyState.selectedProjectId && state.selectedClient) {
        const project = state.projects.find(p => p.id === historyState.selectedProjectId);
        if (project) {
            appInstance.components.projects.selectProject(project.id);
        }
    }
}

// Placeholder render functions (these need full implementation from index.html)
function renderProjectsView() {
    return '<div>Projects View - Implementation needed</div>';
}

function renderInvoiceView() {
    return '<div>Invoice View - Implementation needed</div>';
}

function renderSuppliersView() {
    return '<div>Suppliers View - Implementation needed</div>';
}

function renderOrdersView() {
    return '<div>Orders View - Implementation needed</div>';
}

function renderWorkScheduleView() {
    return '<div>Work Schedule View - Implementation needed</div>';
}

function renderAllProjectsView() {
    return '<div>All Projects View - Implementation needed</div>';
}

function renderSettingsView() {
    return appInstance.components.settings.renderSettingsView();
}

// Export for use in other modules
export { appInstance, render };

