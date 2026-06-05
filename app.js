const express = require("express");
const path = require("path");
const session = require("express-session");
const methodOverride = require("method-override");
const db = require("./models");


const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs"); // Burada deyirik ki, HTML səhifələrini EJS ilə düzəldəcəyik.

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true })); // Formdan gələn məlumatları oxumaq üçün bunu açırıq.

// HTML formaları birbaşa PUT və DELETE göndərə bilmir.
// Ona görə bu köməkçi ilə POST içindən PUT/DELETE kimi davranırıq.
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public"))); // CSS kimi statik faylları buradan göstəririk.


// Session o deməkdir ki, istifadəçi daxil olanda onu "yada saxlayırıq".
// Beləliklə səhifə dəyişsə də sistem bilir ki, bu adam kimdir.
app.use(
  session({
    secret: "my-basecamp-secret",
    resave: false,
    saveUninitialized: false
  })
);

// Bu orta qat hər sorğudan əvvəl işləyir.
// Burada iki vacib iş görürük:
// 1. flash mesajı hazırlayırıq
// 2. hazırkı daxil olmuş istifadəçini tapırıq
app.use(async (req, res, next) => {
  try {
    // Əvvəlki səhifədən gələn balaca xəbərdarlıq və ya uğur mesajını götürürük.
    res.locals.flash = req.session.flash || null;
    delete req.session.flash;

    // Başlanğıcda heç kimi daxil olmuş saymırıq.
    req.currentUser = null;
    res.locals.currentUser = null;

    // Əgər session-da userId varsa, deməli bu adam əvvəl daxil olub.
    if (req.session.userId) {
      // Verilənlər bazasından həmin istifadəçini tapırıq.
      const user = await db.User.findByPk(req.session.userId);

      if (user) {
        // İstifadəçi tapıldısa, həm backend, həm də view üçün hazır saxlayırıq.
        req.currentUser = user;
        res.locals.currentUser = user;
      } else {
        // Session-da user var idi, amma bazada artıq yoxdur.
        // Onda köhnə session məlumatını silirik.
        delete req.session.userId;
      }
    }

    // Flash mesaj yaratmaq üçün balaca köməkçi funksiya.
    // Məsələn: req.flash("success", "Hər şey yaxşı oldu")
    req.flash = (type, message) => {
      req.session.flash = { type, message };
    };

    next();
  } catch (error) {
    next(error);
  }
});

// Bütün route-ları ayrıca qovluqdan qoşuruq ki, kod səliqəli qalsın.
app.use("/", require("./routes"));

// Əgər heç bir route uyğun gəlməzsə, bu 404 səhifəsi işləyəcək.
app.use((req, res) => {
  res.status(404).render("not-found", { pageTitle: "Page Not Found" });
});

// Əgər sistemdə xəta olsa, istifadəçiyə sərt texniki yazı yox, sadə bir xəta səhifəsi göstəririk.
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).render("error", {
    pageTitle: "Server Error",
    errorMessage: "Something went wrong. Please try again."
  });
});

// Əvvəlcə verilənlər bazasını hazır vəziyyətə gətiririk.
// Sonra serveri başladırıq.
db.sequelize
  .sync()
  .then(() => {
    // Burada server işə düşür və brauzerdən daxil olmaq olur.
    app.listen(PORT, () => {
      console.log(`My Basecamp app is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    // Əgər baza açılmasa, səbəbi terminalda göstəririk.
    console.error("Database setup failed:", error);
  });
