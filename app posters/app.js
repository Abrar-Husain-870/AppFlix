// Complete Poster Inventory (46 items total: 23 Landscape, 23 Portrait)
// Arranged across 6 rows with maximum spatial separation between same-app posters

const posterRowsData = [
  // Row 0 (8 posters)
  [
    { title: "Amazon", file: "Amazon potrait.png", type: "portrait" },
    { title: "Swiggy", file: "swiggy potrait.png", type: "portrait" },
    { title: "Postman", file: "Postman Landscape.png", type: "landscape" },
    { title: "LinkedIn Pro", file: "linkedin potrait (2).png", type: "portrait" },
    { title: "Among Us", file: "among us potrait.png", type: "portrait" },
    { title: "OLX", file: "olx landscape.png", type: "landscape" },
    { title: "Flipkart", file: "Flipkart Landscape.png", type: "landscape" },
    { title: "Spotify", file: "spotify landscape.png", type: "landscape" }
  ],
  // Row 1 (8 posters)
  [
    { title: "PayPal", file: "paypal landscape.png", type: "landscape" },
    { title: "Blinkit", file: "blinkit potrait.png", type: "portrait" },
    { title: "Reddit", file: "Reddit Landscape.png", type: "landscape" },
    { title: "Notion", file: "notion potrait.png", type: "portrait" },
    { title: "Netflix", file: "netflix potrait.png", type: "portrait" },
    { title: "Tinder", file: "Tinder Potrait.png", type: "portrait" },
    { title: "Canva", file: "canva potrait.png", type: "portrait" },
    { title: "Pinterest", file: "Pinterest Landscape.png", type: "landscape" }
  ],
  // Row 2 (8 posters)
  [
    { title: "Glassdoor", file: "glassdoor potrait.png", type: "portrait" },
    { title: "Snapchat", file: "Snapchat Landscape.png", type: "landscape" },
    { title: "Rapido", file: "rapido potrait.png", type: "portrait" },
    { title: "Quora", file: "Quora potrait.png", type: "portrait" },
    { title: "Telegram", file: "telegram potrait.png", type: "portrait" },
    { title: "WhatsApp", file: "Whatsapp Landscape.png", type: "landscape" },
    { title: "Myntra", file: "myntra potrait.png", type: "portrait" },
    { title: "Amazon", file: "amzon landscape.png", type: "landscape" }
  ],
  // Row 3 (8 posters)
  [
    { title: "Spotify", file: "spotify potrait.png", type: "portrait" },
    { title: "OLX", file: "olx potrait.png", type: "portrait" },
    { title: "Tinder", file: "tinder landscape.png", type: "landscape" },
    { title: "Instagram", file: "Instagram Landscape.png", type: "landscape" },
    { title: "YouTube", file: "youtube potrait.png", type: "portrait" },
    { title: "PayPal", file: "paypal potrait.png", type: "portrait" },
    { title: "Among Us", file: "amongus landscape.png", type: "landscape" },
    { title: "LinkedIn", file: "linkedin potrait.png", type: "portrait" }
  ],
  // Row 4 (7 posters)
  [
    { title: "Pinterest", file: "pinterest potrait.png", type: "portrait" },
    { title: "Myntra", file: "Myntra Landscape.png", type: "landscape" },
    { title: "Zomato", file: "zomato potrait.png", type: "portrait" },
    { title: "X", file: "X Potrait.png", type: "portrait" },
    { title: "Notion", file: "notion  landscape.png", type: "landscape" },
    { title: "Blinkit", file: "blinkit landscape.png", type: "landscape" },
    { title: "Swiggy", file: "swiggy landscape.png", type: "landscape" }
  ],
  // Row 5 (7 posters)
  [
    { title: "Canva", file: "canva landscape.png", type: "landscape" },
    { title: "LinkedIn", file: "linkedin landscape.png", type: "landscape" },
    { title: "MongoDB", file: "mogodb landscape.png", type: "landscape" },
    { title: "Porter", file: "porter potrait.png", type: "portrait" },
    { title: "Razorpay", file: "razorpay landscape.png", type: "landscape" },
    { title: "Glassdoor", file: "glassdoor landscape.png", type: "landscape" },
    { title: "Rapido", file: "rapido landscape.png", type: "landscape" }
  ]
];

