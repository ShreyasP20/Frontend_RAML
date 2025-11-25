const wrapper = document.querySelector('.wrapper');
const loginlink = document.querySelector('.login-link');
const registerlink = document.querySelector('.register-link');
const btnpopup = document.querySelector('.btnLogin-popup');
const iconclose = document.querySelector('.icon-close');

registerlink.addEventListener('click', () => {
  wrapper.classList.add('active');
});

loginlink.addEventListener('click', () => {
  wrapper.classList.remove('active');
});

btnpopup.addEventListener('click', () => {
  wrapper.classList.add('active-popup');
});

iconclose.addEventListener('click', () => {
  wrapper.classList.remove('active-popup');
});

const API_URL = API.USER;


function storeTokens(accessToken, refreshToken) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

function getAccessToken() {
  return localStorage.getItem("accessToken");
}


function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}


function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("currentUser");
}


function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expTime = payload.exp * 1000;
    return Date.now() >= expTime;
  } catch (err) {
    return true;
  }
}


async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const res = await fetch(`${API_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("accessToken", data.access_token);
      return true;
    } else {
      clearTokens();
      return false;
    }
  } catch (err) {
    console.error("Error refreshing token:", err);
    return false;
  }
}


async function authenticatedFetch(url, options = {}) {
  let accessToken = getAccessToken();

  if (accessToken && isTokenExpired(accessToken)) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      window.location.href = "/Frontend_RAML/Frontend_RAML/login.html";
      return null;
    }
    accessToken = getAccessToken();
  }


  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${accessToken}`,
  };

  return fetch(url, { ...options, headers });
}



const registerForm = document.getElementById("registerForm");
if (registerForm) {
  console.log("Register form found");
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value.trim();
    const email = document.getElementById("registerEmail").value.trim();

    if (!username || !password || !email) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password}),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Registration successful!");
        wrapper.classList.remove("active"); 
      } else {
        alert(`⚠️ ${data.detail || "Registration failed."}`);
      }
    } catch (err) {
      alert("❌ Error connecting to the server.");
      console.error(err);
    }
  });
}


const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!username || !password) {
      alert("Please enter both username/email and password!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        storeTokens(data.access_token, data.refresh_token);
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        alert("✅ Login successful!");
        window.location.href = "/Frontend_RAML/Frontend_RAML/index.html";
      } else {
        alert(`⚠️ ${data.detail || "Invalid credentials."}`);
      }
    } catch (err) {
      alert("❌ Error connecting to the server.");
      console.error(err);
    }
  });
}


function logout() {
  clearTokens();
  window.location.href = "/Frontend_RAML/Frontend_RAML/login.html";
}
