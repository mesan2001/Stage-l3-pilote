
document.addEventListener("DOMContentLoaded", function () {
  // Gestion du toggle pour afficher/masquer les listes de contraintes
  document.querySelectorAll(".toggle-button").forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const targetElement = document.getElementById(targetId);

      // Toggle la classe 'show'
      targetElement.classList.toggle("show");

      // Mise à jour de l'icône (▲ pour ouvert, ▼ pour fermé)
      const expandIcon = this.querySelector(".expand-icon");
      if (targetElement.classList.contains("show")) {
        expandIcon.textContent = "▼"; // Icône fermée
      } else {
        expandIcon.textContent = "▲"; // Icône ouverte
      }
    });
  });
});
