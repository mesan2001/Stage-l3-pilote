
document.addEventListener("DOMContentLoaded", function() {
  // Éléments DOM
  const welcomeScreen = document.getElementById("welcome-screen");
  const mainApp = document.querySelector("main.container");
  const newConfigBtn = document.getElementById("new-config");
  const loadConfigBtn = document.getElementById("load-existing-config");
  const configList = document.getElementById("config-list");
  const confirmLoadBtn = document.getElementById("confirm-load-config");

  // Initialisation de la position
  function initWelcomeScreen() {
    if (welcomeScreen) {
      welcomeScreen.style.display = "flex";
      welcomeScreen.style.justifyContent = "center";
      welcomeScreen.style.alignItems = "center";
      welcomeScreen.style.minHeight = "100vh";
      welcomeScreen.style.flexDirection = "column";
    }
    if (mainApp) {
      mainApp.style.display = "none";
    }
  }

  // Gestion de la navigation
  function navigateToApp() {
    welcomeScreen.style.display = "none";
    mainApp.style.display = "block";
    window.history.pushState({ screen: "app" }, "", "");
  }

  function navigateToWelcome() {
    initWelcomeScreen();
    window.history.pushState({ screen: "welcome" }, "", "");
  }

  // Gestion du bouton retour navigateur
  window.addEventListener("popstate", function(event) {
    if (event.state && event.state.screen === "welcome") {
      initWelcomeScreen();
    } else {
      welcomeScreen.style.display = "none";
      mainApp.style.display = "block";
    }
  });

  // Initialisation au chargement
  initWelcomeScreen();
  window.history.replaceState({ screen: "welcome" }, "", "");

  // Bouton "Nouvelle configuration"
  if (newConfigBtn) {
    newConfigBtn.addEventListener("click", function() {
      navigateToApp();
      const selectionTab = document.getElementById("selection-tab");
      if (selectionTab) new bootstrap.Tab(selectionTab).show();
    });
  }

if (loadConfigBtn) {
  loadConfigBtn.addEventListener("click", function() {
    const loadConfigModal = new bootstrap.Modal(
      document.getElementById("load-config-modal")
    );
    loadConfigModal.show();
    
    // Charger les configurations
    fetch("http://localhost:8080/solver/all")
      .then(response => {
        if (!response.ok) throw new Error("Erreur de chargement");
        return response.json();
      })
      .then(data => {
        configList.innerHTML = '<option value="" selected disabled>-- Sélectionnez une configuration --</option>';
        
        data.forEach(config => {
          const option = document.createElement("option");
          option.value = config.id;
          
          // Vérifier si une solution existe
          const hasSolution = config.solution_path !== null && config.status === "FINISHED";
          
          option.textContent = (config.name || `Configuration ${config.id}`) + 
                              (hasSolution ? " ✅ (solution disponible)" : " ❌ (pas de solution)");
          
          option.dataset.details = JSON.stringify({
            ...config,
            hasSolution: hasSolution
          });
          configList.appendChild(option);
        });
      })
      .catch(error => {
        console.error("Erreur:", error);
        configList.innerHTML = '<option value="" disabled selected>Erreur de chargement</option>';
      });
  });
}
  
  // Fonction pour formater la date ( pas d'importance ici )
  function formatCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  }

if (configList) {
  configList.addEventListener("change", function() {
    const selectedOption = this.options[this.selectedIndex];
    if (!selectedOption.value) return;
    
    const config = JSON.parse(selectedOption.dataset.details);
    document.getElementById("config-name").textContent = config.name || "Non défini";
    document.getElementById("config-date").textContent = config.date || formatCurrentDate();
    
    // Ajouter l'information sur la solution si elle existe
    const solutionInfo = document.createElement("small");
    solutionInfo.className = "text-muted d-block";
    solutionInfo.textContent = config.hasSolution 
      ? "⚠️ Une solution existe déjà pour cette configuration" 
      : "Aucune solution existante pour cette configuration";
    
    const detailsDiv = document.getElementById("config-details");
    detailsDiv.classList.remove("d-none");
    
    // Nettoyer les infos précédentes sur la solution
    const existingSolutionInfo = detailsDiv.querySelector(".solution-info");
    if (existingSolutionInfo) existingSolutionInfo.remove();
    
    solutionInfo.classList.add("solution-info");
    detailsDiv.appendChild(solutionInfo);
    
    confirmLoadBtn.disabled = false;
    this.dataset.selectedConfig = JSON.stringify(config);
  });
}

  // Bouton "Charger" dans la modale

  if (confirmLoadBtn) {
    confirmLoadBtn.addEventListener("click", function() {
      const selectedConfig = JSON.parse(configList.dataset.selectedConfig || "{}");
      if (!selectedConfig.id) return;
  
      const loadConfigModal = bootstrap.Modal.getInstance(
        document.getElementById("load-config-modal")
      );
      loadConfigModal.hide();
  
      navigateToApp();
  
      // Chargement des données
      Promise.all([
        fetch(`http://localhost:8080/solver/${selectedConfig.id}/instance`),
        fetch(`http://localhost:8080/solver/${selectedConfig.id}/strategy`)
      ])
      .then(async ([instanceRes, strategyRes]) => {
        if (!instanceRes.ok || !strategyRes.ok) throw new Error("Erreur de chargement");
        return Promise.all([instanceRes.json(), strategyRes.json()]);
      })
      .then(async ([instanceData, strategyData]) => {
        initUIWithData(instanceData.instance);
        loadConfigIntoForm(strategyData.strategy);
  
        // Si une solution existe, la charger
        if (selectedConfig.hasSolution) {
          try {
            await chargerResultatSolveur(selectedConfig.id);
            
            // Activer l'onglet des résultats si disponible
            const resultsTab = document.getElementById("results-tab");
            if (resultsTab) {
              new bootstrap.Tab(resultsTab).show();
            }
          } catch (error) {
            console.error("Erreur lors du chargement de la solution:", error);
          }
        }
  
        // Générer le XML et mettre à jour generatedData pour le téléchargement
        generateCompleteTimetabling()
          .then(xmlContent => {
            generatedData = {
              xml: xmlContent,
              json: {
                instance: instanceData.instance,
                strategy: strategyData.strategy
              }
            };
          })
          .catch(error => {
            console.error("Erreur lors de la génération du XML:", error);
            generatedData = {
              xml: null,
              json: {
                instance: instanceData.instance,
                strategy: strategyData.strategy
              }
            };
          });
  
        // Vérification de l'existence de l'onglet avant de l'activer
        const rulesTabElement = document.getElementById("rules-tab");
        if (rulesTabElement) {
          if (typeof bootstrap !== 'undefined' && bootstrap.Tab) {
            new bootstrap.Tab(rulesTabElement).show();
          } else {
            console.error("Bootstrap Tab n'est pas disponible");
            rulesTabElement.classList.add("active");
          }
        }
      })
      .catch(error => console.error("Erreur:", error));
    });
  }
});
