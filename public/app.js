// ========================================
// AUTHENTICATION HANDLERS
// ========================================

/**
 * Signup Form Handler
 * Handles user registration with client-side validation
 */
(function initSignupForm() {
    const form = document.getElementById('signup-form');
    if (!form) return;

    // Real-time validation: clear errors on input
    const inputFields = ['firstname', 'lastname', 'username', 'email', 'password', 'confirm-password'];
    inputFields.forEach(id => {
        const element = document.getElementById(id);
        if (!element) return;
        
        element.addEventListener('input', function() {
            this.classList.remove('invalid');
            const errorId = `err-${id === 'confirm-password' ? 'confirm' : id}`;
            const errorElement = document.getElementById(errorId);
            if (errorElement) errorElement.textContent = '';
        });
    });

    // Password strength meter
    initPasswordStrengthMeter();

    // Form submission
    form.addEventListener('submit', handleSignupSubmit);
})();


/**
 * Login Form Handler
 * Handles user authentication
 */
(function initLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', handleLoginSubmit);
})();


// ========================================
// SIGNUP FUNCTIONS
// ========================================

/**
 * Initialize password strength meter
 */
function initPasswordStrengthMeter() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;

    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strengthWrap = document.getElementById('strength-wrap');
        const strengthFill = document.getElementById('strength-fill');
        const strengthLabel = document.getElementById('strength-label');
        
        if (!strengthWrap) return;

        // Hide meter if password is empty
        if (password.length === 0) {
            strengthWrap.classList.remove('visible');
            return;
        }

        strengthWrap.classList.add('visible');
        strengthFill.classList.remove('weak', 'medium', 'strong');

        // Calculate password strength
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        // Update strength indicator
        if (score <= 1) {
            strengthFill.classList.add('weak');
            strengthLabel.textContent = 'Weak';
            strengthLabel.style.color = '#e05050';
        } else if (score <= 2) {
            strengthFill.classList.add('medium');
            strengthLabel.textContent = 'Medium';
            strengthLabel.style.color = '#e8a020';
        } else {
            strengthFill.classList.add('strong');
            strengthLabel.textContent = 'Strong';
            strengthLabel.style.color = '#30c8b0';
        }
    });
}


/**
 * Handle signup form submission
 */
async function handleSignupSubmit(event) {
    event.preventDefault();

    const formData = getSignupFormData();
    
    // Validate form data
    if (!validateSignupForm(formData)) {
        return;
    }

    // Submit to backend
    try {
        console.log('Processing creation of account');
        const response = await fetch('/api/createUser', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                fname: formData.firstname,
                lname: formData.lastname,
                uname: formData.username,
                email: formData.email,
                pass: formData.password,
                points: 0
            })
        });

        const data = await response.json();

        if (data.goods === 1) {
            console.log('Account created successfully');
            window.location.href = '/dashboard';
        } else {
            handleSignupError(data.error || 'An error occurred');
        }
    } catch (error) {
        console.error('Signup error:', error);
        window.alert('Connection error. Please try again.');
    }
}


/**
 * Get form data from signup form
 */
function getSignupFormData() {
    const getElementById = id => document.getElementById(id);
    
    return {
        firstname: getElementById('firstname').value.trim(),
        lastname: getElementById('lastname').value.trim(),
        username: getElementById('username').value.trim(),
        email: getElementById('email').value.trim(),
        password: getElementById('password').value,
        confirm: getElementById('confirm-password').value
    };
}


/**
 * Validate signup form fields
 */
