//Connecting to Node.js to create the user, passing values
const form = document.getElementById('signup-form');

if (form) {  // ✅ Only run if signup form exists
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if(form.pword.value === form.cpword.value){
      console.log('Processing Creation of Account');
      const email = form.emailad.value;
      const pass = form.pword.value;
      const fname = form.fname.value;
      const lname = form.lname.value;
      const uname = form.uname.value;
      const points = 0;

      console.log(email, pass, fname, lname, uname, points);
      const res = await fetch('/api/createUser', {
        method: 'POST',
        headers: {"Content-Type" : "application/json"},
        body: JSON.stringify({ email, pass, fname, lname, uname, points}) 
      });

      const data = await res.json();

      if(data.goods === 1){
        console.log('worked');
      } else{
        window.alert(data.error);
      }
    } else {
      alert("Password Do Not Match");
    }
  });
}

  async function loadImage() {
    const id = 1;
  
    fetch('/api/getImage/1/1')
      .then(res => res.json())
      .then(data => {
        document.getElementById("testimage").src = data.image;
      });

    // const res = await fetch('api/getImage/1/1');
    // console.log('working');
    // const data = await res.json();

    // document.getElementById("testimage").src = data.iamge;
  }

const lform = document.getElementById('login-form');

if (lform) {  // ✅ Only run if login form exists
  lform.addEventListener("submit", async (event) => {
    event.preventDefault();

    const uname = lform.uname.value;
    const pass = lform.password.value;
    
    console.log('created uname, pass');
    const res = await fetch('/api/loginUser', {
      method: 'POST',
      headers: {"Content-Type" : "application/json"},
      body: JSON.stringify({ pass, uname })
    });

    const data = await res.json();

    if(data.success){
      console.log('login successful');
      // Redirect to main page or dashboard
      window.location.href = '/index';
    } else {
      window.alert(data.message);
    }
  });
}

// LOGIN HANDLER - Integrated with Node.js backend
(function attachLoginHandler() {
    const form = document.getElementById('login-form');
    if (!form) return;

    const freshForm = form.cloneNode(true);
    form.parentNode.replaceChild(freshForm, form);

    freshForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');

        const username = usernameEl.value.trim();
        const password = passwordEl.value;

        if (!username || !password) {
            showLoginError('Please fill in all fields.');
            return;
        }

        try {
            const res = await fetch('/api/loginUser', {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ uname: username, pass: password })
            });

            const data = await res.json();

            if (data.success) {
                console.log('Login successful');
                window.location.href = '/index';
            } else {
                showLoginError(data.message || 'Invalid username or password', 'password');
            }
        } catch (error) {
            console.error('Login error:', error);
            showLoginError('Connection error. Please try again.');
        }
    });

    function showLoginError(message, field) {
        document.querySelectorAll('.auth-error-msg').forEach(el => el.remove());

        const banner = document.createElement('p');
        banner.className = 'auth-error-msg';
        banner.textContent = '⚠ ' + message;
        banner.style.cssText = `
            color: #e05050;
            font-size: 0.82rem;
            margin-top: 0.5rem;
            text-align: center;
        `;

        const anchor = field === 'password'
            ? document.getElementById('password').closest('.input-box')
            : field === 'username'
                ? document.getElementById('username').closest('.input-box')
                : document.querySelector('#login-form button[type="submit"]');

        if (anchor) anchor.insertAdjacentElement('afterend', banner);
    }
})();


