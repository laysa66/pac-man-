const width = 15; 
const grid = document.getElementById("grid");
const cells = [];
let pacmanIndex = 16;
let direction = 0; // 0 = neutre, -1 = gauche, 1 = droite, -15 = haut, 15 = bas
let score = 0;
let gameInterval;
let superPacman = false;
let superPacmanDuration = 10000; // durée du mode "super Pacman" 
let superPacmanTimeout;
let playerName = "";

// la grille
const layout = [
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1,
  1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1,
  1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
  1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1,
  1, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1,
  1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1,
  1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 2, 1,
  1, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 1,
  1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1,
  1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 2, 0, 0, 0, 1,
  1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1,
  1, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1,
  1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
];

const ghostStartPositions = [111, 112, 113]; // les positions initiales des fantômes sur la ligne 8 (index 112, 113, 114)

let ghostPositions = [...ghostStartPositions]; 
// 0 = espace vide, 1 = mur, 2 = nourriture

function createGrid() {
  for (let i = 0; i < layout.length; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    if (layout[i] === 1) cell.classList.add("wall");
    else {
      cell.classList.add("food");
      const dot = document.createElement("div");
      layout[i] === 0 ? dot.classList.add("food-dot"): dot.classList.add("food-cherry");
      cell.appendChild(dot);
    }
    grid.appendChild(cell);
    cells.push(cell);
  }
}

function drawPacman() {
  removePacman();

  const pacmanCell = cells[pacmanIndex];
  const pacmanIcon = document.createElement("div");
  pacmanIcon.classList.add("pacman-icon");

  const pacmanMouth = document.createElement("div");
  pacmanMouth.classList.add("pacman-mouth");

  switch (direction) {
    case -1: // gauche
      pacmanIcon.classList.add("pacman-left");
      break;
    case 1: // droite
      pacmanIcon.classList.add("pacman-right");
      break;
    case -width: // haut
      pacmanIcon.classList.add("pacman-up");
      break;
    case width: // bas
      pacmanIcon.classList.add("pacman-down");
      break;
    default: // aucune direction
      pacmanIcon.classList.add("pacman-right"); // par default c'est  a gauche 
  }

  pacmanIcon.appendChild(pacmanMouth);
  pacmanCell.appendChild(pacmanIcon);
}

function removePacman() {
  cells[pacmanIndex].classList.remove("pacman");
  cells[pacmanIndex].innerHTML = "";
}

function drawGhosts() {
  ghostPositions.forEach((pos) => {
    const ghost = document.createElement("div");
    ghost.classList.add("ghost");
    cells[pos].appendChild(ghost);
  });
}

function removeGhosts() {
  ghostPositions.forEach((pos) => {
    const ghostCell = cells[pos];
    const ghost = ghostCell.querySelector(".ghost");
    if (ghost) {
      ghostCell.removeChild(ghost);
    }
  });
}

function movePacman() {
  removePacman();
  const nextIndex = pacmanIndex + direction;

  if (
    nextIndex >= 0 &&
    nextIndex < cells.length &&
    !cells[nextIndex].classList.contains("wall")
  ) {
    pacmanIndex = nextIndex;

    // Manger de la nourriture
    if (cells[pacmanIndex].classList.contains("food")) {
      cells[pacmanIndex].classList.remove("food");
      if (layout[pacmanIndex] === 2) {
        score += 50;
        superPacman = true;
        clearTimeout(superPacmanTimeout);
        superPacmanTimeout = setTimeout(() => {
          superPacman = false;
        }, superPacmanDuration);
      } else {
        score++;
      }
      document.getElementById("score").innerText = `Score: ${score}`;
      console.log("Score:", score);
    }
  }
  drawPacman();
  checkGameOver();
  checkGameWin(); 
}

function moveGhosts() {
  removeGhosts();
  ghostPositions = ghostPositions.map((pos) => {
    let validMoves = [];
    
    const row = Math.floor(pos / width);
    const col = pos % width;
    
    const possibleMoves = [
      pos - width, // haut
      pos + width, // bas
      pos - 1,     // gauche
      pos + 1,     // droite
    ];

    
    possibleMoves.forEach((move) => {
      const moveRow = Math.floor(move / width);
      const moveCol = move % width;
      // vérifier que le déplacement est dans les limites et que la case est vide
      if (move >= 0 && move < cells.length && !cells[move].classList.contains("wall")) {
        validMoves.push(move); // ajouter le déplacement valide
      }
    });

    // si le fantôme a des déplacements valides, on en choisit un aléatoirement
    if (validMoves.length > 0) {
      const randomIndex = Math.floor(Math.random() * validMoves.length);
      return validMoves[randomIndex];
    }

    // en cas ou y a pas de déplacement le fatome reste a sa position ( un check pour l'erreur )
    return pos;
  });

  drawGhosts();
  checkGameOver();
}

function handleKey(e) {
  switch (e.key) {
    case "ArrowUp":
      direction = -width;
      break;
    case "ArrowDown":
      direction = width;
      break;
    case "ArrowLeft":
      direction = -1;
      break;
    case "ArrowRight":
      direction = 1;
      break;
    default:
      direction = 0;
  }
}

function checkGameOver() {
  if (ghostPositions.includes(pacmanIndex)) {
    if (superPacman) {
      // le packman va manger le fatome si il mange le fruit rouge
      const ghostIndex = ghostPositions.indexOf(pacmanIndex);
      ghostPositions.splice(ghostIndex, 1);
      score += 100;
      document.getElementById("score").innerText = `Score: ${score}`;
    } else {
      removePacman();
      showGameOver("Dommage, tu as perdu !");
    }
  }
}

function checkGameWin() {
  const allFoodEaten = cells.every(cell => !cell.classList.contains("food"));
  if (allFoodEaten) {
    showGameOver("Bravo, tu as gagné !");
  }
}

function showGameOver(message) {
  clearInterval(gameInterval);
  document.getElementById("game-over").style.display = "block";
  document.getElementById("game-message").innerText = message;
  document.getElementById("score").innerText = `Score: ${score}`;
}

function replayGame() {
  // Réinitialiser le jeu
  cells.forEach(cell => {
    cell.classList.remove("pacman", "ghost");
    cell.innerHTML = "";
  });
  cells.length = 0; // on va vider la grille 
  grid.innerHTML = ""; 
  createGrid(); // relancer la grille 
  pacmanIndex = 16;
  ghostPositions = [...ghostStartPositions];
  score = 0;
  direction = 0;
  superPacman = false;
  clearTimeout(superPacmanTimeout);
  document.getElementById("game-over").style.display = "none";
  document.getElementById("score").innerText = `Score: ${score}`;
  drawPacman();
  drawGhosts();
  gameInterval = setInterval(() => {
    movePacman();
    moveGhosts();
  }, 300);
}

function startGame() {
  playerName = document.getElementById("player-name").value;
  if (playerName.trim() === "") {
    alert("Veuillez entrer votre nom.");
    return;
  }
  document.getElementById("name-input-container").style.display = "none";
  document.getElementById("game-container").style.display = "block";
  createGrid();
  drawPacman();
  drawGhosts();
  document.addEventListener("keydown", handleKey);
  gameInterval = setInterval(() => {
    movePacman();
    moveGhosts();
  }, 300);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("start-button").addEventListener("click", startGame);
  document.getElementById("replay-button").addEventListener("click", replayGame);
});
