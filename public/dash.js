// dash.js - Dashboard data loader

// State management
let userData = null;
let currentUserId = null;
let isLoading = true;

/**
 * Main function to load user data and populate dashboard
 */
async function loadUser() {
  try {
    showLoadingState();

    // Step 1: Check if user is authenticated
    const authRes = await fetch('/api/me', {
      credentials: 'include'
    });

    const authData = await authRes.json();

    if (!authData.success || !authData.uid) {
      console.warn('User not authenticated, redirecting to login');
      window.location.href = '/login';
      return;
    }

    console.log('User authenticated:', authData.username);
    currentUserId = authData.uid;

    // Step 2: Fetch dashboard data
    const dashRes = await fetch(`/api/dashboard_details/${authData.uid}`);
    
    if (!dashRes.ok) {
      throw new Error(`Dashboard API returned ${dashRes.status}`);
    }

    const dashData = await dashRes.json();

    if (!dashData.success) {
      throw new Error(dashData.message || 'Failed to load dashboard data');
    }

    // Store user data globally
    userData = dashData.data;

    console.log('Dashboard data loaded:', userData);

    // Step 3: Populate UI with data
    populateDashboard(userData);
    await getBadge(userData);
    hideLoadingState();

  } catch (error) {
    console.error('Error loading dashboard:', error);
    showErrorState(error.message);
  }
}
/**
 * Populate all dashboard elements with user data
 */
function populateDashboard(data) {

  // Profile Section
  updateProfileSection(data);

  // Stats Section
  updateStatsSection(data);

  // Progress Bars
  updateProgressBars(data);

  // Badges Section
  updateBadgesSection(data);

  // Relics Section
  updateRelicsSection(data);

  // Level/Rank Section
  updateLevelSection(data);
}

/**
 * Update profile section
 */
function updateProfileSection(data) {
  const elements = {
    username: document.getElementById('username'),
    dashXp: document.getElementById('dash-xp'),
    profileName: document.getElementById('profile-name')
  };

  if (elements.username) {
    elements.username.textContent = data.username;
  }

  if (elements.dashXp) {
    elements.dashXp.textContent = `${data.userPoints.toLocaleString()} XP`;
  }

  if (elements.profileName) {
    elements.profileName.textContent = data.username;
  }
}

/**
 * Update stats section (quest, badges, locations counts)
 */
function updateStatsSection(data) {
  const elements = {
    questDone: document.getElementById('quest_done'),
    obtainedBadges: document.getElementById('obtained_badges'),
    locationsDone: document.getElementById('locations_done')
  };

  if (elements.questDone) {
    elements.questDone.textContent = data.stats.completedQuests;
  }

  if (elements.obtainedBadges) {
    elements.obtainedBadges.textContent = data.stats.completedBadges;
  }

  if (elements.locationsDone) {
    elements.locationsDone.textContent = data.stats.completedLocations;
  }
}

/**
 * Update progress bars with safe percentage calculations
 */
function updateProgressBars(data) {
  const progressBars = document.querySelectorAll('.progress-bar');
  
  const stats = [
    {
      completed: data.stats.completedQuests,
      total: data.progress.totalQuests,
      percentElement: document.getElementById('qpc')
    },
    {
      completed: data.stats.completedBadges,
      total: data.progress.totalBadges,
      percentElement: document.getElementById('bpc')
    },
    {
      completed: data.stats.completedLocations,
      total: data.progress.totalLocations,
      percentElement: document.getElementById('lpc')
    }
  ];

  progressBars.forEach((bar, index) => {
    if (index >= stats.length) return;

    const stat = stats[index];
    
    // Safe percentage calculation (avoid division by zero)
    let percentage = 0;
    if (stat.total > 0) {
      percentage = Math.round((stat.completed / stat.total) * 100);
    }

    // Clamp percentage between 0 and 100
    percentage = Math.max(0, Math.min(100, percentage));

    // Update percentage text
    if (stat.percentElement) {
      stat.percentElement.textContent = `${percentage}%`;
    }

    // Update progress bar width with animation
    bar.style.setProperty('--pct', `${percentage}%`);

    // Update subtitle text
    const progressCard = bar.closest('.progress-card');
    if (progressCard) {
      const subtitle = progressCard.querySelector('.progress-sub');
      if (subtitle) {
        subtitle.textContent = `${stat.completed} of ${stat.total} completed`;
      }
    }
  });

  // Update relics progress (4th progress card if it exists)
  updateRelicsProgress(data);
}

/**
 * Update relics progress bar (if exists)
 */