function validateSignupForm(formData) {
    let isValid = true;

    // First name validation
    if (!formData.firstname) {
        setFieldError('firstname', 'First name is required.');
        isValid = false;
    } else {
        setFieldValid('firstname');
    }

    // Last name validation
    if (!formData.lastname) {
        setFieldError('lastname', 'Last name is required.');
        isValid = false;
    } else {
        setFieldValid('lastname');
    }

    // Username validation
    if (formData.username.length < 3) {
        setFieldError('username', 'Username must be at least 3 characters.');
        isValid = false;
    } else {
        setFieldValid('username');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        setFieldError('email', 'Please enter a valid email address.');
        isValid = false;
    } else {
        setFieldValid('email');
    }

    // Password validation
    if (formData.password.length < 8) {
        setFieldError('password', 'Password must be at least 8 characters.');
        isValid = false;
    } else {
        setFieldValid('password');
    }

    // Confirm password validation
    if (formData.confirm !== formData.password) {
        setFieldError('confirm-password', 'Passwords do not match.', 'confirm');
        isValid = false;
    } else {
        setFieldValid('confirm-password', 'confirm');
    }

    return isValid;
}


/**
 * Set field error state
 */
function setFieldError(fieldId, message, errorSuffix = null) {
    const field = document.getElementById(fieldId);
    const errorId = `err-${errorSuffix || fieldId}`;
    const errorElement = document.getElementById(errorId);
    
    if (field) {
        field.classList.add('invalid');
        field.classList.remove('valid');
    }
    
    if (errorElement) {
        errorElement.textContent = message;
    }
}


/**
 * Set field valid state
 */
function setFieldValid(fieldId, errorSuffix = null) {
    const field = document.getElementById(fieldId);
    const errorId = `err-${errorSuffix || fieldId}`;
    const errorElement = document.getElementById(errorId);
    
    if (field) {
        field.classList.remove('invalid');
        field.classList.add('valid');
    }
    
    if (errorElement) {
        errorElement.textContent = '';
    }
}


/**
 * Handle signup error from server
 */
function handleSignupError(errorMessage) {
    if (errorMessage.toLowerCase().includes('username')) {
        setFieldError('username', errorMessage);
    } else if (errorMessage.toLowerCase().includes('email')) {
        setFieldError('email', errorMessage);
    } else {
        window.alert(errorMessage);
    }
}


// ========================================
// LOGIN FUNCTIONS
// ========================================

/**
 * Handle login form submission
 */
async function handleLoginSubmit(event) {
    event.preventDefault();

    const usernameElement = document.getElementById('username');
    const passwordElement = document.getElementById('password');

    const username = usernameElement.value.trim();
    const password = passwordElement.value;

    // Basic validation
    if (!username || !password) {
        showLoginError('Please fill in all fields.');
        return;
    }

    // Submit to backend
    try {
        const response = await fetch('/api/loginUser', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uname: username, pass: password })
        });

        const data = await response.json();

        if (data.success) {
            console.log('Login successful');
            window.location.href = '/dashboard';
        } else {
            showLoginError(data.message || 'Invalid username or password', 'password');
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Connection error. Please try again.');
    }
}


/**
 * Show login error message
 */
function showLoginError(message, field = null) {
    // Remove existing error messages
    document.querySelectorAll('.auth-error-msg').forEach(element => element.remove());

    // Create error banner
    const errorBanner = document.createElement('p');
    errorBanner.className = 'auth-error-msg';
    errorBanner.textContent = '⚠ ' + message;
    errorBanner.style.cssText = `
        color: #e05050;
        font-size: 0.82rem;
        margin-top: 0.5rem;
        text-align: center;
    `;

    // Find anchor element for error placement
    let anchor;
    if (field === 'password') {
        anchor = document.getElementById('password')?.closest('.input-box');
    } else if (field === 'username') {
        anchor = document.getElementById('username')?.closest('.input-box');
    } else {
        anchor = document.querySelector('#login-form button[type="submit"]');
    }

    // Insert error message
    if (anchor) {
        anchor.insertAdjacentElement('afterend', errorBanner);
    }
}


// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Load image from API
 * @param {number} param1 - First parameter for image API
 * @param {number} param2 - Second parameter for image API
 */
async function loadImage(param1 = 1, param2 = 1) {
    try {
        const response = await fetch(`/api/getImage/${param1}/${param2}`);
        const data = await response.json();
        
        const imageElement = document.getElementById("testimage");
        if (imageElement && data.image) {
            imageElement.src = data.image;
        }
    } catch (error) {
        console.error('Error loading image:', error);
    }
}