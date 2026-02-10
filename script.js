console.log("script loaded");

document.addEventListener('DOMContentLoaded', () => {
    /* ---------- SESSION STATE ---------- */
    let currentUser = {
        email: null,
        role: 'student'
    };

    /* ---------- ELEMENTS ---------- */
    const authContainer = document.getElementById('auth-container');
    const loginView = document.getElementById('login-view');
    const signupView = document.getElementById('signup-view');
    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const logoutBtn = document.getElementById('logout-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const homeBtn = document.getElementById('home-btn');
    const backBtn = document.getElementById('back-btn');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    const roleBadge = document.getElementById('user-role-badge');

    // Section Toggles
    const dashboardView = document.getElementById('dashboard-view');
    const messagesView = document.getElementById('messages-view');
    const typingIndicator = document.getElementById('typing-indicator');

    // Feedback Elements
    const feedbackText = document.getElementById('feedback-text');
    const submitFeedback = document.getElementById('submit-feedback');
    const feedbackMsg = document.getElementById('feedback-msg');

    // Login Elements
    const loginBtn = document.getElementById('login-btn');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginMessage = document.getElementById('login-message');
    const showSignup = document.getElementById('show-signup');

    // Signup Elements
    const signupBtn = document.getElementById('signup-btn');
    const signupEmail = document.getElementById('signup-email');
    const signupPassword = document.getElementById('signup-password');
    const signupRole = document.getElementById('signup-role');
    const signupMessage = document.getElementById('signup-message');
    const showLogin = document.getElementById('show-login');

    /* ---------- UI NAVIGATION LOGIC ---------- */
    function switchToView(viewName) {
        const viewport = document.querySelector('.chat-viewport');

        // Randomly shift background hue on navigation
        updateDynamicBackground();

        if (viewName === 'chat') {
            dashboardView.style.display = 'none';
            messagesView.style.display = 'block';
            backBtn.style.display = 'flex';
            homeBtn.style.display = 'none';
        } else {
            dashboardView.style.display = 'block';
            messagesView.style.display = 'none';
            backBtn.style.display = 'none';
            homeBtn.style.display = 'flex';
            // Reset scroll to top of dashboard
            viewport.scrollTop = 0;
        }
    }

    function updateDynamicBackground() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const hue = Math.floor(Math.random() * 360);

        if (isDark) {
            // Dark mode colors (deeper, more saturated)
            document.body.style.background = `radial-gradient(circle at 0% 0%, 
                hsl(${hue}, 30%, 5%) 0%, 
                hsl(${(hue + 40) % 360}, 25%, 10%) 50%, 
                hsl(${(hue + 80) % 360}, 20%, 15%) 100%)`;
        } else {
            // Light mode colors (softer, pastel)
            document.body.style.background = `radial-gradient(circle at 0% 0%, 
                hsl(${hue}, 40%, 97%) 0%, 
                hsl(${(hue + 40) % 360}, 30%, 95%) 50%, 
                hsl(${(hue + 80) % 360}, 20%, 92%) 100%)`;
        }
    }

    /* ---------- THEME MANAGEMENT ---------- */
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcons(currentTheme);

    themeToggle.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeIcons(theme);
    });

    function updateThemeIcons(theme) {
        if (theme === 'dark') {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    }

    /* ---------- AUTH TOGGLES ---------- */
    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        loginView.style.opacity = '0';
        setTimeout(() => {
            loginView.style.display = 'none';
            signupView.style.display = 'flex';
            signupView.style.opacity = '1';
        }, 300);
    });

    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        signupView.style.opacity = '0';
        setTimeout(() => {
            signupView.style.display = 'none';
            loginView.style.display = 'flex';
            loginView.style.opacity = '1';
        }, 300);
    });

    /* ---------- CHAT UI ---------- */
    function addMessage(text, isBot = true) {
        if (!text) return;

        // Auto switch to chat view if current is dashboard
        if (messagesView.style.display === 'none') {
            switchToView('chat');
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isBot ? 'bot-message' : 'user-message'}`;

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;

        messageDiv.appendChild(bubble);
        chatMessages.appendChild(messageDiv);

        // Scroll to bottom with a small delay to ensure DOM is ready
        setTimeout(() => {
            const viewport = document.querySelector('.chat-viewport');
            viewport.scrollTop = viewport.scrollHeight;
        }, 50);
    }

    async function loadHistory(email) {
        try {
            const res = await fetch(`http://localhost:3000/history/${email}`);
            const data = await res.json();
            if (data.success && data.history.length > 0) {
                switchToView('chat'); // Show history if it exists
                chatMessages.innerHTML = '';
                data.history.forEach((item, index) => {
                    setTimeout(() => {
                        addMessage(item.message, false);
                        addMessage(item.reply, true);
                    }, index * 50); // Staggered entrance
                });
            }
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    }

    async function getBotResponse(query) {
        // Show typing indicator
        typingIndicator.style.display = 'flex';
        const viewport = document.querySelector('.chat-viewport');
        viewport.scrollTop = viewport.scrollHeight;

        try {
            const res = await fetch('http://localhost:3000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: query, email: currentUser.email })
            });

            const data = await res.json();
            typingIndicator.style.display = 'none';
            return data.reply;
        } catch {
            typingIndicator.style.display = 'none';
            return 'Server error. Please make sure backend is running.';
        }
    }

    async function handleSend(customText = null) {
        const text = customText || userInput.value.trim();
        if (!text) return;

        addMessage(text, false);
        userInput.value = '';
        userInput.focus(); // Keep focus

        const reply = await getBotResponse(text);
        addMessage(reply, true);
        userInput.focus(); // Keep focus after bot reply
    }

    sendButton.addEventListener('click', () => handleSend());
    userInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleSend();
    });

    /* ---------- NAVIGATION & FEEDBACK ---------- */
    homeBtn.addEventListener('click', () => {
        switchToView('dashboard');
        userInput.focus();
    });

    backBtn.addEventListener('click', () => {
        switchToView('dashboard');
        userInput.focus();
    });

    submitFeedback.addEventListener('click', () => {
        const text = feedbackText.value.trim();
        feedbackMsg.textContent = 'Thank you for your feedback! ✨';
        feedbackMsg.style.color = 'var(--accent)';
        feedbackText.value = '';
        setTimeout(() => { feedbackMsg.textContent = ''; }, 3000);
    });

    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const query = card.getAttribute('data-query');
            handleSend(query);
        });
    });

    /* ---------- LOGIN/LOGOUT FLOW ---------- */
    loginBtn.addEventListener('click', async () => {
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        if (!email || !password) {
            loginMessage.textContent = 'Please enter email and password';
            loginMessage.style.color = '#ef4444';
            return;
        }

        loginBtn.classList.add('loading-state');
        loginBtn.textContent = 'Verifying...';

        try {
            const res = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.success) {
                // Set Session
                currentUser.email = data.user.email;
                currentUser.role = data.user.role || 'student';

                // Update UI
                roleBadge.textContent = currentUser.role;
                roleBadge.className = `role-badge ${currentUser.role}`;

                // Load History
                await loadHistory(currentUser.email);

                authContainer.style.opacity = '0';
                authContainer.style.transform = 'scale(1.1) rotateX(10deg)';

                setTimeout(() => {
                    authContainer.style.display = 'none';
                    chatContainer.style.display = 'flex';
                    chatContainer.style.opacity = '1';
                    userInput.focus();
                    switchToView('dashboard'); // Always start at dashboard for new session
                }, 600);
            } else {
                loginMessage.textContent = data.message;
                loginMessage.style.color = '#ef4444';
            }
        } catch (err) {
            loginMessage.textContent = 'Connection error';
            loginMessage.style.color = '#ef4444';
        } finally {
            loginBtn.classList.remove('loading-state');
            loginBtn.textContent = 'Sign In';
        }
    });

    /* ---------- SIGNUP ---------- */
    signupBtn.addEventListener('click', async () => {
        const email = signupEmail.value.trim();
        const password = signupPassword.value.trim();
        const role = signupRole.value;

        if (!email || !password) {
            signupMessage.textContent = 'Please enter email and password';
            signupMessage.style.color = '#ef4444';
            return;
        }

        try {
            const res = await fetch('http://localhost:3000/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            const data = await res.json();

            if (!data.success) {
                signupMessage.textContent = data.message;
                signupMessage.style.color = '#ef4444';
                return;
            }

            signupMessage.textContent = 'Registration successful! Please Sign In.';
            signupMessage.style.color = '#10b981';

            setTimeout(() => {
                signupView.style.display = 'none';
                loginView.style.display = 'flex';
                signupEmail.value = '';
                signupPassword.value = '';
                signupMessage.textContent = '';
            }, 1500);

        } catch {
            signupMessage.textContent = 'Server error. Is backend running?';
            signupMessage.style.color = '#ef4444';
        }
    });

    /* ---------- LOGOUT ---------- */
    logoutBtn.addEventListener('click', () => {
        chatContainer.classList.add('fade-out');
        setTimeout(() => {
            chatContainer.style.display = 'none';
            chatContainer.classList.remove('fade-out');
            authContainer.style.display = 'flex';
            authContainer.style.opacity = '1';
            authContainer.style.transform = 'none';

            // Clear session
            currentUser.email = null;
            chatMessages.innerHTML = '';
            switchToView('dashboard');

            loginEmail.value = '';
            loginPassword.value = '';
            signupEmail.value = '';
            signupPassword.value = '';
        }, 400);
    });

    /* ---------- ADVANCED UI EFFECTS ---------- */

    // 3D Tilt Effect
    function applyTilt(elements) {
        elements.forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const dx = e.clientX - (rect.left + rect.width / 2);
                const dy = e.clientY - (rect.top + rect.height / 2);
                el.style.transform = `rotateY(${dx / 40}deg) rotateX(${-dy / 40}deg)`;
            });

            el.addEventListener('mouseleave', () => {
                el.style.transform = `rotateY(0deg) rotateX(0deg)`;
            });
        });
    }

    // Only apply tilt to cards, not the main container (to avoid scroll/click issues)
    applyTilt([...document.querySelectorAll('.category-card'), ...document.querySelectorAll('.auth-card')]);
});
