const timestampElement = document.getElementById('timestamp');
if (timestampElement) {
  timestampElement.textContent = `Last updated: ${new Date().toLocaleString()}`;
}

const versionElement = document.getElementById('app-version');
if (versionElement) {
  fetch('/api/version')
    .then((res) => res.json())
    .then((data) => {
      versionElement.textContent = `v${data.version}`;
    })
    .catch(() => {
      versionElement.textContent = 'v1.3.2 (fallback)';
    });
}

(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');
  const userName = urlParams.get('uName');

  if (code) {
    try {
      const res = await fetch(`/api/auth/token-exchange?code=${code}`);
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        const statusBadge = document.querySelector('.status-badge');
        if (statusBadge) {
          statusBadge.style.background = 'oklch(0.6 0.15 145)';
          statusBadge.innerHTML = '';
          const indicatorSpan = document.createElement('span');
          indicatorSpan.className = 'status-indicator';
          const textSpan = document.createElement('span');
          textSpan.textContent = 'Signed in as ' + (userName || 'User');
          statusBadge.appendChild(indicatorSpan);
          statusBadge.appendChild(textSpan);
        }
      }
    } catch {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } else if (error) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
})();
