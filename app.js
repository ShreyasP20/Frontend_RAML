const apkInput = document.getElementById("apk-input");
const descriptionInput = document.getElementById("description");
const generateBtn = document.getElementById("generate-btn");
const clearBtn = document.getElementById("clear-btn");
const reportsList = document.getElementById("reports-list");
const dropZone = document.getElementById('drop-zone');
const fileInfo = document.getElementById('file-info');
const browseBtn = document.getElementById('browse-btn');

const API_URL = "http://localhost:8000/api/analysis/upload";
const REPORTS_API_URL = "http://localhost:8000/api/analysis/reports";
const USER_API_URL = "http://localhost:8000/api/user";

let currentUser = null;


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

async function verifyToken() {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return false;
  }

  if (isTokenExpired(accessToken)) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      clearTokens();
      return false;
    }
  }

  return true;
}


async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const res = await fetch(`${USER_API_URL}/refresh`, {
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
      window.location.href = "../Login/login.html";
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


function logout() {
  clearTokens();
  window.location.href = "../Login/login.html";
}


function updateFileInfo(file) {
    if (!fileInfo) return;
    fileInfo.hidden = false;
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    fileInfo.textContent = `${file.name} • ${sizeMB} MB`;
}

if (dropZone && apkInput) {
    dropZone.addEventListener('click', (e) => {
        apkInput.click();
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length) {
            try {
                const dt = new DataTransfer();
                dt.items.add(files[0]);
                apkInput.files = dt.files;
            } catch (err) {
                console.warn('Could not set input.files programmatically', err);
            }
            updateFileInfo(files[0]);
        }
    });

    apkInput.addEventListener('change', (e) => {
        if (apkInput.files && apkInput.files[0]) updateFileInfo(apkInput.files[0]);
    });
}


window.addEventListener("DOMContentLoaded", async () => {
    const tokenValid = await verifyToken();
    if (!tokenValid) {
        window.location.href = "../Login/login.html";
        return;
    }

    const savedUser = localStorage.getItem("currentUser");
    if (!savedUser) {
        window.location.href = "../Login/login.html";
        return;
    }
    
    currentUser = JSON.parse(savedUser);

    const userAvatar = document.getElementById('user-avatar');
    const avatarInitial = document.getElementById('avatar-initial');
    const tooltipUsername = document.getElementById('tooltip-username');
    const tooltipEmail = document.getElementById('tooltip-email');

    if (userAvatar && avatarInitial && tooltipUsername && tooltipEmail) {
        userAvatar.dataset.username = currentUser.username;
        userAvatar.dataset.email = currentUser.email;
        avatarInitial.textContent = currentUser.username.charAt(0).toUpperCase();
        tooltipUsername.textContent = currentUser.username;
        tooltipEmail.textContent = currentUser.email;
    }
    
    // Fetch and display reports
    await fetchAndDisplayReports();
    
    // Poll for updated status every 3 seconds
    setInterval(fetchAndDisplayReports, 3000);
});


async function fetchAndDisplayReports() {
    if (!currentUser) return;
    
    try {
        const resp = await authenticatedFetch(`${REPORTS_API_URL}/${currentUser.email}`);
        if (!resp || !resp.ok) {
            console.error("Failed to fetch reports");
            return;
        }
        
        const reports = await resp.json();
        renderReportsFromBackend(reports);
    } catch (err) {
        console.error("Error fetching reports:", err);
    }
}

function renderReportsFromBackend(reports) {
    if (!reports || reports.length === 0) {
        reportsList.innerHTML = "No reports yet.";
        return;
    }

    reportsList.innerHTML = reports.map(report => {
        const date = new Date(report.created_at).toLocaleString();
        const statusClass = `status-${report.status.toLowerCase().replace(" ", "-")}`;
        
        return `
            <div class="report-item" data-id="${report.id}">
                <div class="report-header">
                    <h3>${report.apk_filename}</h3>
                    <span class="status ${statusClass}">${report.status}</span>
                </div>
                <div class="report-meta">
                    <p><strong>Uploaded:</strong> ${date}</p>
                    <p><strong>Task ID:</strong> <code>${report.task_id}</code></p>
                </div>
                <div class="report-actions">
                    ${report.status === "Completed" ? `<button class="download" data-id="${report.id}">Download PDF</button>` : ''}
                    <button class="delete" data-id="${report.id}">Delete</button>
                </div>
            </div>
        `;
    }).join("");
}

async function uploadToBackend() {
    const file = apkInput.files[0];

    if (!file) {
        alert("Please upload an APK file.");
        return;
    }

    if (!currentUser) {
        alert("User not logged in");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_email", currentUser.email);

    generateBtn.disabled = true;
    generateBtn.textContent = "Analyzing (RAML)...";

    try {
        const resp = await authenticatedFetch(API_URL, {
            method: "POST",
            body: formData
        });

        if (!resp || !resp.ok) {
            generateBtn.disabled = false;
            generateBtn.textContent = "Generate PDF Report";
            throw new Error("Backend error: " + (await resp.text()));
        }

        const result = await resp.json();

        generateBtn.disabled = false;
        generateBtn.textContent = "Generate PDF Report";
        
        apkInput.value = "";
        
        // Refresh reports immediately
        await fetchAndDisplayReports();

        return result;
    } catch (err) {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate PDF Report";
        throw err;
    }
}

generateBtn.addEventListener("click", async () => {
    try {
        const data = await uploadToBackend();
        if (data) {
            alert("APK uploaded! Analysis started. Reports will appear in the dashboard.");
        }
    } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
    }
});

clearBtn.addEventListener("click", () => {
    apkInput.value = "";
    fileInfo.hidden = true;
    if (descriptionInput) descriptionInput.value = "";
});

reportsList.addEventListener("click", async (event) => {
    const id = event.target.dataset.id;
    if (!id) return;

    if (event.target.classList.contains("download")) {
        // TODO: Implement PDF download from backend (markdown conversion)
        alert("PDF download coming soon!");
    } 
    else if (event.target.classList.contains("delete")) {
        if (!confirm("Delete this report?")) return;
        try {
            // TODO: Add DELETE endpoint to backend for report deletion
            alert("Report deletion coming soon!");
        } catch (err) {
            console.error("Error deleting report:", err);
        }
    }
});

