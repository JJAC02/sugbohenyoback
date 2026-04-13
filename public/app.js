// frontend/app.js

// Fetch all users from your Express server
async function getUsers() {
  const response = await fetch('/users');
  const users = await response.json();

  const list = document.getElementById('user-list');
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = `${user.first_name} — ${user.email}`;
    list.appendChild(li);
  });
}

getUsers();