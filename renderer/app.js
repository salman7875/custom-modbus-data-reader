// === renderer/app.js ===
let currentWeight = null;
let readingInterval = null;

async function readWeight() {
  const res = await window.api.readWeight();
  if (res.success) {
    currentWeight = res.weight;
    document.getElementById(
      "weightDisplay"
    ).innerText = `Weight: ${res.weight}`;
  } else {
    alert("Error: " + res.error);
  }
}

function startReading() {
  if (readingInterval) return;

  document.getElementById("startBtn").disabled = true;
  document.getElementById("stopBtn").disabled = false;

  readingInterval = setInterval(async () => {
    const res = await window.api.readWeight();
    if (res.success) {
      currentWeight = res.weight;
      document.getElementById(
        "weightDisplay"
      ).innerText = `Weight: ${res.weight}`;
    } else {
      console.error("Read error:", res.error);
    }
  }, 1000);
}

function stopReading() {
  if (readingInterval) {
    clearInterval(readingInterval);
    readingInterval = null;
    console.log("Stopped reading");

    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;
  }
}

document.getElementById("testForm").onsubmit = async (e) => {
  e.preventDefault();
  const data = {
    weight: currentWeight,
    tool_name: document.getElementById("toolName").value,
    part_no: document.getElementById("partNo").value,
    serial_no: document.getElementById("serialNo").value,
    location: document.getElementById("location").value,
    tested_by: document.getElementById("testedBy").value,
    certified_by: document.getElementById("certifiedBy").value,
    test_date: document.getElementById("testDate").value,
  };
  await window.api.saveTest(data);
  alert("Saved");
};

async function downloadPDF() {
  const data = {
    weight: currentWeight,
    tool_name: document.getElementById("toolName").value,
    part_no: document.getElementById("partNo").value,
    serial_no: document.getElementById("serialNo").value,
    location: document.getElementById("location").value,
    tested_by: document.getElementById("testedBy").value,
    certified_by: document.getElementById("certifiedBy").value,
    test_date: document.getElementById("testDate").value,
  };
  const res = await window.api.generateReport(data);
  if (res.success) alert("PDF saved to " + res.path);
}
