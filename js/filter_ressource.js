/**
 * Script pour gérer l'affichage et le filtrage des ressources (cours, enseignants et salles)  ainsi que leur intégration dans la configuration du solveur
 */

document.addEventListener("DOMContentLoaded", function() {
  // variables globales pour suivre les ressources sélectionnées
  const selectedCourses = new Set();
  const selectedTeachers = new Set();
  const selectedRooms = new Set();

  // ============================ GESTION DES COURS ====================

  // Initialiser les tableaux de cours
  // Ajouter ces variables globales au début du fichier, après les Sets existants
const inactiveCourses = new Set();
const inactiveTeachers = new Set();
const inactiveRooms = new Set();

// Modifier la fonction renderCoursesTable
function renderCoursesTable(data) {
  if (!data || !data.timetabling || !data.timetabling.courses) {
    console.error("Données de cours invalides");
    return;
  }

  const tableBody = document.getElementById("courses-list");
  if (!tableBody) return;

  tableBody.innerHTML = "";

  data.timetabling.courses.forEach((course, index) => {
    const row = document.createElement("tr");
    const isActive = !inactiveCourses.has(course.id);
    
    // extraire le nom du cours à partir du label
    const courseName = extractInfoFromLabel(course.label, "coursename") || course.label.split(",")[0];
    const partsCount = course.parts ? course.parts.length : 0;
    
    row.innerHTML = `
      <td>
        <input type="checkbox" class="course-checkbox" data-course-id="${course.id}" ${isActive ? 'checked' : ''}>
      </td>
      <td>${course.id}</td>
      <td>${courseName}</td>
      <td>${partsCount}</td>
      <td>
        <span class="badge ${isActive ? 'bg-success' : 'bg-danger'}">${isActive ? 'Actif' : 'Inactif'}</span>
      </td>
    `;

    if (!isActive) {
      row.classList.add('inactive');
    }
    
    const checkbox = row.querySelector('.course-checkbox');
    const badge = row.querySelector('.badge');
    
    checkbox.addEventListener('change', function() {
      if (this.checked) {
        selectedCourses.add(course.id);
        inactiveCourses.delete(course.id);  
        badge.className = 'badge bg-success';
        badge.textContent = 'Actif';
        row.classList.remove('inactive');
      } else {
        selectedCourses.delete(course.id);
        inactiveCourses.add(course.id);  
        badge.className = 'badge bg-danger';
        badge.textContent = 'Inactif';
        row.classList.add('inactive');
      }
      updateResourceCounter("courses", selectedCourses.size, data.timetabling.courses.length);
      updateAdvancedConfigJSON();
    });
    
    if (isActive) {
      selectedCourses.add(course.id);
    }
    
    tableBody.appendChild(row);
  });

  updateResourceCounter("courses", selectedCourses.size, data.timetabling.courses.length);
  initSorting("courses-table");
}

  // ============   GESTION DES ENSEIGNANTS =================

  // Initialiser le tableau des enseignants
  function renderTeachersTable(data) {
    if (!data || !data.timetabling || !data.timetabling.teachers) {
      console.error("Données d'enseignants invalides");
      return;
    }
  
    const tableBody = document.getElementById("teachers-list");
    if (!tableBody) return;
  
    tableBody.innerHTML = "";
  
    data.timetabling.teachers.forEach((teacher, index) => {
      const row = document.createElement("tr");
      const isActive = !inactiveTeachers.has(teacher.id);
      
      // extraire les informations de l'enseignant
      const teacherName = extractInfoFromLabel(teacher.label, "name") || "";
      const teacherLastName = extractInfoFromLabel(teacher.label, "lastname") || "";
      const fullName = `${teacherName} ${teacherLastName}`.trim();
      const department = extractInfoFromLabel(teacher.label, "code_unite") || "";
      const hourlyVolume = extractInfoFromLabel(teacher.label, "hourly_volume") || "0";
      
      row.innerHTML = `
        <td>
          <input type="checkbox" class="teacher-checkbox" data-teacher-id="${teacher.id}" ${isActive ? 'checked' : ''}>
        </td>
        <td>${teacher.id}</td>
        <td>${fullName}</td>
        <td>${department}</td>
        <td>${hourlyVolume}</td>
        <td>
          <span class="badge ${isActive ? 'bg-success' : 'bg-danger'}">${isActive ? 'Actif' : 'Inactif'}</span>
        </td>
      `;
  
      if (!isActive) {
        row.classList.add('inactive');
      }
      
      const checkbox = row.querySelector('.teacher-checkbox');
      const badge = row.querySelector('.badge');
      
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          selectedTeachers.add(teacher.id);
          inactiveTeachers.delete(teacher.id);
          badge.className = 'badge bg-success';
          badge.textContent = 'Actif';
          row.classList.remove('inactive');
        } else {
          selectedTeachers.delete(teacher.id);
          inactiveTeachers.add(teacher.id);
          badge.className = 'badge bg-danger';
          badge.textContent = 'Inactif';
          row.classList.add('inactive');
        }
        updateResourceCounter("teachers", selectedTeachers.size, data.timetabling.teachers.length);
        updateAdvancedConfigJSON();
      });
      
      if (isActive) {
        selectedTeachers.add(teacher.id);
      }
      
      tableBody.appendChild(row);
    });
  
    updateResourceCounter("teachers", selectedTeachers.size, data.timetabling.teachers.length);
    initSorting("teachers-table");
  }


  // ========== GESTION DES SALLES ================

  // Initialiser le tableau des salles
  function renderRoomsTable(data) {
    if (!data || !data.timetabling || !data.timetabling.rooms) {
      console.error("Données de salles invalides");
      return;
    }
  
    const tableBody = document.getElementById("rooms-list");
    if (!tableBody) return;
  
    tableBody.innerHTML = "";
  
    data.timetabling.rooms.forEach((room, index) => {
      const row = document.createElement("tr");
      const isActive = !inactiveRooms.has(room.id);
      
      // extraire les informations de la salle
      const roomName = extractInfoFromLabel(room.label, "name") || room.id;
      const capacity = room.capacity || 0;
      const type = extractInfoFromLabel(room.label, "type") || "";
      const building = extractInfoFromLabel(room.label, "building") || "";
      
      row.innerHTML = `
        <td>
          <input type="checkbox" class="room-checkbox" data-room-id="${room.id}" ${isActive ? 'checked' : ''}>
        </td>
        <td>${room.id}</td>
        <td>${roomName}</td>
        <td>${capacity}</td>
        <td>${type}</td>
        <td>${building}</td>
        <td>
          <span class="badge ${isActive ? 'bg-success' : 'bg-danger'}">${isActive ? 'Actif' : 'Inactif'}</span>
        </td>
      `;
  
      if (!isActive) {
        row.classList.add('inactive');
      }
      
      const checkbox = row.querySelector('.room-checkbox');
      const badge = row.querySelector('.badge');
      
      checkbox.addEventListener('change', function() {
        if (this.checked) {
          selectedRooms.add(room.id);
          inactiveRooms.delete(room.id);
          badge.className = 'badge bg-success';
          badge.textContent = 'Actif';
          row.classList.remove('inactive');
        } else {
          selectedRooms.delete(room.id);
          inactiveRooms.add(room.id);
          badge.className = 'badge bg-danger';
          badge.textContent = 'Inactif';
          row.classList.add('inactive');
        }
        updateResourceCounter("rooms", selectedRooms.size, data.timetabling.rooms.length);
        updateAdvancedConfigJSON();
      });
      
      if (isActive) {
        selectedRooms.add(room.id);
      }
      
      tableBody.appendChild(row);
    });
  
    updateResourceCounter("rooms", selectedRooms.size, data.timetabling.rooms.length);
    initSorting("rooms-table");
  }

  // =========== FONCTIONS UTILITAIRES ===========

  // Extraction d'informations depuis des chaînes au format "clé:valeur"
  function extractInfoFromLabel(label, key) {
    if (!label) return null;
    
    const regex = new RegExp(`${key}:([^,]+)`);
    const match = label.match(regex);
    
    return match ? match[1] : null;
  }

  // Mise à jour des compteurs de ressources
  function updateResourceCounter(type, activeCount, totalCount) {
    const activeCountElem = document.getElementById(`active-${type}-count`);
    const totalCountElem = document.getElementById(`total-${type}-count`);
    
    if (activeCountElem && totalCountElem) {
      activeCountElem.textContent = activeCount;
      totalCountElem.textContent = totalCount;
    }
  }

