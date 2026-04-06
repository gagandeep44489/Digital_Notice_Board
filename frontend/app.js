const API_BASE_URL = `${window.location.origin}/api`;
const TOKEN_KEY = 'dnb_admin_token';
const page = document.body.dataset.page;

const formatDate = (dateInput) => {
  const date = new Date(dateInput);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
};

const getToken = () => localStorage.getItem(TOKEN_KEY);

const createNoticeCard = (notice, isAdmin = false) => {
  const card = document.createElement('article');
  card.className = `notice-card ${notice.priority === 'High' ? 'high' : ''}`;
  card.dataset.notice = JSON.stringify(notice);
  card.innerHTML = `
    <h3>${notice.title}</h3>
    <p>${notice.description}</p>
    <p class="notice-meta"><strong>Category:</strong> ${notice.category}</p>
    <p class="notice-meta"><strong>Priority:</strong> ${notice.priority}</p>
    <p class="notice-meta"><strong>Created:</strong> ${formatDate(notice.createdAt)}</p>
    <p class="notice-meta"><strong>Expires:</strong> ${formatDate(notice.expiryDate)}</p>
  `;

  if (isAdmin) {
    const actions = document.createElement('div');
    actions.className = 'form-actions';
    actions.innerHTML = `
      <button class="btn secondary" data-action="edit" data-id="${notice._id}">Edit</button>
      <button class="btn danger" data-action="delete" data-id="${notice._id}">Delete</button>
    `;
    card.append(actions);
  }

  return card;
};

const fetchNotices = async (keyword = '', category = '') => {
  const query = new URLSearchParams();
  if (keyword) query.append('keyword', keyword);
  if (category) query.append('category', category);

  const res = await fetch(`${API_BASE_URL}/notices?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch notices');
  return res.json();
};

const populateCategories = (selectNode, notices) => {
  const previous = selectNode.value;
  const categories = [...new Set(notices.map((item) => item.category))];
  selectNode.innerHTML = '<option value="">All Categories</option>';
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    selectNode.appendChild(option);
  });

  if (previous && categories.includes(previous)) {
    selectNode.value = previous;
  }
};

const initPublicPage = () => {
  const noticeList = document.getElementById('noticeList');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const tickerText = document.getElementById('tickerText');
  const fullscreenBtn = document.getElementById('fullscreenBtn');

  let debounceTimer;

  const loadPublicNotices = async () => {
    try {
      const notices = await fetchNotices(searchInput.value.trim(), categoryFilter.value);
      noticeList.innerHTML = '';

      if (!notices.length) {
        noticeList.innerHTML = '<p>No active notices found.</p>';
        tickerText.textContent = 'No latest notice available right now.';
        return;
      }

      notices.forEach((notice) => noticeList.appendChild(createNoticeCard(notice)));
      populateCategories(categoryFilter, notices);
      const latest = notices[0];
      tickerText.textContent = `${latest.title} — ${latest.description}`;
    } catch (error) {
      noticeList.innerHTML = '<p>Unable to load notices.</p>';
    }
  };

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadPublicNotices, 300);
  });
  categoryFilter.addEventListener('change', loadPublicNotices);

  fullscreenBtn.addEventListener('click', async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }
    await document.exitFullscreen();
  });

  const socket = io(window.location.origin);
  socket.on('notice_updated', loadPublicNotices);

  loadPublicNotices();
  setInterval(loadPublicNotices, 10000);
};

const initLoginPage = () => {
  const loginForm = document.getElementById('loginForm');
  const messageNode = document.getElementById('loginMessage');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      window.location.href = 'dashboard.html';
    } catch (error) {
      messageNode.textContent = error.message;
      messageNode.style.color = '#d62828';
    }
  });
};

const initDashboardPage = () => {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const noticeForm = document.getElementById('noticeForm');
  const adminNoticeList = document.getElementById('adminNoticeList');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const formTitle = document.getElementById('formTitle');

  const resetForm = () => {
    noticeForm.reset();
    document.getElementById('noticeId').value = '';
    cancelEditBtn.classList.add('hidden');
    formTitle.textContent = 'Create Notice';
  };

  const loadAdminNotices = async () => {
    try {
      const notices = await fetchNotices();
      adminNoticeList.innerHTML = '';
      if (!notices.length) {
        adminNoticeList.innerHTML = '<p>No notices created yet.</p>';
        return;
      }

      notices.forEach((notice) => adminNoticeList.appendChild(createNoticeCard(notice, true)));
    } catch (error) {
      adminNoticeList.innerHTML = '<p>Unable to load notices.</p>';
    }
  };

  noticeForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const noticeId = document.getElementById('noticeId').value;
    const payload = {
      title: document.getElementById('title').value.trim(),
      description: document.getElementById('description').value.trim(),
      category: document.getElementById('category').value.trim(),
      priority: document.getElementById('priority').value,
      expiryDate: document.getElementById('expiryDate').value
    };

    const url = noticeId ? `${API_BASE_URL}/notices/${noticeId}` : `${API_BASE_URL}/notices`;
    const method = noticeId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      alert(errorPayload.message || 'Unable to save notice.');
      return;
    }

    resetForm();
    loadAdminNotices();
  });

  adminNoticeList.addEventListener('click', async (event) => {
    const target = event.target;
    const action = target.dataset.action;
    const id = target.dataset.id;

    if (!action || !id) {
      return;
    }

    if (action === 'delete') {
      const response = await fetch(`${API_BASE_URL}/notices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        alert(errorPayload.message || 'Unable to delete notice.');
        return;
      }

      loadAdminNotices();
      return;
    }

    const card = target.closest('.notice-card');
    const notice = JSON.parse(card.dataset.notice);

    document.getElementById('noticeId').value = id;
    document.getElementById('title').value = notice.title || '';
    document.getElementById('description').value = notice.description || '';
    document.getElementById('category').value = notice.category || '';
    document.getElementById('priority').value = notice.priority || 'Low';
    document.getElementById('expiryDate').value = notice.expiryDate ? notice.expiryDate.split('T')[0] : '';

    cancelEditBtn.classList.remove('hidden');
    formTitle.textContent = 'Edit Notice';
  });

  cancelEditBtn.addEventListener('click', resetForm);

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = 'login.html';
  });

  const socket = io(window.location.origin);
  socket.on('notice_updated', loadAdminNotices);

  loadAdminNotices();
};

if (page === 'public') {
  initPublicPage();
}

if (page === 'login') {
  initLoginPage();
}

if (page === 'dashboard') {
  initDashboardPage();
}
