//Connecting to Node.js to create the user, passing values
const form = document.getElementById('jerson');

form.addEventListener("submit", async (e) => {
  e.preventDefault();
console.log('added');
  const email = form.email.value;
  const pass = form.password.value;
  const fname = form.fname.value;
  const lname = form.lname.value;

  console.log(email, pass, fname, lname);
  const res = await fetch('/api/createUser', {
    method: 'POST',
    headers: ({"Content-Type" : "application/json"}),
    body: JSON.stringify({ email, pass, fname, lname}) 
  });

  const data = await res.json();

  if(data.goods === 1){
    console.log('worked');
  } else{
    window.alert(data.error);
  }


  })

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