// Initialisation du tri des colonnes
function initSorting(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  
  const sortableHeaders = table.querySelectorAll('.sortable');
  let currentSortColumn = null;
  let currentSortDirection = null;
  
  sortableHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const sortField = this.getAttribute('data-sort');
      
      // Si on clique sur la même colonne, on inverse la direction
      if (currentSortColumn === sortField) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortDirection = 'asc';
        currentSortColumn = sortField;
      }
      
      // Réinitialiser les classes de tri pour tous les en-têtes
      sortableHeaders.forEach(th => {
        th.classList.remove('asc', 'desc');
      });
      
      // Ajouter la classe de direction appropriée à l'en-tête actuel
      this.classList.add(currentSortDirection);
      
      // Effectuer le tri
      sortTable(tableId, sortField, currentSortDirection);
    });
  });
}




// Fonction de tri générique améliorée
function sortTable(tableId, field, direction) {
  const table = document.getElementById(tableId);
  if (!table) return;
  
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  const originalOrder = rows.map((row, index) => ({ row, index }));
  
  rows.sort((a, b) => {
    let valueA, valueB;
    
    // Fonction helper pour extraire la valeur numérique
    const extractNumber = (str) => {
      if (!str) return 0;
      const num = parseFloat(str.replace(/[^\d.-]/g, ''));
      return isNaN(num) ? 0 : num;
    };
    
    // Déterminer quelle colonne utiliser pour le tri
    switch(field) {
      case 'id':
        valueA = extractNumber(a.cells[1].textContent);
        valueB = extractNumber(b.cells[1].textContent);
        break;
      case 'name':
        valueA = a.cells[2].textContent.trim().toLowerCase();
        valueB = b.cells[2].textContent.trim().toLowerCase();
        break;
      case 'capacity':
        valueA = extractNumber(a.cells[3].textContent);
        valueB = extractNumber(b.cells[3].textContent);
        break;
      case 'hourly_volume':
        // Correction spécifique pour la colonne volume
        valueA = extractNumber(a.cells[4].textContent);
        valueB = extractNumber(b.cells[4].textContent);
        break;
      case 'parts':
        valueA = extractNumber(a.cells[3].textContent);
        valueB = extractNumber(b.cells[3].textContent);
        break;
      case 'status':
        valueA = a.querySelector('.badge').textContent.trim().toLowerCase();
        valueB = b.querySelector('.badge').textContent.trim().toLowerCase();
        break;
      default:
        valueA = a.cells[2].textContent.trim().toLowerCase();
        valueB = b.cells[2].textContent.trim().toLowerCase();
    }
    
    // Comparaison en tenant compte du type de données
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return direction === 'asc' ? valueA - valueB : valueB - valueA;
    } else {
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return originalOrder.find(item => item.row === a).index - 
             originalOrder.find(item => item.row === b).index;
    }
  });
  
  // réorganiser les lignes dans le tableau
  rows.forEach(row => tbody.appendChild(row));
}

  // ===== FONCTIONS DE RECHERCHE =====

  // Fonction de recherche pour les cours
  function setupCoursesSearch() {
    const searchInput = document.getElementById('courses-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const rows = document.querySelectorAll('#courses-list tr');
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
      });
    });
  }

  // Fonction de recherche pour les enseignants
  function setupTeachersSearch() {
    const searchInput = document.getElementById('teachers-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const rows = document.querySelectorAll('#teachers-list tr');
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
      });
    });
  }

  // Fonction de recherche pour les salles
  function setupRoomsSearch() {
    const searchInput = document.getElementById('rooms-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const rows = document.querySelectorAll('#rooms-list tr');
      
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
      });
    });
  }

  // ======= GESTION DES BOUTONS "TOUT SÉLECTIONNER" / "TOUT DÉSÉLECTIONNER" ====================

  // Configuration des boutons pour les cours


