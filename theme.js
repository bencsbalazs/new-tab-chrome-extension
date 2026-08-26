(function () {
  const savedTheme = localStorage.getItem("bookmarks-theme") || "chrome";
  document.documentElement.setAttribute("data-theme", savedTheme);
  const bsTheme =
    savedTheme === "light" || savedTheme === "chrome" ? "light" : "dark";
  document.documentElement.setAttribute("data-bs-theme", bsTheme);
})();
