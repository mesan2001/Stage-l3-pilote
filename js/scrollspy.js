document.addEventListener("DOMContentLoaded", function() {
    //initialisation de scrollspy pour la navigation principale
    const navbarTabs = document.querySelector("#navbar-tabs");
    
    if (navbarTabs) {
      // gestion des clics sur les liens du menu de navigation
      const navLinks = navbarTabs.querySelectorAll(".nav-link");
      
      navLinks.forEach(link => {
        link.addEventListener("click", function(e) {
          e.preventDefault();
          
          // retirer la classe active de tous les liens
          navLinks.forEach(item => item.classList.remove("active"));
          
          //ajouter la classe active au lien cliqué
          this.classList.add("active");
          
          //obtenir l'ID de la cible
          const targetId = this.getAttribute("href");
          const targetElement = document.querySelector(targetId);
          
          if (targetElement) {
            // calculer la position de défilement avec un offset pour la barre de navigation
            const navbarHeight = navbarTabs.offsetHeight;
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;
            
            // scroll en douceur vers la section ciblée
            window.scrollTo({
              top: targetPosition,
              behavior: "smooth"
            });
          }
        });
      });
      
      // Fonction pour mettre à jour la navigation active lors du défilement
      function updateActiveNav() {
        const scrollPosition = window.scrollY + navbarTabs.offsetHeight + 50;
        
        // vérifier quelle section est visible
        const sections = document.querySelectorAll("section.card");
        
        sections.forEach(section => {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          
          if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            const targetId = "#" + section.id;
            
            // mettre à jour l'onglet actif
            navLinks.forEach(link => {
              if (link.getAttribute("href") === targetId) {
                link.classList.add("active");
              } else {
                link.classList.remove("active");
              }
            });
          }
        });
      }
      
      // Mettre à jour la navigation active lors du défilement
      window.addEventListener("scroll", updateActiveNav);
      
      // initialiser la navigation active au chargement
      updateActiveNav();
    }
    
    // Initialisation des onglets Bootstrap pour la configuration du solveur
    const configTabs = document.getElementById("configTabs");
    const tabPanes = document.querySelectorAll(".tab-pane");

    if (configTabs) {
      const configTabLinks = configTabs.querySelectorAll(".nav-link");
      
      configTabLinks.forEach(link => {
        link.addEventListener("click", function(e) {
          e.preventDefault();
          
          // retirer la classe active de tous les onglets
          configTabLinks.forEach(item => item.classList.remove("active"));
          
          // jouter la classe active à l'onglet cliqué
          this.classList.add("active");
          
          // masquer tous les panneaux
          tabPanes.forEach(pane => {
            pane.classList.remove("show", "active");
          });
          
          // afficher le panneau correspondant
          const targetPaneId = this.getAttribute("data-bs-target");
          const targetPane = document.querySelector(targetPaneId);
          
          if (targetPane) {
            targetPane.classList.add("show", "active");
          }
        });
      });
    }
    
    // Adapter les sections pour le mode responsive
    function adjustScrollOffsets() {
      const navbarHeight = navbarTabs ? navbarTabs.offsetHeight : 0;
      const sections = document.querySelectorAll("section.card");
      
      sections.forEach(section => {
        section.style.paddingTop = (navbarHeight + 5) + "px";
        section.style.marginTop = "-" + navbarHeight + "px";
      });
    }
    
    // ajuster les offsets au chargement et au redimensionnement
    window.addEventListener("resize", adjustScrollOffsets);
    adjustScrollOffsets();
    
    // Animation lors du changement d'onglet
    function animateTabTransition(tabElement) {
      if (tabElement) {
        tabElement.style.opacity = "0";
        tabElement.style.transform = "translateY(10px)";
        
        setTimeout(() => {
          tabElement.style.transition = "opacity 0.3s ease, transform 0.3s ease";
          tabElement.style.opacity = "1";
          tabElement.style.transform = "translateY(0)";
        }, 50);
        
        setTimeout(() => {
          tabElement.style.transition = "";
        }, 350);
      }
    }
    
    // Animer les panneaux d'onglets lorsqu'ils deviennent actifs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "class") {
          const target = mutation.target;
          if (target.classList.contains("active") && target.classList.contains("show")) {
            animateTabTransition(target);
          }
        }
      });
    });
    
    // Observer les changements de classe sur les panneaux d'onglets
    tabPanes.forEach(pane => {
      observer.observe(pane, { attributes: true });
    });
  });