function setupCoursesButtons() {
  const selectAllCheckbox = document.getElementById('select-all-courses-checkbox');
  
  // Cocher la case par défaut au chargement
  if (selectAllCheckbox) {
      selectAllCheckbox.checked = true; // Case cochée par défaut
      
      // Sélectionner tous les cours au chargement
      document.querySelectorAll('.course-checkbox').forEach(checkbox => {
          checkbox.checked = true;
          const courseId = checkbox.getAttribute('data-course-id');
          inactiveCourses.delete(courseId); // S'assurer qu'aucun cours n'est inactif
          checkbox.dispatchEvent(new Event('change'));
      });
      
      // Gérer les changements futurs
      selectAllCheckbox.addEventListener('change', function() {
          const isChecked = this.checked;
          document.querySelectorAll('.course-checkbox').forEach(checkbox => {
              const courseId = checkbox.getAttribute('data-course-id');
              checkbox.checked = isChecked;
              checkbox.dispatchEvent(new Event('change'));
              
              if (isChecked) {
                  inactiveCourses.delete(courseId);
              } else {
                  inactiveCourses.add(courseId);
              }
          });
          updateAdvancedConfigJSON();
      });
  }
  
  // Initialiser la configuration
  updateAdvancedConfigJSON();
}

// Appeler cette fonction au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  setupCoursesButtons();
});


  // Configuration des boutons pour les enseignants