// SIGNUP HANDLER - Integrated with Node.js backend
(function attachSignupHandler() {
    const form = document.getElementById('signup-form');
    if (!form) return;

    const freshForm = form.cloneNode(true);
    form.parentNode.replaceChild(freshForm, form);

    // Real-time validation: clear errors on input
    ['firstname','lastname','username','email','password','confirm-password'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', function () {
            this.classList.remove('invalid');
            const errId = 'err-' + (id === 'confirm-password' ? 'confirm' : id);
            const errEl = document.getElementById(errId);
            if (errEl) errEl.textContent = '';
        });
    });

    // Password strength meter
    const pwEl = document.getElementById('password');
    if (pwEl) {
        pwEl.addEventListener('input', function () {
            const val = this.value;
            const wrap  = document.getElementById('strength-wrap');
            const fill  = document.getElementById('strength-fill');
            const label = document.getElementById('strength-label');
            if (!wrap) return;

            if (val.length === 0) { 
                wrap.classList.remove('visible'); 
                return; 
            }

            wrap.classList.add('visible');
            fill.classList.remove('weak', 'medium', 'strong');

            let score = 0;
            if (val.length >= 8) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;
            if (/[^A-Za-z0-9]/.test(val)) score++;

            if (score <= 1) {
                fill.classList.add('weak');
                label.textContent = 'Weak';
                label.style.color = '#e05050';
            } else if (score <= 2) {
                fill.classList.add('medium');
                label.textContent = 'Medium';
                label.style.color = '#e8a020';
            } else {
                fill.classList.add('strong');
                label.textContent = 'Strong';
                label.style.color = '#30c8b0';
            }
        });
    }

    // Form submission
    freshForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const get  = id => document.getElementById(id);
        const setE = (id, errId, msg) => {
            get(id).classList.add('invalid');
            get(id).classList.remove('valid');
            get(errId).textContent = msg;
            valid = false;
        };
        const setV = (id, errId) => {
            get(id).classList.remove('invalid');
            get(id).classList.add('valid');
            get(errId).textContent = '';
        };

        let valid = true;

        const firstname = get('firstname').value.trim();
        const lastname  = get('lastname').value.trim();
        const username  = get('username').value.trim();
        const email     = get('email').value.trim();
        const password  = get('password').value;
        const confirm   = get('confirm-password').value;

        // Client-side validation
        if (!firstname)     setE('firstname', 'err-firstname', 'First name is required.');
        else                setV('firstname', 'err-firstname');

        if (!lastname)      setE('lastname',  'err-lastname',  'Last name is required.');
        else                setV('lastname',  'err-lastname');

        if (username.length < 3) setE('username', 'err-username', 'Username must be at least 3 characters.');
        else                     setV('username', 'err-username');

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setE('email', 'err-email', 'Please enter a valid email address.');
        else                                             setV('email', 'err-email');

        if (password.length < 8) setE('password', 'err-password', 'Password must be at least 8 characters.');
        else                     setV('password', 'err-password');

        if (confirm !== password) setE('confirm-password', 'err-confirm', 'Passwords do not match.');
        else                      setV('confirm-password', 'err-confirm');

        if (!valid) return;

        // Submit to backend
        try {
            console.log('Processing creation of account');
            const res = await fetch('/api/createUser', {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ 
                    fname: firstname, 
                    lname: lastname, 
                    uname: username, 
                    email: email,
                    pass: password,
                    points: 0
                })
            });

            const data = await res.json();

            if (data.goods === 1) {
                console.log('Account created successfully');
                window.location.href = '/index';
            } else {
                // Handle server-side validation errors
                const errorMsg = data.error || 'An error occurred';
                
                if (errorMsg.toLowerCase().includes('username')) {
                    setE('username', 'err-username', errorMsg);
                } else if (errorMsg.toLowerCase().includes('email')) {
                    setE('email', 'err-email', errorMsg);
                } else {
                    window.alert(errorMsg);
                }
            }
        } catch (error) {
            console.error('Signup error:', error);
            window.alert('Connection error. Please try again.');
        }
    });
})();


// Image loader function (if needed)
async function loadImage() {
    const id = 1;
  
    fetch('/api/getImage/1/1')
        .then(res => res.json())
        .then(data => {
            const imgEl = document.getElementById("testimage");
            if (imgEl) {
                imgEl.src = data.image;
            }
        })
        .catch(error => {
            console.error('Error loading image:', error);
        });
}