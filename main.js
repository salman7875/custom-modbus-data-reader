const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const ModbusRTU = require("modbus-serial");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const PDFDocument = require("pdfkit");

let win;
const db = new sqlite3.Database("data.db");
const client = new ModbusRTU();

const USE_MOCK = true; // Set to false when using real hardware

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  win.loadFile("renderer/index.html");
}

app.whenReady().then(() => {
  setupDB();
  createWindow();
});

function setupDB() {
  db.run(`CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weight REAL,
    tool_name TEXT,
    part_no TEXT,
    serial_no TEXT,
    location TEXT,
    tested_by TEXT,
    certified_by TEXT,
    test_date TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
}

ipcMain.handle("modbus:read", async () => {
  try {
    console.log(client);

    if (!client.isOpen) {
      if (USE_MOCK) {
        await client.connectTCP("127.0.0.1", { port: 8502 });
      } else {
        await client.connectRTUBuffered("/dev/ttyUSB0", { baudRate: 9600 });
      }
    }
    client.setID(1);
    const data = await client.readHoldingRegisters(0, 2);
    const weight = data.buffer.readInt32BE(0);
    console.log("Raw Buffer:", data.buffer);

    // Try both endian options
    const bigEndian = data.buffer.readInt32BE(0);
    const littleEndian = data.buffer.readInt32LE(0);
    console.log("Big Endian:", bigEndian, " | Little Endian:", littleEndian, '🎉', weight);

    return { success: true, weight };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle("db:save", (e, test) => {
  const stmt = `INSERT INTO tests (weight, tool_name, part_no, serial_no, location, tested_by, certified_by, test_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(
    stmt,
    [
      test.weight,
      test.tool_name,
      test.part_no,
      test.serial_no,
      test.location,
      test.tested_by,
      test.certified_by,
      test.test_date,
    ],
    function (err) {
      if (err) {
        console.error(err);
        return { success: false, error: err.message };
      }
    }
  );
  return { success: true };
});

ipcMain.handle("report:generate", async (e, test) => {
  const doc = new PDFDocument();
  const filePath = path.join(
    app.getPath("downloads"),
    `test-report-${Date.now()}.pdf`
  );
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text("Test Report", { align: "center" });
  doc.moveDown();
  Object.entries(test).forEach(([k, v]) => {
    doc.fontSize(12).text(`${k}: ${v}`);
  });

  doc.end();
  return { success: true, path: filePath };
});
