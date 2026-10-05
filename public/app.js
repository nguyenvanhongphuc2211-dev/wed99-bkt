const authSection = document.querySelector("#auth-section");
const feedSection = document.querySelector("#feed-section");
const userBox = document.querySelector("#user-box");
const currentUser = document.querySelector("#current-user");
const postList = document.querySelector("#post-list");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");

const state = {
  apiKey: localStorage.getItem("apiKey") || "",
  user: JSON.parse(localStorage.getItem("user") || "null"),
};

const withApiKey = (path) => {
  if (!state.apiKey) {
    return path;
  }
  const join = path.includes("?") ? "&" : "?";
  return `${path}${join}apiKey=${encodeURIComponent(state.apiKey)}`;
};

const api = async (path, options = {}) => {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Có lỗi xảy ra");
  }
  return data;
};

const formatTime = (value) => {
  return new Date(value).toLocaleString("vi-VN");
};

const setSession = (apiKey, user) => {
  state.apiKey = apiKey;
  state.user = user;
  localStorage.setItem("apiKey", apiKey);
  localStorage.setItem("user", JSON.stringify(user));
  render();
};

const clearSession = () => {
  state.apiKey = "";
  state.user = null;
  localStorage.removeItem("apiKey");
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  render();
};

const renderPosts = (posts) => {
  if (!posts.length) {
    postList.innerHTML = `<p class="empty">Chưa có bài viết nào.</p>`;
    return;
  }

  postList.innerHTML = posts
    .map((post) => {
      const mine = state.user && post.userId === state.user._id;
      const actions = mine
        ? `<div class="actions">
            <button type="button" data-edit="${post._id}">Sửa</button>
            <button type="button" data-delete="${post._id}">Xóa</button>
          </div>`
        : "";

      return `<article class="post" data-id="${post._id}">
        <div class="post-head">
          <span class="author">${post.userName}</span>
          <span class="time">${formatTime(post.createdAt)}</span>
        </div>
        <p class="content">${escapeHtml(post.content)}</p>
        ${actions}
      </article>`;
    })
    .join("");
};

const escapeHtml = (text) => {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
};

const loadPosts = async () => {
  const data = await api("/posts");
  renderPosts(data.posts);
};

const render = async () => {
  const loggedIn = Boolean(state.apiKey && state.user);
  authSection.hidden = loggedIn;
  feedSection.hidden = !loggedIn;
  userBox.hidden = !loggedIn;

  if (!loggedIn) {
    return;
  }

  currentUser.textContent = state.user.userName;
  try {
    await loadPosts();
  } catch (error) {
    if (error.message.includes("apiKey")) {
      clearSession();
    }
  }
};

document.querySelector("#tab-login").addEventListener("click", () => {
  loginForm.hidden = false;
  registerForm.hidden = true;
  document.querySelector("#tab-login").classList.add("active");
  document.querySelector("#tab-register").classList.remove("active");
});

document.querySelector("#tab-register").addEventListener("click", () => {
  loginForm.hidden = true;
  registerForm.hidden = false;
  document.querySelector("#tab-register").classList.add("active");
  document.querySelector("#tab-login").classList.remove("active");
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.querySelector("#login-error");
  error.textContent = "";
  const form = new FormData(loginForm);

  try {
    const data = await api("/users/login", {
      method: "POST",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    loginForm.reset();
    setSession(data.apiKey, data.user);
  } catch (err) {
    error.textContent = err.message;
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.querySelector("#register-error");
  error.textContent = "";
  const form = new FormData(registerForm);

  try {
    await api("/users/register", {
      method: "POST",
      body: JSON.stringify({
        userName: form.get("userName"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await api("/users/login", {
      method: "POST",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    registerForm.reset();
    setSession(data.apiKey, data.user);
  } catch (err) {
    error.textContent = err.message;
  }
});

document.querySelector("#logout-btn").addEventListener("click", clearSession);

document.querySelector("#post-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.querySelector("#post-error");
  error.textContent = "";
  const form = new FormData(event.currentTarget);

  try {
    await api(withApiKey("/posts"), {
      method: "POST",
      body: JSON.stringify({
        userId: state.user._id,
        content: form.get("content"),
      }),
    });
    event.currentTarget.reset();
    await loadPosts();
  } catch (err) {
    error.textContent = err.message;
  }
});

postList.addEventListener("click", async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  const saveId = event.target.dataset.save;
  const cancelId = event.target.dataset.cancel;

  try {
  if (deleteId) {
    await api(withApiKey(`/posts/${deleteId}`), { method: "DELETE" });
    await loadPosts();
    return;
  }

  if (editId) {
    const article = postList.querySelector(`[data-id="${editId}"]`);
    const content = article.querySelector(".content").textContent;
    article.querySelector(".content").outerHTML = `<textarea class="edit-content" rows="3">${escapeHtml(content)}</textarea>`;
    article.querySelector(".actions").innerHTML = `
      <button type="button" data-save="${editId}">Lưu</button>
      <button type="button" data-cancel="${editId}">Hủy</button>`;
    return;
  }

  if (cancelId) {
    await loadPosts();
    return;
  }

  if (saveId) {
    const article = postList.querySelector(`[data-id="${saveId}"]`);
    const content = article.querySelector(".edit-content").value;
    await api(withApiKey(`/posts/${saveId}`), {
      method: "PUT",
      body: JSON.stringify({ content }),
    });
    await loadPosts();
  }
  } catch (err) {
    document.querySelector("#post-error").textContent = err.message;
  }
});

render();
