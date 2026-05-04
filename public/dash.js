async function loadUser() {
  const res = await fetch('/api/me', {
    credentials: 'include'
  });
  const data = await res.json();
  if(data.success === false){
    window.location.href = '/login';
    return;
  }
  console.log(data);

  const response = await fetch(`/users/${data.uid}`);
  const user = await response.json();

  console.log(user);

  const uname = document.getElementById("username");
  const xp = document.getElementById("dash-xp");
  const pname = document.getElementById("profile-name");
  uname.textContent = user.username;
  xp.textContent = user.user_points + " XP";
  pname.textContent = user.username;

  console.log("testing");
}

loadUser();