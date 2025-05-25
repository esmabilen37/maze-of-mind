const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Yüksek çöznürlük için yaptım.
const dpr = window.devicePixelRatio || 1;
const baseWidth = 576; // oynanacak alanın genişliği
const baseHeight = 576; // oynanacak alanın yüksekliği

// yukarıda verdiğim değerlerle boyıt ayarlıyorum burada.
canvas.width = baseWidth * dpr;
canvas.height = baseHeight * dpr;
canvas.style.width = baseWidth + "px";
canvas.style.height = baseHeight + "px";

//pixel netliği içinmiş ai önerdi
ctx.scale(dpr, dpr);

ctx.imageSmoothingEnabled = false;//netlik daha fazla olsun diye bunu false yaptım

const TILE_SIZE = 48; // tile'in boyutu 48x48 (toplamı totalde 576x576 olacak)
const GRID_SIZE = 12; //bu grid sayım 12x12 den 144 tane grid oldu
const hedef = { x: 11, y: 6 };
let gameWon = false;//bunu bastan false verdim ki true olursa oyun bitsin.
let glowTriggered = false;//parlama tetiklenmesi basta false cunku sandiga ukasilmadi
let glowTime = 0;
const glowDuration = 140;


// olusturdugum karakter resimlerini ekliyorum
const karakterSag1 = new Image();
karakterSag1.src = "img/karakter-sagadim1.png";
const karakterSag2 = new Image();
karakterSag2.src = "img/karakter-sagadim2.png";
const karakterSol1 = new Image();
karakterSol1.src = "img/karakter-soladim1.png";
const karakterSol2 = new Image();
karakterSol2.src = "img/karakter-soladim2.png";
const karakterOn = new Image();
karakterOn.src = "img/karakter-on.png";

//olusturdugum sandik, acik sandik ve tuzak resimlerini ekliyorum
const chestImage = new Image();
chestImage.src = 'img/hedef.png';
const openChestImg = new Image();
openChestImg.src = 'img/acikhedef.PNG';
const trapImage= new Image();
trapImage.src='img/engel.PNG';

//arka plan muzigi ekledim bu hep çalacak butona basılınca.
const backgroundmusic= new Audio('sesler/turtlesong.mp3');
backgroundmusic.loop=true;
const alkıs= new Audio('sesler/alkıs.mp3');//alkıs efekti sandıga ulasilinca calacak
document.getElementById("startButton").addEventListener("click", () => {
  document.getElementById("startScreen").style.display = "none";
  document.querySelector(".controls").style.display = "block";
  backgroundmusic.volume = 0.03;
  backgroundmusic.play();
  levelGuncelleme(0);
  requestAnimationFrame(dongu);
});

//hamle sayacı baslangıcta 0 olmalı hamle yapılmadı cunku
let moveCount = 0;
//hamleyi guncellemek icin yazdım
function updateMoveCounter() {
  document.getElementById("moveCounter").textContent = "Hamle: " + moveCount;
}


//level gecisleri icin ayarladım
function showLevelTransition(levelNum) {
  const overlay = document.getElementById("levelTransition");
  overlay.textContent = "Level " + levelNum;
  overlay.style.display = "flex";
  setTimeout(() => {
    overlay.style.display = "none";
  }, 1200); // 1.2 saniye göster
}


//tüm leveller bitince bunu basacak
function tebrikBastir() {
  const overlay = document.getElementById("levelTransition");
  overlay.textContent = "Tebrikler! Tüm levelleri bitirdiniz!";
  overlay.style.display = "flex";
}

//kulllanıcı tuzağa basarsa bu fonksiyon calısacak
function oyunBitisiGoster() {
  const overlay = document.getElementById("levelTransition");
  overlay.textContent = "Tuzak! Tekrar Diriltiliyorsun..";
  overlay.style.display = "flex";
  setTimeout(() => {
    overlay.style.display = "none";
    levelGuncelleme(currentLevel); // Leveli yeniden başlat
  }, 1000); 
}