function updateRelicsProgress(data) {
  // Find the 4th progress card (relics)
  const progressCards = document.querySelectorAll('.progress-card');
  
  if (progressCards.length >= 4) {
    const relicsCard = progressCards[3];
    const relicsBar = relicsCard.querySelector('.progress-bar');
    const relicsPercent = relicsCard.querySelector('.progress-percent');
    const relicsSub = relicsCard.querySelector('.progress-sub');

    const completed = data.stats.completedRelics || 0;
    const total = data.progress.totalRelics || 0;

    let percentage = 0;
    if (total > 0) {
      percentage = Math.round((completed / total) * 100);
    }

    percentage = Math.max(0, Math.min(100, percentage));

    if (relicsBar) {
      relicsBar.style.setProperty('--pct', `${percentage}%`);
    }

    if (relicsPercent) {
      relicsPercent.textContent = `${percentage}%`;
    }

    if (relicsSub) {
      relicsSub.textContent = `${completed} of ${total} completed`;
    }
  }
}

/**
 * Update badges section - mark earned badges
 */
function updateBadgesSection(data) {
  const badgeCards = document.querySelectorAll('.badge-card');
  const earnedBadgeIds = data.badges.map(b => b.badge_id);

  badgeCards.forEach((card, index) => {
    // Badge IDs typically start from 1
    const badgeId = index + 1;

    if (earnedBadgeIds.includes(badgeId)) {
      card.classList.remove('locked');
      card.classList.add('earned');
    }
  });

  console.log('Badges updated. Earned:', earnedBadgeIds);
}

/**
 * Update relics section - mark earned relics
 */
function updateRelicsSection(data) {
  const relicCards = document.querySelectorAll('.relic-card');
  const earnedRelicIds = data.inventory.map(r => r.relic_id);

  relicCards.forEach((card, index) => {
    // Relic IDs typically start from 1
    const relicId = index + 1;

    if (earnedRelicIds.includes(relicId)) {
      card.classList.remove('locked');
      card.classList.add('earned');
    }
  });

  console.log('Relics updated. Earned:', earnedRelicIds);
}

/**
 * Update level section based on XP
 */
function updateLevelSection(data) {
  const xp = data.userPoints;
  
  // Simple level calculation (you can adjust this formula)
  const level = Math.floor(xp / 500) + 1;
  const xpForNextLevel = level * 500;
  const xpInCurrentLevel = xp % 500;
  const percentToNextLevel = (xpInCurrentLevel / 500) * 100;

  const levelNum = document.querySelector('.level-num');
  const levelBar = document.querySelector('.level-bar');
  const levelXpSub = document.querySelector('.level-xp-sub');

  if (levelNum) {
    levelNum.textContent = level;
  }

  if (levelBar) {
    levelBar.style.width = `${Math.round(percentToNextLevel)}%`;
  }

  if (levelXpSub) {
    levelXpSub.textContent = `${xpInCurrentLevel} / 500 XP to next level`;
  }

  // Update rank display
  updateRankDisplay(level);
}

/**
 * Update rank display based on level
 */
function updateRankDisplay(level) {
  const rankElement = document.querySelector('.profile-rank');
  
  if (!rankElement) return;

  let rankName = 'Cebu Apprentice';
  let rankIcon = 'fa-scroll';

  if (level >= 20) {
    rankName = 'Cebu Master';
    rankIcon = 'fa-crown';
  } else if (level >= 15) {
    rankName = 'Cebu Expert';
    rankIcon = 'fa-star';
  } else if (level >= 10) {
    rankName = 'Cebu Scholar';
    rankIcon = 'fa-book';
  } else if (level >= 5) {
    rankName = 'Cebu Explorer';
    rankIcon = 'fa-compass';
  }

  rankElement.innerHTML = `<i class="fa-solid ${rankIcon}"></i> ${rankName}`;
}

/**
 * Show loading state
 */
function showLoadingState() {
  const main = document.querySelector('.main');
  
  if (!main) return;

  // Create loading overlay
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'loading-overlay';
  loadingOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(4px);
  `;

  loadingOverlay.innerHTML = `
    <div style="text-align: center; color: white; font-family: 'Press Start 2P', system-ui;">
      <div style="font-size: 12px; margin-bottom: 16px;">Loading Dashboard...</div>
      <div class="loading-spinner"></div>
    </div>
  `;

  document.body.appendChild(loadingOverlay);
}

/**
 * Hide loading state
 */
function hideLoadingState() {
  const loadingOverlay = document.getElementById('loading-overlay');
  
  if (loadingOverlay) {
    loadingOverlay.remove();
  }

  isLoading = false;
}

/**
 * Show error state
 */
function showErrorState(message) {
  hideLoadingState();

  const main = document.querySelector('.main');
  
  if (!main) return;

  // Create error overlay
  const errorOverlay = document.createElement('div');
  errorOverlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(224, 80, 80, 0.95);
    border: 2px solid rgba(255, 100, 100, 0.8);
    border-radius: 10px;
    padding: 24px 32px;
    z-index: 9999;
    text-align: center;
    color: white;
    font-family: 'Press Start 2P', system-ui;
    max-width: 400px;
  `;

  errorOverlay.innerHTML = `
    <div style="font-size: 10px; margin-bottom: 12px;">Error Loading Dashboard</div>
    <div style="font-size: 7px; line-height: 1.6; margin-bottom: 16px;">${escapeHtml(message)}</div>
    <button onclick="location.reload()" style="
      background: white;
      color: #e05050;
      border: none;
      padding: 8px 16px;
      border-radius: 5px;
      font-family: 'Press Start 2P', system-ui;
      font-size: 7px;
      cursor: pointer;
    ">Retry</button>
  `;

  document.body.appendChild(errorOverlay);
}