// State variables for controls
let rotX = 22;
let rotY = -10;
let rotZ = 8;
let scaleVal = 1.15;
let isFlatView = false;

document.addEventListener("DOMContentLoaded", () => {
  renderWall();
  initControls();
});

function renderWall() {
  const wallGrid = document.getElementById("wall-grid");
  wallGrid.innerHTML = "";

  posterRowsData.forEach((rowPosters, rowIndex) => {
    const rowEl = document.createElement("div");
    rowEl.className = "poster-row";
    rowEl.dataset.row = rowIndex;

    // Tile row posters twice to span past both left and right screen boundaries
    const extendedRowPosters = [...rowPosters, ...rowPosters];

    extendedRowPosters.forEach((posterData) => {
      const cardEl = createPosterCard(posterData);
      rowEl.appendChild(cardEl);
    });

    wallGrid.appendChild(rowEl);
  });
}

function createPosterCard(poster) {
  const card = document.createElement("div");
  card.className = `poster-card ${poster.type}`;

  const img = document.createElement("img");
  img.src = `posters/${poster.file}`;
  img.alt = poster.title;
  img.loading = "eager";

  const badge = document.createElement("div");
  badge.className = "card-badge";
  badge.textContent = `${poster.title} (${poster.type})`;

  card.appendChild(img);
  card.appendChild(badge);

  return card;
}

function updateTransform() {
  const wallGrid = document.getElementById("wall-grid");
  if (isFlatView) {
    wallGrid.style.transform = `rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(0.9)`;
  } else {
    wallGrid.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scaleVal})`;
  }
}

function initControls() {
  const inputX = document.getElementById("rotate-x");
  const inputY = document.getElementById("rotate-y");
  const inputZ = document.getElementById("rotate-z");
  const inputScale = document.getElementById("scale-wall");

  const valX = document.getElementById("val-x");
  const valY = document.getElementById("val-y");
  const valZ = document.getElementById("val-z");
  const valScale = document.getElementById("val-scale");

  inputX.addEventListener("input", (e) => {
    rotX = e.target.value;
    valX.textContent = `${rotX}°`;
    updateTransform();
  });

  inputY.addEventListener("input", (e) => {
    rotY = e.target.value;
    valY.textContent = `${rotY}°`;
    updateTransform();
  });

  inputZ.addEventListener("input", (e) => {
    rotZ = e.target.value;
    valZ.textContent = `${rotZ}°`;
    updateTransform();
  });

  inputScale.addEventListener("input", (e) => {
    scaleVal = (e.target.value / 100).toFixed(2);
    valScale.textContent = `${scaleVal}x`;
    updateTransform();
  });

  const toggleBtn = document.getElementById("toggle-perspective-btn");
  toggleBtn.addEventListener("click", () => {
    isFlatView = !isFlatView;
    toggleBtn.classList.toggle("active", isFlatView);
    const wallGrid = document.getElementById("wall-grid");
    wallGrid.classList.toggle("flat-view", isFlatView);
    updateTransform();
  });

  const resetBtn = document.getElementById("reset-tilt-btn");
  resetBtn.addEventListener("click", () => {
    rotX = 22;
    rotY = -10;
    rotZ = 8;
    scaleVal = 1.15;
    isFlatView = false;

    inputX.value = rotX;
    inputY.value = rotY;
    inputZ.value = rotZ;
    inputScale.value = 115;

    valX.textContent = `${rotX}°`;
    valY.textContent = `${rotY}°`;
    valZ.textContent = `${rotZ}°`;
    valScale.textContent = `1.15x`;

    const wallGrid = document.getElementById("wall-grid");
    wallGrid.classList.remove("flat-view");
    updateTransform();
  });

  const copyBtn = document.getElementById("copy-transform-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const transformCss = `transform: rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg) scale(${scaleVal});`;
      navigator.clipboard.writeText(transformCss);
      const origText = copyBtn.textContent;
      copyBtn.textContent = "Copied to Clipboard!";
      setTimeout(() => {
        copyBtn.textContent = origText;
      }, 1800);
    });
  }
}
