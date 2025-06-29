const Modbus = require("jsmodbus");
const net = require("net");

const server = new net.Server();
const holdingRegisters = Buffer.alloc(100); // Reserve 100 registers (2 bytes each)

const modbusServer = new Modbus.server.TCP(server, {
  holding: holdingRegisters,
});

// Set some sample weight value every second
let weight = 100;
setInterval(() => {
  holdingRegisters.writeUInt16BE(weight, 0); // 0th register
  weight += 1;
}, 1000);

server.listen(8502, () => {
  console.log("✅ Mock Modbus TCP server running on port 8502");
});