// level tanımlıyorum: 0:path, 1:wall, 2:chest, 3:trap
const levels = [
  [
    [1,1,1,1,0,0,0,0,1,1,1,1],
    [1,1,1,1,0,0,0,0,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [0,0,0,0,1,1,1,1,0,0,0,0],
    [0,0,0,0,1,1,1,1,0,0,0,0], //level 1in grid yapisi
    [0,0,0,0,1,1,1,1,0,0,0,2],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  [
    [1,1,1,1,0,0,0,0,1,1,1,1],
    [0,0,0,0,1,1,1,1,1,1,1,1],
    [0,0,0,3,1,1,1,1,1,1,1,1],
    [1,1,1,1,0,0,0,0,1,1,1,1],
    [0,0,0,0,1,1,1,1,1,1,1,1],
    [0,0,0,0,1,1,1,1,1,1,1,1],//level 2nin grid yapisi
    [0,3,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,0,0,2,3],
    [1,1,1,1,1,0,0,1,0,1,1,1],
    [1,1,1,1,1,0,0,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1]
  ],
  [
    [0,0,0,0,0,0,0,0,1,1,1,1],
    [3,2,0,1,0,0,0,0,1,1,1,1],
    [1,1,1,1,0,3,0,3,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,0,0,0],
    [1,1,0,0,0,0,1,1,0,0,0,0],
    [1,1,1,0,0,1,1,1,0,3,3,0], //level 3un grid yapisi
    [1,1,1,1,1,1,1,1,1,1,1,1],
    [3,0,0,0,0,0,0,0,0,0,0,0],
    [1,1,0,0,0,0,0,0,0,0,0,3],
    [1,1,0,0,3,0,0,3,1,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1],
  ]
];



  
let currentLevel = 0;//once anlik leveli 0 olarak tutmalıyım normalde 1 yazardım ama kodda hata aldım index 0 oludugu icin
let map = levels[currentLevel];

// matriste verdiğim sayıların karsılıklarını olusturuyorum burada
let grid = [];
for (let row = 0; row < GRID_SIZE; row++) {
  const rowArr = [];
  for (let col = 0; col < GRID_SIZE; col++) {
    const val = map[row][col];  
    if (val === 1) {
      rowArr.push("wall");
    } else if (val === 0) {
      rowArr.push("path");
    } else if (val === 2) {
      rowArr.push("chest");
    } else if (val === 3) {
      rowArr.push("trap");
    } 
  }
  grid.push(rowArr);
}




//duvar resmini ekliyorum
const wallImage = new Image();
wallImage.src = "img/duvar.png"; 

//emin olmak için ai dan yardım alarak yazdım
wallImage.onload = () => draw();

function shiftBlockRowRight(blockRowIndex) {
  const startRow = blockRowIndex * 4;//her blokta 4 satır oldugu icin boyle yazdım
  const blockCols = 3; //3blok var bir satırda o yuzden boyle yazdım

  //blok tasıma islemi icin aidan yardım alarak yaptım
  const tempBlock = [];
  for (let r = 0; r < 4; r++) {
    tempBlock.push(grid[startRow + r].slice(8, 12)); // sağdaki son bloğu kopyalama islemi
  }

  // Sağdan sola doğru blokları kaydırma islemi
  for (let b = blockCols - 1; b > 0; b--) {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        grid[startRow + r][c + b * 4] = grid[startRow + r][c + (b - 1) * 4];
      }
    }
  }

  // En sola, en sağdaki bloğu koyma islemi
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      grid[startRow + r][c] = tempBlock[r][c];
    }
  }

  // Oyuncu ve hedef pozisyonuna güncelleme yapıyorum
  if (player.y >= startRow && player.y < startRow + 4) {
    player.x += 4;
    if (player.x >= GRID_SIZE) player.x -= 12;
  }
  if (hedef.y >= startRow && hedef.y < startRow + 4) {
    let yeniHedefSutun = hedef.x + 4;
    if (yeniHedefSutun >= GRID_SIZE) yeniHedefSutun -= 12;
    hedef.x = yeniHedefSutun;
  }

  draw();
}