function setupTeachersButtons() {
  const selectAllCheckbox = document.getElementById('select-all-teachers-checkbox');
  
  // Cocher la case par défaut au chargement
  if (selectAllCheckbox) {
      selectAllCheckbox.checked = true; // Case cochée par défaut
      
      // Sélectionner tous les enseignants au chargement
      document.querySelectorAll('.teacher-checkbox').forEach(checkbox => {
          checkbox.checked = true;
          const teacherId = checkbox.getAttribute('data-teacher-id');
          inactiveTeachers.delete(teacherId); // S'assurer qu'aucun enseignant n'est inactif
          checkbox.dispatchEvent(new Event('change'));
      });
      
      // Gérer les changements futurs
      selectAllCheckbox.addEventListener('change', function() {
          const isChecked = this.checked;
          document.querySelectorAll('.teacher-checkbox').forEach(checkbox => {
              const teacherId = checkbox.getAttribute('data-teacher-id');
              checkbox.checked = isChecked;
              checkbox.dispatchEvent(new Event('change'));
              
              if (isChecked) {
                  inactiveTeachers.delete(teacherId);
              } else {
                  inactiveTeachers.add(teacherId);
              }
          });
          updateAdvancedConfigJSON();
      });
  }
  
  // Initialiser la configuration
  updateAdvancedConfigJSON();
}

