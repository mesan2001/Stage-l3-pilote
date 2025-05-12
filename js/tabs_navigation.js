document.addEventListener("DOMContentLoaded", function() {
    // Gestion de la navigation entre les onglets
    document.querySelectorAll('.next-tab:not(#filtering-next-btn)').forEach(button => {
      button.addEventListener('click', function() {
        const nextTabId = this.getAttribute('data-next');
        const nextTab = document.getElementById(nextTabId);
        if (nextTab) {
          // activer le prochain onglet
          const tabTrigger = new bootstrap.Tab(nextTab);
          tabTrigger.show();
          
          // animer le scroll vers le haut de la page pour montrer le titre de la section
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      });
    });
  
    document.querySelectorAll('.prev-tab').forEach(button => {
      button.addEventListener('click', function() {
        const prevTabId = this.getAttribute('data-prev');
        const prevTab = document.getElementById(prevTabId);
        if (prevTab) {
          // activer l'onglet précédent
          const tabTrigger = new bootstrap.Tab(prevTab);
          tabTrigger.show();
          
          // animer le scroll vers le haut de la page
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }
      });
    });
  
    // Lorsqu'un onglet est activé
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tabEl => {
      tabEl.addEventListener('shown.bs.tab', function (event) {
        // mettre à jour l'URL avec un paramètre indiquant l'onglet actif
        const activeTabId = event.target.id;
        const tabName = activeTabId.replace('-tab', '');
        
        // mettre à jour l'état sans rechargement de la page
        history.replaceState(null, null, `?tab=${tabName}`);
        
        // si on est sur l'onglet de résultats, vérifier si on a déjà lancé le solveur
        if (tabName === 'results') {
          const solverStatus = document.getElementById('solver-status');
          if (solverStatus && solverStatus.textContent === 'Inactif') {
            solverStatus.textContent = 'En attente';
            solverStatus.className = 'badge bg-secondary';
          }
        }
      });
    });
  
    // Synchroniser les deux boutons "Lancer le solveur"
    const launchSolverBtn = document.getElementById('launch-solver');
    const startSolverBtn = document.getElementById('start-solver');
    
    if (launchSolverBtn && startSolverBtn) {
      launchSolverBtn.addEventListener('click', function() {
        // simuler le clic sur le bouton "Lancer le solveur" d'origine pour préserver les fonctionnalités existantes
        startSolverBtn.click();
        
        // activer l'onglet des résultats
        const resultsTab = document.getElementById('results-tab');
        const tabTrigger = new bootstrap.Tab(resultsTab);
        tabTrigger.show();
        
        // Simuler le démarrage du solveur (pour l'interface)
        simulateSolverProgress();
      });
      
      // Si le bouton d'origine est cliqué, synchroniser aussi l'interface
      startSolverBtn.addEventListener('click', function() {
        // Activer l'onglet des résultats
        const resultsTab = document.getElementById('results-tab');
        const tabTrigger = new bootstrap.Tab(resultsTab);
        tabTrigger.show();
        
        // Simuler le démarrage du solveur (pour l'interface)
        simulateSolverProgress();
        
      });
    }
    
    // Fonction pour simuler la progression du solveur
    function simulateSolverProgress() {
      const solverStatus = document.getElementById('solver-status');
      const elapsedTime = document.getElementById('elapsed-time');
      const progressBar = document.getElementById('solver-progress');
      const resultsContentPanel = document.getElementById('results-content-panel');
      
      if (solverStatus && progressBar) {
        solverStatus.textContent = 'En cours...';
        solverStatus.className = 'badge bg-warning';
        
        progressBar.style.width = '0%';
        progressBar.setAttribute('aria-valuenow', '0');
        
        let progress = 0;
        let seconds = 0;
        
        const timeInterval = setInterval(() => {
          seconds++;
          if (elapsedTime) {
            elapsedTime.textContent = `${seconds}s`;
          }
        }, 1000);
        
        const interval = setInterval(() => {
          // Augmenter progressivement, avec une accélération au début et un ralentissement à la fin
          if (progress < 30) {
            progress += 2;
          } else if (progress < 70) {
            progress += 1;
          } else {
            progress += 0.5;
          }
          
          progressBar.style.width = `${progress}%`;
          progressBar.setAttribute('aria-valuenow', progress);
          
          if (progress >= 100) {
            clearInterval(interval);
            clearInterval(timeInterval);
            
            solverStatus.textContent = 'Terminé';
            solverStatus.className = 'badge bg-success';
            
            // afficher les résultats
            if (resultsContentPanel) {
              resultsContentPanel.style.display = 'block';
            }
          }
        }, 200);
      }
    }
  
    // Nouvelle résolution (retourner à la sélection)
    document.getElementById('new-solve').addEventListener('click', function() {
      const selectionTab = document.getElementById('selection-tab');
      const tabTrigger = new bootstrap.Tab(selectionTab);
      tabTrigger.show();
      
      // réinitialiser les états
      const solverStatus = document.getElementById('solver-status');
      if (solverStatus) {
        solverStatus.textContent = 'Inactif';
        solverStatus.className = 'badge bg-secondary';
      }
      
      const progressBar = document.getElementById('solver-progress');
      if (progressBar) {
        progressBar.style.width = '0%';
      }
      
      const resultsContentPanel = document.getElementById('results-content-panel');
      if (resultsContentPanel) {
        resultsContentPanel.style.display = 'none';
      }
    });
  
    // Vérification des onglets à l'initialisation
    function initTabFromUrl() {
      // lire le paramètre d'URL pour l'onglet actif
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      
      if (tabParam) {
        const tabToActivate = document.getElementById(`${tabParam}-tab`);
        if (tabToActivate) {
          const tabTrigger = new bootstrap.Tab(tabToActivate);
          tabTrigger.show();
        }
      }
    }
    
    // Initialiser l'état des onglets au chargement
    initTabFromUrl();
    
  });