function shiftBlockColumnUp(blockColIndex) {
  const startCol = blockColIndex * 4;
  const blockRows = 3; // ustteki fonkla aynı mantık
  const blockHeight = 4;

  // sirkulasyon icin en usttekini yedege alıyorum
  const tempBlock = [];
  for (let r = 0; r < 4; r++) {
    tempBlock.push(grid[r].slice(startCol, startCol + 4));
  }

  // Yukarıya doğru blokları kaydırma islemi
  for (let b = 0; b < blockRows - 1; b++) {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        grid[r + b * 4][c + startCol] = grid[r + (b + 1) * 4][c + startCol];
      }
    }
  }

  // En alta, en üstteki bloğu yerleştirme islemi
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      grid[r + 8][c + startCol] = tempBlock[r][c];
    }
  }

  // Oyuncu ve hedef pozisyonuna güncelleme yapıyorum
  if (player.x >= startCol && player.x < startCol + 4) {
    player.y -= blockHeight;
    if (player.y < 0) player.y += blockRows * blockHeight;
  }
  if (hedef.x >= startCol && hedef.x < startCol + 4) {
    hedef.y -= blockHeight;
    if (hedef.y < 0) hedef.y += blockRows * blockHeight;
  }

  draw();
}

//hareketlerin anlamlanması için kullanıyoruz. aidan destek aldım.
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  // Prevent default browser behavior for arrow keys to avoid scrolling
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
  // R veya r tuşuna basılırsa yeniden baslatmak için
  if (e.key === "r" || e.key === "R") {
    levelGuncelleme(currentLevel);
  }
});

//her blok kaydırmada hamle guncelleme fonkunu cagırdım ki hamle sayısı artsın.

document.getElementById("row-btn-0").addEventListener("click", () => {
  moveCount++;
  updateMoveCounter();
  shiftBlockRowRight(0);
});
document.getElementById("row-btn-1").addEventListener("click", () => {
  moveCount++;
  updateMoveCounter();
  shiftBlockRowRight(1);
});
document.getElementById("row-btn-2").addEventListener("click", () => {
  moveCount++;
  updateMoveCounter();
  shiftBlockRowRight(2);
});

document.getElementById("col-btn-0").addEventListener("click", () => {
  moveCount++;
  updateMoveCounter();
  shiftBlockColumnUp(0);
});
document.getElementById("col-btn-1").addEventListener("click", () => {
  moveCount++;
  updateMoveCounter();
  shiftBlockColumnUp(1);
});
document.getElementById("col-btn-2").addEventListener("click", () => {
  moveCount++;
  updateMoveCounter();
  shiftBlockColumnUp(2);
});




//level degisince yeni gridim gelsin diye olusturdum
function gridGuncelleme(levelMatrix) {
  const newGrid = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowArr = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      const tile = levelMatrix[row][col];
      if (tile === 1) {
        rowArr.push("wall");
      } else if (tile === 0) {
        rowArr.push("path");
      } else if (tile === 2) {
        rowArr.push("chest");
      } else if (tile === 3) {
        rowArr.push("trap"); 
      }
    }
    newGrid.push(rowArr);
  }
  return newGrid;
}


//oyuncuyu tanımlıyorum
let player = {
  x: 0, // level1'deki x konumu
  y: 6, // level1'deki y konumu
  vx: 0, // yatay hız
  vy: 0, // düsey hiz
  width: 1, // genişliği
  height: 1, // bıyu
  direction: "down", // ilk konumda oyuncunun yuzu bize donuk olsun diye
  step: 0, // yürümesin ilk basta
  jumping: false, // zıplamasın ilk basta
  grounded: true, // yere degsin havada kalmasın.
};



//canvasta ciziyorum
function drawPlayer() {
  //piksel olarak konumları hesaplamak için:
  const x = Math.round(player.x * TILE_SIZE);
  const y = Math.round(player.y * TILE_SIZE);
  let imageToDraw = karakterOn; //ilk basta oyuncunun yuzu bize donuk olsun diye

  // yonlere gore hangi resimlerin oynatılacagını belirliyorum
  if (player.direction === "right") {
    imageToDraw = player.step % 2 === 0 ? karakterSag1 : karakterSag2;
  } else if (player.direction === "left") {
    imageToDraw = player.step % 2 === 0 ? karakterSol1 : karakterSol2;
  }
//çizme işlemi
  ctx.drawImage(imageToDraw, x, y, TILE_SIZE, TILE_SIZE);
}



