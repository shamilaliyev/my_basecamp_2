const db = require("../models");

module.exports = {
  // Sadəcə sign-in səhifəsini açırıq.
  newForm(req, res) {
    res.render("sessions/new", { pageTitle: "Sign In" });
  },

  // Bu funksiya istifadəçini daxil etməyə çalışır.
  async create(req, res) {
    // Formdan email və parolu götürürük.
    const { email, password } = req.body;

    try {
      // Email-ə görə user tapırıq.
      const user = await db.User.findOne({
        where: { email: (email || "").trim().toLowerCase() }
      });

      // User tapılmadısa və ya parol düz gəlmirsə, giriş alınmır.
      if (!user || !user.checkPassword(password || "")) {
        req.flash("danger", "Wrong email or password.");
        return res.redirect("/sign-in");
      }

      // Hər şey düzdürsə, həmin user-in id-sini session-a yazırıq.
      // Yəni sistem yadında saxlayır ki, bu adam daxil olub.
      req.session.userId = user.id;
      req.flash("success", `Welcome back, ${user.name}!`);
      res.redirect("/projects");
    } catch (error) {
      // Gözlənilməz xəta olsa, istifadəçiyə sadə mesaj göstəririk.
      req.flash("danger", error.message);
      res.redirect("/sign-in");
    }
  },

  // Bu funksiya istifadəçini sistemdən çıxarır.
  destroy(req, res) {
    // Session silinəndə artıq sistem onu daxil olmuş saymır.
    req.session.destroy(() => {
      res.redirect("/sign-in");
    });
  }
};
