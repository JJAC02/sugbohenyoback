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
      window.location.href = '/';
    } else {
      window.alert(data.message);
    }
  });
}