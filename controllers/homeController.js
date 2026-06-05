module.exports = {
  // Ana səhifəni göstərən balaca funksiya.
  index(req, res) {
    res.render("home", { pageTitle: "Home" });
  }
};
