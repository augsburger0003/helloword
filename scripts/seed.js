const { seedDemoData } = require("../src/seed");

const result = seedDemoData();
if (!result.enabled) {
  console.error("Seed bloqueado: defina DASHBOARDIA_DEMO_MODE=true.");
  process.exitCode = 1;
} else {
  console.log(result.created ? "Dados demonstrativos criados." : "Dados demonstrativos já existentes.");
}