//Connecting to Node.js to create the user, passing values
const form = document.getElementById('signup-form');

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
    headers: ({"Content-Type" : "application/json"}),
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
  