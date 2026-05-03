async function loadUser() {
  const res = await fetch('/api/me', {
    credentials: 'include'
  });

  const data = await res.json();
  console.log(data);

  const response = await fetch(`/users/${data.uid}`);
  const user = await response.json();

  console.log(user);

  const uname = document.getElementById("username");
  const pname = document.getElementById("profile-name");
  uname.textContent = user.username;
  pname.textContent = user.username;

  console.log("testing");
}

loadUser();