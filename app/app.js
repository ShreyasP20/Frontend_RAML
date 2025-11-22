const apkInput = document.getElementById("apk-input");
const generateBtn = document.getElementById("generate-btn");
const clearBtn = document.getElementById("clear-btn");
const reportsList = document.getElementById("reports-list");
const dropZone = document.getElementById('drop-zone');
const fileInfo = document.getElementById('file-info');
const browseBtn = document.getElementById('browse-btn');

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

const userAvatar = document.getElementById('user-avatar');
const avatarInitial = document.getElementById('avatar-initial');
const tooltipUsername = document.getElementById('tooltip-username');
const tooltipEmail = document.getElementById('tooltip-email');
const savedUser = localStorage.getItem("currentUser");
const currentUser = savedUser ? JSON.parse(savedUser) : null;

if (currentUser) {
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
} else {
    window.location.href = "../auth/login.html";
}
if (userAvatar && avatarInitial && tooltipUsername && tooltipEmail) {
    userAvatar.dataset.username = currentUser.username;
    userAvatar.dataset.email = currentUser.email;
    avatarInitial.textContent = currentUser.username.charAt(0).toUpperCase();
    tooltipUsername.textContent = currentUser.username;
    tooltipEmail.textContent = currentUser.email;
}

const API_URL = "http://localhost:8000/api/analysis/upload";


window.addEventListener("DOMContentLoaded", () => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
        const currentUser = JSON.parse(savedUser);

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
    }
});


async function uploadToBackend() {
    const file = apkInput.files[0];
    if (!file) {
        alert("Please upload an APK file.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    generateBtn.disabled = true;
    generateBtn.textContent = "Analyzing (RAML)...";

    const resp = await fetch(API_URL, {
        method: "POST",
        body: formData
    });

    if (!resp.ok) {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate PDF Report";
        throw new Error("Backend error: " + (await resp.text()));
    }

    const result = await resp.json();

    generateBtn.disabled = false;
    generateBtn.textContent = "Generate PDF Report";

    return {
        apkName: file.name,
        backendResult: result
    };
}

generateBtn.addEventListener("click", async () => {
    try {
        const data = await uploadToBackend();
        if (!data) return;

        const pdfBlob = await generatePdf({
            apkName: data.apkName,
            description: data.description,
            backendResult: data.backendResult
        });

        const dataUrl = await blobToDataURL(pdfBlob);

        const reports = loadReports();

        const id = Date.now().toString(36);
        const title = `Report: ${data.apkName} (${new Date().toLocaleString()})`;

        reports.push({
            id,
            title,
            date: new Date().toLocaleString(),
            apkName: data.apkName,
            backend: data.backendResult,
            dataUrl,
            filename: data.apkName.replace(".apk", "") + "-raml-report.pdf"
        });

        saveReports(reports);
        renderReports();

        alert("Analysis complete! PDF saved to dashboard.");

    } catch (err) {
        console.error(err);
        alert("Error: " + err.message);
    }
});

clearBtn.addEventListener("click", () => {
    apkInput.value = "";
    descriptionInput.value = "";
});

reportsList.addEventListener("click", (event) => {
    const id = event.target.dataset.id;
    if (!id) return;

    const reports = loadReports();
    const idx = reports.findIndex(r => r.id === id);
    if (idx === -1) return;

    if (event.target.classList.contains("download")) {
        downloadDataUrl(reports[idx].dataUrl, reports[idx].filename);
    } 
    else if (event.target.classList.contains("delete")) {
        if (!confirm("Delete this report?")) return;
        reports.splice(idx, 1);
        saveReports(reports);
        renderReports();
    }
});

/* Initial load */
renderReports();
