// ============================================
// Authentication Functions
// ============================================

// Register new user
async function registerUser(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    try {
        const response = await fetch('api/users.php?action=register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password,
                full_name: username
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Registration successful! Please log in.');
            window.location.href = 'login.html';
        } else {
            alert('Registration failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during registration');
    }
}

// Login user
async function loginUser(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('api/users.php?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store user info in localStorage
            localStorage.setItem('user_id', data.user_id);
            localStorage.setItem('username', username);
            // Normalize is_admin to string 'true' or 'false' so getCurrentUser() works reliably
            localStorage.setItem('is_admin', data.is_admin ? 'true' : 'false');
            
            alert('Login successful!');
            window.location.href = 'shop.html';
        } else {
            alert('Login failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred during login');
    }
}

// Logout user
function logoutUser() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('is_admin');
    
    fetch('api/users.php?action=logout', {
        method: 'GET',
        credentials: 'include'
    }).then(() => {
        alert('Logged out successfully');
        window.location.href = 'index.html';
    });
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('user_id') !== null;
}

// Get current user
function getCurrentUser() {
    return {
        id: localStorage.getItem('user_id'),
        username: localStorage.getItem('username'),
        is_admin: localStorage.getItem('is_admin') === 'true'
    };
}

// Update navbar based on login status
function updateNavbar() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;

    const findAnchor = (href) => navLinks.querySelector(`a[href="${href}"]`);

    if (isLoggedIn()) {
        const user = getCurrentUser();

        // Ensure Profile link
        let loginLink = findAnchor('login.html') || findAnchor('profile.html');
        if (!loginLink) {
            const li = document.createElement('li');
            loginLink = document.createElement('a');
            loginLink.href = 'profile.html';
            loginLink.textContent = 'Profile';
            li.appendChild(loginLink);
            navLinks.appendChild(li);
        } else {
            loginLink.textContent = 'Profile';
            loginLink.href = 'profile.html';
        }

        // Ensure Logout link
        let registerLink = findAnchor('register.html') || navLinks.querySelector('a[href="#"]');
        if (!registerLink || registerLink.getAttribute('href') === 'register.html') {
            // If a register link exists but we want logout, reuse it
            if (!registerLink || registerLink.getAttribute('href') !== '#') {
                // find existing register link
                registerLink = findAnchor('register.html');
            }
        }
        if (!registerLink) {
            const li = document.createElement('li');
            registerLink = document.createElement('a');
            registerLink.href = '#';
            registerLink.textContent = 'Logout';
            registerLink.addEventListener('click', (e) => { e.preventDefault(); logoutUser(); });
            li.appendChild(registerLink);
            navLinks.appendChild(li);
        } else {
            registerLink.textContent = 'Logout';
            registerLink.href = '#';
            registerLink.onclick = (e) => { e.preventDefault(); logoutUser(); };
        }

        // Admin link handling
        const adminAnchor = findAnchor('admin.html');
        if (user.is_admin) {
            if (!adminAnchor) {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = 'admin.html';
                a.textContent = 'Admin';
                li.appendChild(a);
                // insert admin before profile link if possible
                const profileLi = loginLink.closest('li');
                if (profileLi) profileLi.parentNode.insertBefore(li, profileLi);
                else navLinks.appendChild(li);
            }
        } else {
            if (adminAnchor) {
                const li = adminAnchor.closest('li');
                if (li) li.remove();
            }
        }

    } else {
        // Not logged in: ensure default login/register links and remove admin link
        const adminAnchor = findAnchor('admin.html');
        if (adminAnchor) {
            const li = adminAnchor.closest('li');
            if (li) li.remove();
        }

        // Reset or create login link
        let loginLink = findAnchor('profile.html') || findAnchor('login.html');
        if (loginLink) {
            loginLink.textContent = 'Log In';
            loginLink.href = 'login.html';
        } else {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = 'login.html';
            a.textContent = 'Log In';
            li.appendChild(a);
            navLinks.appendChild(li);
        }

        // Reset or create register link
        let registerLink = findAnchor('register.html') || navLinks.querySelector('a[href="#"]');
        if (registerLink) {
            registerLink.textContent = 'Register';
            registerLink.href = 'register.html';
            registerLink.onclick = null;
        } else {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = 'register.html';
            a.textContent = 'Register';
            li.appendChild(a);
            navLinks.appendChild(li);
        }
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', updateNavbar);
