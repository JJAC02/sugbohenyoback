async function loadUser() {
  const res = await fetch('/api/me', {
    credentials: 'include'
  });
  const data = await res.json();
  if(data.success === false){
    window.location.href = '/login';
    return;
  }

  const response = await fetch(`/api/dashboard_details/${data.uid}`);
  const dash = await response.json();

  // Check if the dashboard API call was successful
  if(dash.success === false) {
    console.error('Failed to load dashboard data');
    return;
  }

  // Extract the data object from the response
  const userData = dash.data;

  //PROFILE
  //Naming of Variables
  const uname = document.getElementById("username");
  const xp = document.getElementById("dash-xp");
  const pname = document.getElementById("profile-name");
  const qd = document.getElementById("quest_done");
  const ob = document.getElementById("obtained_badges");
  const ld = document.getElementById("locations_done");

  //Actual showing of Data
  uname.textContent = userData.username;
  xp.textContent = userData.userPoints + " XP";
  pname.textContent = userData.username;
  
  // Stats (completed counts)
  qd.textContent = `${userData.stats.completedQuests} / ${userData.progress.totalQuests}`;
  ob.textContent = `${userData.stats.completedBadges} / ${userData.progress.totalBadges}`;
  ld.textContent = `${userData.stats.completedLocations} / ${userData.progress.totalLocations}`;

  console.log("Dashboard loaded successfully");
  console.log("Badges:", userData.badges);
  console.log("Inventory:", userData.inventory);
}

loadUser();