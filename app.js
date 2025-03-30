document.addEventListener("DOMContentLoaded", function () {
  // Gestion du toggle pour afficher/masquer les listes de contraintes
  document.querySelectorAll(".toggle-button").forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.getAttribute("data-target");
      const targetElement = document.getElementById(targetId);

      // Toggle l'affichage de la liste
      targetElement.classList.toggle("show");

      // Mise à jour de l'icône (▲ pour ouvert, ▼ pour fermé)
      const expandIcon = this.querySelector(".expand-icon");
      if (targetElement.classList.contains("show")) {
        expandIcon.textContent = "▲";
      } else {
        expandIcon.textContent = "▼";
      }
    });
  });
});