// function to get badges
async function getBadge(data) {
  try {

    // Use already loaded user data
   if (!currentUserId) {
    console.error('Cannot obtain badge: user not logged in');
    return;
  }

    const badgesToAward = [];

    const completedRelics = data.stats.completedRelics || 0;
    const completedQuests = data.stats.completedQuests || 0;
    const completedLocations = data.stats.completedLocations || 0;

    const totalRelics = data.progress.totalRelics || 0;
    const totalLocations = data.progress.totalLocations || 0;
    const totalQuests = data.progress.totalQuests || 0;

    // Badge 1 -> 1 completed relic
    if (completedRelics >= 1) {
      badgesToAward.push(1);
    }

    // Badge 2 -> 1 quest and 1 location
    if (
      completedQuests >= 1 &&
      completedLocations >= 1
    ) {
      badgesToAward.push(2);
    }

    // Badge 3 -> 25 locations
    if (completedLocations >= 25) {
      badgesToAward.push(3);
    }

    // Badge 4 -> 5 quests
    if (completedQuests >= 5) {
      badgesToAward.push(4);
    }

    // Badge 5 -> 4 relics
    if (completedRelics >= 4) {
      badgesToAward.push(5);
    }

    // Badge 6 -> all relics
    if (
      totalRelics > 0 &&
      completedRelics >= totalRelics
    ) {
      badgesToAward.push(6);
    }

    // Badge 7 -> all locations
    if (
      totalLocations > 0 &&
      completedLocations >= totalLocations
    ) {
      badgesToAward.push(7);
    }

    // Badge 8 -> all quests
    if (
      totalQuests > 0 &&
      completedQuests >= totalQuests
    ) {
      badgesToAward.push(8);
    }
    console.log('completedQuestIds:', data.completedQuestIds);
    console.log('full dashboard data:', data);
    // Badge 9 -> completed quest_id 10
    // ONLY if your API provides completedQuestIds
    if (
      Array.isArray(data.completedQuestIds) &&
      data.completedQuestIds.includes(10)
    ) {
      badgesToAward.push(9);
    }

    // Remove already earned badges
    const earnedBadgeIds = data.badges.map(b => b.badge_id);

    const filteredBadges = badgesToAward.filter(
      bid => !earnedBadgeIds.includes(bid)
    );

    if (filteredBadges.length === 0) {
      console.log('No new badges earned');
      return;
    }

    // Award badges
    for (const bid of filteredBadges) {

      const res = await fetch(
        `/api/obtainBadge/${currentUserId}/${bid}`,
        {
          method: 'POST',
          credentials: 'include'
        }
      );

      if (!res.ok) {

        if (res.status === 409) {
          console.log(`Badge ${bid} already obtained`);
          continue;
        }

        console.error(`Failed to obtain badge ${bid}`);
        continue;
      }

      console.log(`Badge ${bid} obtained`);

    }
    await refreshBadges();

  } catch (err) {
    console.error('getBadge() failed:', err);
  }
}

async function refreshBadges() {
  try {

    const res = await fetch(
      `/api/dashboard_details/${currentUserId}`
    );

    if (!res.ok) {
      throw new Error('Failed to refresh badges');
    }

    const refreshed = await res.json();

    if (!refreshed.success) {
      throw new Error(refreshed.message);
    }

    // Update global dashboard data
    userData = refreshed.data;

    // Refresh only affected sections
    updateBadgesSection(userData);
    updateStatsSection(userData);
    updateProgressBars(userData);

    console.log('Badges refreshed');

  } catch (err) {
    console.error('refreshBadges failed:', err);
  }
}


/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Refresh dashboard data
 */
async function refreshDashboard() {
  console.log('Refreshing dashboard...');
  await loadUser();
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadUser);
} else {
  loadUser();
}

// Export for use in other scripts
window.dashboardAPI = {
  refresh: refreshDashboard,
  getUserData: () => userData,
  isLoading: () => isLoading
};