// Update timestamp
document.getElementById('timestamp').textContent =
  `Last updated: ${new Date().toLocaleString()}`;

// Check for tokens in URL params (Redirect flow)
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('accessToken');
const error = urlParams.get('error');
const userName = urlParams.get('uName');

if (accessToken) {
  // Visual feedback
  const statusBadge = document.querySelector('.status-badge');
  if (statusBadge) {
    statusBadge.style.background = 'oklch(0.6 0.15 145)'; // Greener
    statusBadge.innerHTML = `
      <span class="status-indicator"></span>
      <span>Signed in as ${userName || 'User'}</span>
    `;
  }

  // Optional: Store token
  localStorage.setItem('accessToken', accessToken);

  // Clean URL
  window.history.replaceState({}, document.title, window.location.pathname);
} else if (error) {
  // alert('Google Sign-In failed: ' + error); // User previously removed console.error, alert is fine but maybe they want it cleaner
  window.history.replaceState({}, document.title, window.location.pathname);
}

// Version Display Logic (Static)
// data is now hardcoded in index.html
