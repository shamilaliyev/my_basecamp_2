// Bu funksiya yoxlayır ki, istifadəçi daxil olub ya yox.
// Daxil olmayıbsa, onu sign-in səhifəsinə göndəririk.
function requireAuth(req, res, next) {
  if (!req.currentUser) {
    req.flash("danger", "Please sign in first.");
    return res.redirect("/sign-in");
  }

  next();
}

// Bu funksiya yoxlayır ki, istifadəçi admin-dir ya yox.
// Admin deyilsə, həmin işi görməyə icazə vermirik.
function requireAdmin(req, res, next) {
  if (!req.currentUser || !req.currentUser.isAdmin) {
    req.flash("danger", "Only admins can do that.");
    return res.redirect("/");
  }

  next();
}

// Başqa fayllar istifadə edə bilsin deyə export edirik.
module.exports = {
  requireAuth,
  requireAdmin
};