//////////////////////////////////////// PRODUCTION DE LA LISTE DES CONTRAINTES UTILISATEUR et autres codes pour remplir la page ////

// Liste des contraintes fondamentales
const coreConstraints = [
  "implicite_sequenced_sessions", "teacher_service", "disjunctive_teacher",
  "disjunctive_group", "disjunctive_room", "size_of_multiroom", 
  "bench_class_equilibrate"
];

const core_container = document.getElementById('core-constraints-list');

coreConstraints.forEach(constraint => {
  const div = document.createElement('div');
  div.className = 'constraint-item';
  
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = `core-${constraint}`;
  input.name = 'core_constraint[]';
  input.value = constraint;
  input.checked = true;
  
  const label = document.createElement('label');
  label.htmlFor = `core-${constraint}`;
  label.textContent = constraint;
  
  div.appendChild(input);
  div.appendChild(label);
  core_container.appendChild(div);
});


// liste des contraintes utilisateur
const constraints = [
    "sameRooms", "sameTeachers", "allowedPeriod", "forbiddenPeriod", 
    "weekly", "sameWeek", "assignRoom", "forbiddenRooms", 
    "sameWeekDay", "differentWeekDay", "differentSlots", 
    "disjunct", "sameWeeklySlot", "differentWeek", 
    "sameSlot", "sameSlots", "periodic", "sequenced"
];

const user_container = document.getElementById('user-constraints-list');

constraints.forEach(constraint => {
    const div = document.createElement('div');
    div.className = 'constraint-item';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `user-${constraint}`;
    input.name = 'user_constraint[]';
    input.value = constraint;
    input.checked = true;
    
    const label = document.createElement('label');
    label.htmlFor = `user-${constraint}`;
    label.textContent = constraint;
    
    div.appendChild(input);
    div.appendChild(label);
    user_container.appendChild(div);
});