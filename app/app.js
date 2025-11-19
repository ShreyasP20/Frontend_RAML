const apkInput = document.getElementById("apk-input");
const descriptionInput = document.getElementById("description");
const generateBtn = document.getElementById("generate-btn");
const clearBtn = document.getElementById("clear-btn");
const reportsList = document.getElementById("reports-list");

const API_URL = "http://localhost:8000/api/analysis/upload";

function predictBehaviorIDs(text) {
    text = text.toLowerCase();
    const ids = [];

    if (text.includes("sms") || text.includes("call") || text.includes("communication"))
        ids.push(2);

    if (text.includes("privacy") || text.includes("steal") || text.includes("contact"))
        ids.push(1);

    if (text.includes("bank") || text.includes("credential") || text.includes("overlay"))
        ids.push(4);

    if (text.includes("encrypt") || text.includes("ransom"))
        ids.push(5);

    if (text.includes("accessibility"))
        ids.push(6);

    if (text.includes("root") || text.includes("exploit"))
        ids.push(7);

    if (text.includes("ad") || text.includes("fraud"))
        ids.push(9);

    return ids.length ? ids : [1];
}

async function uploadToBackend() {
    const file = apkInput.files[0];
    const description = descriptionInput.value.trim();

    if (!file) {
        alert("Please upload an APK file.");
        return;
    }
    if (!description) {
        alert("Enter a description of the APK behavior.");
        return;
    }

    const behaviorIDs = predictBehaviorIDs(description).join(" ");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("behaviors", behaviorIDs);

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
        description,
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
