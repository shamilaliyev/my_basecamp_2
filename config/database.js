const fs = require("fs");
const os = require("os");
const path = require("path");
const { Sequelize } = require("sequelize");

// Normal halda baza faylını layihənin içində saxlamaq istəyirik.
const projectStorage = path.join(__dirname, "..", "data", "database.sqlite");
// Təhlükəsiz ehtiyat kimi sistemin temp qovluğunu da hazırlayırıq.
const tempStorage = path.join(os.tmpdir(), "my-basecamp-sabis", "database.sqlite");

// Əgər layihə OneDrive içindədirsə, temp qovluğu seçilir.
const storage = projectStorage.includes("OneDrive") ? tempStorage : projectStorage; //bunu ozum qoymusam ama silmede

// Baza faylının yerləşəcəyi qovluq yoxdursa, yaradırıq.
fs.mkdirSync(path.dirname(storage), { recursive: true });

// Burada Sequelize obyektini yaradırıq.
// Sequelize ORM-dir, yəni SQL yazmadan obyekt kimi işləməyə kömək edir.
module.exports = new Sequelize({
  dialect: "sqlite",
  storage,
  logging: false
});