// Appeler cette fonction au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  setupTeachersButtons();
});

  // Configuration des boutons pour les salles

    function setupRoomsButtons() {
      const selectAllCheckbox = document.getElementById('select-all-rooms-checkbox');
      
      // Cocher la case par défaut au chargement
      if (selectAllCheckbox) {
          selectAllCheckbox.checked = true; // Case cochée par défaut
          
          // Sélectionner toutes les salles au chargement
          document.querySelectorAll('.room-checkbox').forEach(checkbox => {
              checkbox.checked = true;
              const roomId = checkbox.getAttribute('data-room-id');
              inactiveRooms.delete(roomId); // S'assurer qu'aucune salle n'est inactive
              checkbox.dispatchEvent(new Event('change'));
          });
          
          // Gérer les changements futurs
          selectAllCheckbox.addEventListener('change', function() {
              const isChecked = this.checked;
              document.querySelectorAll('.room-checkbox').forEach(checkbox => {
                  const roomId = checkbox.getAttribute('data-room-id');
                  checkbox.checked = isChecked;
                  checkbox.dispatchEvent(new Event('change'));
                  
                  if (isChecked) {
                      inactiveRooms.delete(roomId);
                  } else {
                      inactiveRooms.add(roomId);
                  }
              });
              updateAdvancedConfigJSON();
          });
      }
      
      // Initialiser la configuration
      updateAdvancedConfigJSON();
  }
  
  // Appeler cette fonction au chargement de la page
  document.addEventListener('DOMContentLoaded', function() {
      setupRoomsButtons();
  });

  // ====================FONCTIONS DE TRAITEMENT DES RESSOURCES FILTRÉES =====================

  // Obtenir les données filtrées pour le solveur
  window.getFilteredResourcesData = function() {
    if (!universityData || !universityData.timetabling) return {};
    
    const filteredData = JSON.parse(JSON.stringify(universityData));
    
    // Filtrer les cours
    if (filteredData.timetabling.courses) {
      filteredData.timetabling.courses = filteredData.timetabling.courses.filter(course => 
        selectedCourses.has(course.id)
      );
    }
    
    // Filtrer les enseignants
    if (filteredData.timetabling.teachers) {
      filteredData.timetabling.teachers = filteredData.timetabling.teachers.filter(teacher => 
        selectedTeachers.has(teacher.id)
      );
    }
    
    // Filtrer les salles
    if (filteredData.timetabling.rooms) {
      filteredData.timetabling.rooms = filteredData.timetabling.rooms.filter(room => 
        selectedRooms.has(room.id)
      );
    }
    
    return filteredData;
  };

  // Mise à jour du JSON de configuration avancée avec les ressources filtrées
  function updateAdvancedConfigJSON() {
    // vérifier si le mode avancé est activé
    const advancedModeToggle = document.getElementById("advanced-mode-toggle");
    if (!advancedModeToggle || !advancedModeToggle.checked) return;

    try {
      // Obtenir le JSON actuel
      const jsonTextarea = document.getElementById("advanced-config-json");
      if (!jsonTextarea) return;

      let configData = {};
      try {
        configData = JSON.parse(jsonTextarea.value);
      } catch (e) {
        // si le JSON est invalide, on utilise un objet vide
        console.error("JSON invalide dans le textarea:", e);
      }

      // ajouter les ressources filtrées
      configData.filtered_resources = {
        courses: Array.from(selectedCourses),
        teachers: Array.from(selectedTeachers),
        rooms: Array.from(selectedRooms)
      };

      // mettre à jour le textarea
      jsonTextarea.value = JSON.stringify(configData, null, 2);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du JSON:", error);
    }
  }

  // Étendre la fonction generateConfigJSON existante pour inclure les ressources filtrées
  if (typeof window.generateConfigJSON === 'function') {
    const originalGenerateConfigJSON = window.generateConfigJSON;
    window.generateConfigJSON = function() {
      let config = originalGenerateConfigJSON();
      
      // ajouter les ressources filtrées au config
      config.filtered_resources = {
        courses: Array.from(selectedCourses),
        teachers: Array.from(selectedTeachers),
        rooms: Array.from(selectedRooms)
      };
      
      return config;
    };
  } else {
    console.warn("La fonction generateConfigJSON n'est pas disponible. Les ressources filtrées ne seront pas incluses dans la configuration.");
  }

  // ====================== INITIALISATION ================================

  // Fonction pour initialiser les tableaux si les données sont disponibles
  function initializeResourcesTables() {
    // Vérifier si les données sont disponibles
    if (typeof universityData !== 'undefined' && universityData && universityData.timetabling) {
      console.log("Initialisation des tableaux de ressources avec les données disponibles");
      

      // rendre les tableaux
      renderCoursesTable(universityData);
      renderTeachersTable(universityData);
      renderRoomsTable(universityData);
      
      // mettre à jour le JSON de configuration
      updateAdvancedConfigJSON();
    } else {
      console.log("Données universityData non disponibles ou incomplètes pour le rendu des ressources" , universityData);
    }
  }

  // configurer les écouteurs d'événements pour les recherches
  setupCoursesSearch();
  setupTeachersSearch();
  setupRoomsSearch();

  // configurer les boutons de sélection/désélection
  setupCoursesButtons();
  setupTeachersButtons();
  setupRoomsButtons();

  // écouter l'événement personnalisé pour l'initialisation des tableaux
  document.addEventListener('universityDataLoaded', function() {
    console.log("Événement universityDataLoaded détecté, initialisation des tableaux");
    initializeResourcesTables();
  });

  // vérifier si universityData est déjà disponible
  if (typeof universityData !== 'undefined' && universityData && universityData.timetabling) {
    console.log("universityData déjà disponible, initialisation des tableaux");
    initializeResourcesTables();
  } else {
    console.log("universityData pas encore disponible lors du chargement initial");
  }

  //s'abonner au tab "resources" pour initialiser les tableaux quand l'onglet est activé
  document.getElementById('resources-tab')?.addEventListener('shown.bs.tab', function () {
    console.log("Onglet resources activé, tentative d'initialisation des tableaux");
    if (typeof universityData !== 'undefined' && universityData && universityData.timetabling) {
      console.log("Données disponibles pour le rendu des tableaux");
      initializeResourcesTables();
    } else {
      console.log("Données non disponibles lors de l'activation de l'onglet resources");
    }
  });

  //étendre la fonction loadDataAndInitUI pour initialiser les tableaux après le chargement des données
  if (typeof loadDataAndInitUI === 'function') {
    console.log("Remplacement de la fonction loadDataAndInitUI pour la détection des données");
    const originalFunction = loadDataAndInitUI;
    window.loadDataAndInitUI = async function() {
      await originalFunction();
      console.log("loadDataAndInitUI terminé, déclenchement de l'événement universityDataLoaded");
      document.dispatchEvent(new CustomEvent('universityDataLoaded'));
    };
  }
  
  // observer le changement d'état du mode avancé pour mettre à jour le JSON
  document.getElementById("advanced-mode-toggle")?.addEventListener('change', function() {
    if (this.checked) {
      updateAdvancedConfigJSON();
    }
  });
});