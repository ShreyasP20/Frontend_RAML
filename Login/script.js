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

const API_URL = "http://127.0.0.1:8000/api"; 

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  console.log("Register form found");
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value.trim();

    if (!username || !password) {
      alert("Please fill all fields!");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
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
      alert("Please enter both username and password!");
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
        alert("✅ Login successful!");
        window.location.href = "../app/index.html";
      } else {
        alert(`⚠️ ${data.detail || "Invalid credentials."}`);
      }
    } catch (err) {
      alert("❌ Error connecting to the server.");
      console.error(err);
    }
  });
}