function drawChest() {
  for (let row = 0; row < GRID_SIZE; row++) {///bu kısmı olusturuken aidan yardım aldım
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === "chest") {
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        if (Math.floor(player.x) === col && Math.floor(player.y) === row) {
          
          ctx.clearRect(x, y, TILE_SIZE, TILE_SIZE);//temizleme işlemi yapıyoruz oyuncu sandığa gelince cunku baska resim koycam(acık sandık resmi)

          
          ctx.drawImage(openChestImg, x, y, 55, 55);

          if (glowTriggered && glowTime < glowDuration) {
            drawGlowEffect(x, y);//ışıldama efekti vermek için sandık üzerinde
          }
        } else {
          //oyuncu sandığa ulasamazsa kapalı kalmaya devam etsin diye
          ctx.drawImage(chestImage, x, y, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }
}



function drawGlowEffect(x,y) {
  if (glowTriggered && glowTime < glowDuration) {
    glowTime++;
    //glow doğru yerde olsun diye ekstra eklemeye ihtiyac duydum
    const offsetX = 1; // Glow'un yatayda kaydırılması
    const offsetY = 1; // Glow'un dikeyde kaydırılması

    const glowX = hedef.x * TILE_SIZE + TILE_SIZE / 2 + offsetX;
    const glowY = hedef.y * TILE_SIZE + TILE_SIZE / 2 + offsetY;

    ctx.save();
    ctx.globalAlpha = 1 - (glowTime / glowDuration);
    ctx.fillStyle = "rgba(255, 255, 100, 0.6)";
    ctx.beginPath();
    ctx.arc(glowX, glowY, TILE_SIZE * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  
  }
}


function draw() {
  ctx.imageSmoothingEnabled = false; // yumusatma olmasın cunku keskin goruntu istiyorum

  ctx.clearRect(0, 0, baseWidth, baseHeight); // Canvası temizlemek icin

  // ustte buna benzer kod vardı onda aidan yardım almıstım bunda da benzer mantık kurdum
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;

      //hücre tiplerine gore ne cizilceğini belirliyorum
      if (grid[row][col] === "wall") {
        ctx.drawImage(wallImage, x, y, TILE_SIZE, TILE_SIZE);
      } 
      else if(grid[row][col] === "chest"){
        ctx.drawImage(chestImage, x, y, TILE_SIZE, TILE_SIZE);  
        }
      else if (grid[row][col] === "trap") {
        ctx.drawImage(trapImage, x,y, TILE_SIZE, TILE_SIZE);
        }

       
      else {
        ctx.fillStyle = "black"; // bu aslında bos kısımları siyah yapıyo, oyuncu buralardan gecebiliyor
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
    

  }
  //üstte olusturdugum fonkları cagırıyorum
  drawGridLines(); 
  drawPlayer(); 
  drawChest();
 if (glowTriggered && glowTime < glowDuration) {
    drawGlowEffect();
  }
}



function drawGridLines() {
  //oyuna ızgaraları cizsin diye 
  //burada aidan çok fazla yardım aldım
  //dikey çizgiler:
  for (let i = 0; i <= GRID_SIZE; i++) {
    const pos = i * TILE_SIZE;//cizginin x konumu
    ctx.beginPath();
    ctx.moveTo(pos, 0);//konum üstten baslasın diye
    ctx.lineTo(pos, baseHeight);
    // daha estetik goruntu için her 4ün katı çizgileri kalınlastırdım
    ctx.lineWidth = (i % 4 === 0) ? 3 : 0.5;
    ctx.strokeStyle = "#ffffff"; // beyaz yaptım
    ctx.stroke();
  }
  // yatay cizgiler:(dikeyle aynı mantık)
  for (let j = 0; j <= GRID_SIZE; j++) {
    const pos = j * TILE_SIZE;
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(baseWidth, pos);
    ctx.lineWidth = (j % 4 === 0) ? 3 : 0.5;
    ctx.strokeStyle = "#ffffff"; 
    ctx.stroke();
  }
}

// keys i const tanımlayınca oyuncu level2 de hareket edemiyordu bu yuzden let yaptım
let keys = {};
// Event listenerlar sayesinde klavye tus hareketlerini algılayabiliyoruz
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  // Prevent default browser behavior for arrow keys to avoid scrolling
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
    e.preventDefault();
  }
});
document.addEventListener("keyup", e => keys[e.key] = false);


 //0 a path dediğimiz için bu foksiyonda bu sekilde yazdık
