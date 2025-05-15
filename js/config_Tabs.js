document.addEventListener("DOMContentLoaded", function() {
    // Gestion des sous-onglets de configuration
    const configTabsContent = document.getElementById('config-content');
    if (configTabsContent) {
      // initialiser les sous-onglets quand l'onglet de configuration est activé
      document.getElementById('config-tab').addEventListener('shown.bs.tab', function () {
        // s'assurer que le premier sous-onglet est actif par défaut
        const firstSubTab = document.querySelector('#config-subtabs .nav-link');
        if (firstSubTab) {
          new bootstrap.Tab(firstSubTab).show();
        }
      });
  
      // Gérer la transition entre les sous-onglets
      document.querySelectorAll('#config-subtabs .nav-link').forEach(function(tabButton) {
        tabButton.addEventListener('click', function(event) {
          event.preventDefault();
          const targetId = this.getAttribute('data-bs-target');
          const targetTab = document.querySelector(targetId);
          
          // cacher tous les sous-onglets
          document.querySelectorAll('#config-subtabs-content .tab-pane').forEach(function(tabPane) {
            tabPane.classList.remove('show', 'active');
          });
          
          // afficher le sous-onglet cible
          if (targetTab) {
            targetTab.classList.add('show', 'active');
          }
          
          // mettre à jour l'état des boutons d'onglet
          document.querySelectorAll('#config-subtabs .nav-link').forEach(function(btn) {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
          });
          
          this.classList.add('active');
          this.setAttribute('aria-selected', 'true');
        });
      });
    }
  
    // Gestion du mode avancé
    const advancedModeToggle = document.getElementById('advanced-mode-toggle');
    const advancedModeSection = document.getElementById('advanced-mode-section');
    
    if (advancedModeToggle && advancedModeSection) {
      advancedModeToggle.addEventListener('change', function() {
        if (this.checked) {
          //générer le JSON à partir du formulaire actuel
          generateConfigJSON();
        }
      });
    }
    
    // Fonction pour synchroniser les modes d'onglets
    function syncTabState(activeTab) {
      // mettre à jour l'URL avec l'onglet actif
      const tabId = activeTab.id;
      const tabName = tabId.replace('-tab', '');
      
      if (tabName === 'config') {
        // si on active l'onglet de configuration, vérifier s'il y a un sous-onglet à activer
        const urlParams = new URLSearchParams(window.location.search);
        const subTabParam = urlParams.get('subtab');
        
        if (subTabParam) {
          const subTabToActivate = document.getElementById(`${subTabParam}-tab`);
          if (subTabToActivate) {
            setTimeout(() => {
              new bootstrap.Tab(subTabToActivate).show();
            }, 100);
          }
        }
      }
    }
    
    // Écouter les changements d'onglets principaux
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tabEl => {
      tabEl.addEventListener('shown.bs.tab', function (event) {
        syncTabState(event.target);
      });
    });
    
    // Écouter les changements d'onglets secondaires pour la section Configuration
    document.querySelectorAll('#config-subtabs .nav-link').forEach(tabEl => {
      tabEl.addEventListener('shown.bs.tab', function (event) {
        const activeTabId = event.target.id;
        const subTabName = activeTabId.replace('-tab', '');
        
        // Mettre à jour l'URL avec le sous-onglet actif
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('tab', 'config');
        urlParams.set('subtab', subTabName);
        
        history.replaceState(null, null, `?${urlParams.toString()}`);
      });
    });
    
    // Initialiser l'état des onglets depuis l'URL
    function initTabsFromUrl() {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const subTabParam = urlParams.get('subtab');
      
      if (tabParam) {
        const tabToActivate = document.getElementById(`${tabParam}-tab`);
        if (tabToActivate) {
          new bootstrap.Tab(tabToActivate).show();
          
          // si un sous-onglet est spécifié et que nous sommes sur l'onglet config
          if (tabParam === 'config' && subTabParam) {
            setTimeout(() => {
              const subTabToActivate = document.getElementById(`${subTabParam}-tab`);
              if (subTabToActivate) {
                new bootstrap.Tab(subTabToActivate).show();
              }
            }, 150);
          }
        }
      }
    }
    
    // Initialiser l'état des onglets au chargement
    initTabsFromUrl();
});