const db = require("../models");

// Sequelize xətalarını daha insan dilində göstərmək üçün köməkçi funksiya.
function getUserValidationError(error) {
  // Əgər email təkrardırsa, bunu xüsusi mesajla deyirik.
  if (error.name === "SequelizeUniqueConstraintError") {
    return "This email is already being used.";
  }

  // Sequelize bəzən xətaları massiv içində saxlayır.
  // Birinci xətanı götürüb göstəririk.
  if (error.errors && error.errors.length > 0) {
    return error.errors[0].message;
  }

  // Heç biri yoxdursa, standart xəta mətnini qaytarırıq.
  return error.message;
}

// Bu funksiya yoxlayır ki, seçilən user sonuncu admin-dir ya yox.
// Niyə? Çünki sonuncu admini silsək, sistemdə admin qalmaya bilər.
async function isLastAdmin(userId) {
  const adminCount = await db.User.count({ where: { isAdmin: true } });
  const user = await db.User.findByPk(userId);

  return Boolean(user && user.isAdmin && adminCount === 1);
}

module.exports = {
  // Bütün user-ləri siyahı şəklində göstərir.
  async index(req, res) {
    // User-lərlə birlikdə onların project-lərini də gətiririk.
    const users = await db.User.findAll({
      order: [["id", "ASC"]],
      include: [
        {
          model: db.Project,
          as: "projects"
        }
      ]
    });

    res.render("users/index", {
      pageTitle: "Users",
      users
    });
  },

  // Yeni user yaratmaq səhifəsi.
  newForm(req, res) {
    res.render("users/new", { pageTitle: "Register" });
  },

  // Tək bir user-in profilini göstərir.
  async show(req, res) {
    // User-i project-ləri ilə birlikdə bazadan oxuyuruq.
    const user = await db.User.findByPk(req.params.id, {
      include: [
        {
          model: db.Project,
          as: "projects"
        }
      ]
    });

    // User tapılmazsa geri göndəririk.
    if (!user) {
      req.flash("danger", "User not found.");
      return res.redirect("/");
    }

    // Sadə user yalnız öz profilini görə bilər.
    // Admin isə hamını görə bilər.
    if (!req.currentUser.isAdmin && req.currentUser.id !== user.id) {
      req.flash("danger", "You cannot view that user.");
      return res.redirect("/");
    }

    res.render("users/show", {
      pageTitle: user.name,
      profileUser: user
    });
  },

  // Yeni user yaradır.
  async create(req, res) {
    const { name, email, password } = req.body;

    // Çox qısa parol qəbul etmirik.
    if (!password || password.length < 4) {
      req.flash("danger", "Password must have at least 4 characters.");
      return res.redirect("/users/new");
    }

    try {
      // Bazada neçə user olduğunu sayırıq.
      // Əgər bu ilk user-dirsə, onu admin edəcəyik.
      const usersCount = await db.User.count();
      const user = await db.User.create({
        name,
        email,
        // Parolu olduğu kimi yox, hash edilmiş şəkildə saxlayırıq.
        passwordHash: db.User.hashPassword(password),
        isAdmin: usersCount === 0
      });

      // Qeydiyyatdan sonra user-i avtomatik daxil etmiş sayırıq.
      req.session.userId = user.id;
      req.flash(
        "success",
        usersCount === 0
          ? "Account created. You are the first user, so you are also the admin."
          : "Account created successfully."
      );
      res.redirect(`/users/${user.id}`);
    } catch (error) {
      // Xətanı daha anlaşılan dilə çevirib göstəririk.
      req.flash("danger", getUserValidationError(error));
      res.redirect("/users/new");
    }
  },

  // User silir.
  async destroy(req, res) {
    const user = await db.User.findByPk(req.params.id);

    // Silinəcək user yoxdursa, xəbər veririk.
    if (!user) {
      req.flash("danger", "User not found.");
      return res.redirect("/users");
    }

    // İstifadəçi özünü silir, ya admin başqa user-i silir?
    const isSelfDelete = req.currentUser.id === user.id;
    const canDelete = req.currentUser.isAdmin || isSelfDelete;

    // Bu iki haldan biri deyilsə, icazə yoxdur.
    if (!canDelete) {
      req.flash("danger", "You cannot delete that user.");
      return res.redirect("/");
    }

    // Sonuncu admini silməyə icazə vermirik.
    if (await isLastAdmin(user.id)) {
      req.flash("danger", "You cannot delete the last admin.");
      return res.redirect("/users");
    }

    // User-i bazadan silirik.
    await user.destroy();

    // Əgər adam özünü silibsə, session da silinməlidir.
    if (isSelfDelete) {
      return req.session.destroy(() => {
        res.redirect("/");
      });
    }

    // Admin başqa user-i silibsə, users siyahısına qaytarırıq.
    req.flash("success", "User deleted successfully.");
    res.redirect("/users");
  },

  // User-i admin edir.
  async setAdmin(req, res) {
    const user = await db.User.findByPk(req.params.id);

    // Əvvəl user həqiqətən var ya yox, baxırıq.
    if (!user) {
      req.flash("danger", "User not found.");
      return res.redirect("/users");
    }

    // Admin düyməsini açırıq.
    user.isAdmin = true;
    await user.save();

    req.flash("success", `${user.name} is now an admin.`);
    res.redirect("/users");
  },

  // User-dən admin səlahiyyətini alır.
  async removeAdmin(req, res) {
    const user = await db.User.findByPk(req.params.id);

    // User tapılmadısa, davam etmirik.
    if (!user) {
      req.flash("danger", "User not found.");
      return res.redirect("/users");
    }

    // Sonuncu adminin adminliyini almaq olmaz.
    if (await isLastAdmin(user.id)) {
      req.flash("danger", "You cannot remove admin from the last admin.");
      return res.redirect("/users");
    }

    // Artıq bu user sadə user olur.
    user.isAdmin = false;
    await user.save();

    req.flash("success", `${user.name} is now a regular user.`);
    res.redirect("/users");
  }
};