function isTileWalkable(row, col) {
  return (
    row >= 0 &&
    row < GRID_SIZE &&
    col >= 0 &&
    col < GRID_SIZE &&
    grid[row][col] !== "wall" 
  );
}

//oyuncu zemine değiyor mu diye iskeletini olusturdum ama içini doldurmada aidan yardım aldım.
function isOnGround() {
  const tileBelowRow = Math.floor(player.y + player.height + 0.001);
  const tileLeftCol = Math.floor(player.x);
  const tileRightCol = Math.floor(player.x + player.width - 0.001);
//oyuncunun altında duvar varsa mantıken zeminle teması oldugunu anlatıyor.
  return (
    tileBelowRow < GRID_SIZE &&
    (grid[tileBelowRow][tileLeftCol] === "wall" || 
     grid[tileBelowRow][tileRightCol] === "wall")
  );
}

const speed = 0.02; // istediğim hızı bu değer karsıladı ozel acıklaması yok
const gravity = 0.03; // deneme yanılmayla olusturdum
const jumpPower = 0.280; // elle denedim en optimali buydu.



let animationId;
//ana fonksiyon bu aslında içi biraz uzun ve karmasık
function dongu() {
  
 player.vx = 0; //her karede hız sıfırlamak için
  if (keys["ArrowRight"]) {
    player.vx = speed;
    player.direction = "right";
    player.step++; // Animasyon hareket etsin diye ekliyoruz
  } else if (keys["ArrowLeft"]) {
    player.vx = -speed;
    player.direction = "left";
    player.step++; 
  } else {
    //yatayda hız yoksa adım 0 demektir oyunucun da yuzu bize donsun diye bunları yazdım
    player.step = 0;
    player.direction = "down"; }

  if (keys["ArrowUp"] && player.grounded) {
    player.vy = -jumpPower; // y konumu değişiyor zıplama y kordinatında ya
    player.jumping = true;
    player.grounded = false; // artık yere değmediği için zıpladıgında
  }

  
  player.vy += gravity;//hıza bunu eklememiz lazım oyun gercekci olmaz yoksa

  //yeni poziyonları hesaplamak için kullandım
  let newX = player.x + player.vx;
  let newY = player.y + player.vy;

  //guncellemelere devam ediyorum aidan yardım aldım burada
  const playerLeft = newX;
  const playerRight = newX + player.width;
  const playerTop = player.y;
  const playerBottom = player.y + player.height;

  // yatay çarğışmayı kontrol etmemiz gerek once false verelim
  let collidedX = false;
  //hücrelerin tipine gore kontrol yapıcaz
  const startCol = Math.floor(playerLeft);
  const endCol = Math.floor(playerRight);
  const startRow = Math.floor(playerTop);
  const endRow = Math.floor(playerBottom - 0.001); // -0.001 tasma olmaması içinmiş ai onerdi
  for (let r = startRow; r <= endRow; r++) {
    if (player.vx > 0) { //sağ için
      const tileCol = Math.floor(playerRight);
      if (!isTileWalkable(r, tileCol)) {
        newX = tileCol - player.width; // duvarın soluna hizlandı
        player.vx = 0; // hızı sıfırladım
        collidedX = true;
        break;
      }
    } else if (player.vx < 0) { //sol için
      const tileCol = Math.floor(playerLeft);
      if (!isTileWalkable(r, tileCol)) {
        newX = tileCol + 1; // duvarın sağına hizalandı
        player.vx = 0; // Stop horizontal movement
        collidedX = true;
        break;
      }
    }
  }

  // ayarlamaları yaptıktan sonra yeni x konumunu güncelliyorum
  player.x = newX;

  // oyuncu yatayda grid dısına cıkmasın diye
  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  } else if (player.x + player.width > GRID_SIZE) {
    player.x = GRID_SIZE - player.width;
    player.vx = 0;
  }
