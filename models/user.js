const crypto = require("crypto");

// Bu funksiya User modelini yaradır.
// Model o deməkdir ki, bazadakı "users" cədvəlinin qaydalarını burada yazırıq.
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      // İstifadəçinin adı boş qala bilməz.
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: { msg: "Name is required." }
        }
      },
      // Email həm boş ola bilməz, həm də təkrarlana bilməz.
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: "Email is required." },
          isEmail: { msg: "Email format is not valid." }
        }
      },
      // Biz parolu olduğu kimi saxlamırıq.
      // Onun gizlədilmiş versiyasını saxlayırıq.
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
      },
      // Bu adam admin-dir ya yox?
      isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: "users",
      hooks: {
        // Hook o deməkdir ki, müəyyən iş bazaya yazılmadan əvvəl avtomatik baş verir.
        // Burada email-i səliqəyə salırıq ki, boşluq və böyük-kiçik hərf problemi olmasın.
        beforeValidate(user) {
          if (user.email) {
            user.email = user.email.trim().toLowerCase();
          }
        }
      }
    }
  );

  // Bu köməkçi funksiya parolu SHA-256 ilə hash edir.
  // Sadə dillə: parolu gizli qarışıq bir mətnə çevirir.
  User.hashPassword = (password) =>
    crypto.createHash("sha256").update(password).digest("hex");

  // Bu funksiya istifadəçinin yazdığı parolu yoxlayır.
  // Yazılan parolu da hash edib bazadakı ilə müqayisə edirik.
  User.prototype.checkPassword = function checkPassword(password) {
    return this.passwordHash === User.hashPassword(password);
  };

  // Hazır User modelini geri qaytarırıq.
  return User;
};