//dikey carpısma kontrolu mantıgı ustte yazdıgımla aynı
   const playerNewTop = newY;
  const playerNewBottom = newY + player.height;

  let collidedY = false;
  
  const vStartCol = Math.floor(player.x);
  const vEndCol = Math.floor(player.x + player.width - 0.001);
  const vStartRow = Math.floor(playerNewTop);
  const vEndRow = Math.floor(playerNewBottom);

  for (let c = vStartCol; c <= vEndCol; c++) {
    if (player.vy > 0) { // asagı için
      const tileRow = Math.floor(playerNewBottom);
      if (!isTileWalkable(tileRow, c)) {
        newY = tileRow - player.height; // duvarın ustune hizalansın diye aidan yardım aldım
        player.vy = 0; // hızı sıfırladım
        player.grounded = true; // yerde oldugu için dogru
        player.jumping = false;
        collidedY = true;
        break;
      }
    } else if (player.vy < 0) { // yukarı için
      const tileRow = Math.floor(playerNewTop);
      if (!isTileWalkable(tileRow, c)) {
        newY = tileRow + 1; // duvarın altına hizalamk için aidan yardım aldım
        player.vy = 0; 
        collidedY = true;
        break;
      }
    }
  }

  // carpısma yoksa oyuncu yerde değilse zeminde değil demektir bunun kontrolü
  if (!collidedY && !isOnGround()) {
    player.grounded = false;
  }

  // pozisyon guncellemesi
  player.y = newY;

  // oyuncu sınır dısına cıkmasın diye aidan yardım aldım
  if (player.y + player.height > GRID_SIZE) {
    player.y = GRID_SIZE - player.height;
    player.vy = 0;
    player.grounded = true;
    player.jumping = false;
  }
  
   
//sandığa ulastıgını belirlemek için:
 if (Math.floor(player.x) === hedef.x && Math.floor(player.y) === hedef.y && !gameWon) {
  
  gameWon = true;
  
 alkıs.volume = 1;    // sandık sesi ful yaptım az geliyordu
 alkıs.currentTime = 0;//o sırada background muzik çalmasın diye
 alkıs.play();
 
  glowTriggered = true;
  glowTime = 5; // animasyonu başlat

  // 1 saniye sonra bir sonraki seviyeye geçmek için aidan yardım aldım
  setTimeout(() => {
    if (currentLevel < levels.length - 1) {
      cancelAnimationFrame(animationId);
      levelGuncelleme(currentLevel + 1);
    } else {
       tebrikBastir();
    }
  }, 1000);
}

  if (glowTriggered && glowTime < glowDuration) {
  glowTime++;
}

const px = Math.floor(player.x);
const py = Math.floor(player.y);

if (grid[py][px] === "trap") {
  oyunBitisiGoster();//trape değerse oyunu bitir 
  return;
}


  
  //gene bu guncel halleri cizelim:
  draw();
  
  

   animationId = requestAnimationFrame(dongu);//dongu kontrolu için animation id kullanıyorum
}

function levelGuncelleme(levelIndex) {
  currentLevel = levelIndex;
  map = levels[currentLevel];
  grid = gridGuncelleme(map);
  
  // levele göre başlangıç pozisyonlarını ayarlıyorum
  if (currentLevel === 0) {
    player.x = 0;
    player.y = 6;
    hedef.x = 11;
    hedef.y = 6;
  } else if (currentLevel === 1) {
    player.x = 0;
    player.y = 2;
    hedef.x = 10;
    hedef.y = 8;
  } else if (currentLevel === 2) {
    player.x = 8;
    player.y = 6;
    hedef.x = 1;
    hedef.y = 1;
  
  }
  player.width = 1;
  player.height = 1;

  // oyun durumunu sıfırlıyorum sıfırlamadıgımda ikinci levelde konum hala birinci levelle aynı kalıyordu
    moveCount = 0;
  updateMoveCounter();
  showLevelTransition(levelIndex + 1);
  player.vx = 0;
  player.vy = 0;
  player.jumping = false;
  player.grounded = false;
  player.direction = "down";
  player.step = 0;

  gameWon = false;
  glowTriggered = false;
  glowTime = 0;
  keys = {};
  for (let key in keys) {
    keys[key] = false;
  }
  draw();
  
  cancelAnimationFrame(animationId);//mevcut seyleri sıfırlıyoruz ya bu da kareleri sıfırlamaya yarıyor
  

  animationId = requestAnimationFrame(dongu);

  
}
// donguyu cagırıp baslatalım
dongu();
