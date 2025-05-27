// Seletores dos elementos principais
const bgVideo = document.querySelector("#bg-video");
const musicName = document.querySelector("#musicName");
const musicAuthor = document.querySelector("#musicAuthor");
const playPauseButton = document.querySelector("#playPauseButton");
const prevButton = document.querySelector("#prevButton");
const nextButton = document.querySelector("#nextButton");
const currentTime = document.querySelector("#currentTime");
const duration = document.querySelector("#duration");
const progressBar = document.querySelector(".progress-bar");
const progress = document.querySelector(".progress");

import songs from "./songs.js";

const playlistItems = document.getElementById("playlistItems");

const textButtonPlay = `<i style="font-size: 4rem;" class='bx bx-play-circle'></i>`;
const textButtonPause = `<i style="font-size: 4rem;" class='bx bx-pause-circle'></i>`;

let index = 0;

// Botões de avançar e voltar
prevButton.onclick = () => prevNextMusic("prev");
nextButton.onclick = () => prevNextMusic();

playPauseButton.onclick = () => playPause();

// Função para tocar ou pausar
const playPause = () => {
  if (index === 0) {
    index = 1;
    setVideoSources(songs[index].src);
    musicName.innerHTML = songs[index].name;
    musicAuthor.textContent = songs[index].author || "";
    atualizarBackground();
    bgVideo.play();
    playPauseButton.innerHTML = textButtonPause;
    updateTime();
    atualizarBotoesAvanco();
    return;
  }

  if (bgVideo.paused) {
    if (index === songs.length - 1) {
      setVideoSources(songs[index].src);
      bgVideo.currentTime = 0;
    }
    bgVideo.play();
    if (index === songs.length - 1) {
      playPauseButton.innerHTML = `<i style="font-size: 4rem;" class='bx bx-stop-circle'></i>`;
    } else {
      playPauseButton.innerHTML = textButtonPause;
    }
  } else {
    bgVideo.pause();
    playPauseButton.innerHTML = textButtonPlay;
  }
};

// Atalhos de teclado
document.addEventListener("keydown", handleKeyPress);

function handleKeyPress(event) {
  const key = event.key;
  switch (key) {
    case " ":
      playPause();
      break;
    case "ArrowRight":
      prevNextMusic();
      break;
    case "ArrowLeft":
      prevNextMusic("prev");
      break;
  }
}

bgVideo.ontimeupdate = () => updateTime();

let isBuffering = false;

bgVideo.addEventListener('waiting', () => {
  isBuffering = true;
  currentTime.textContent = "Buffering...";
});

bgVideo.addEventListener('playing', () => {
  isBuffering = false;
  updateTime();
});

// Atualiza tempo e barra de progresso
const updateTime = () => {
  const durationFormatted = isNaN(bgVideo.duration) ? 0 : bgVideo.duration;
  const progressWidth = durationFormatted
    ? (bgVideo.currentTime / durationFormatted) * 100
    : 0;

  if (isBuffering) {
    currentTime.textContent = "Buffering...";
    duration.textContent = "-:--";
  } else if (
    !bgVideo.src ||
    isNaN(bgVideo.currentTime) ||
    (bgVideo.currentTime === 0 && durationFormatted === 0) ||
    index === songs.length - 1
  ) {
    currentTime.innerHTML = `<span style="opacity:0.5">-:--</span>`;
    duration.innerHTML = `<span style="opacity:0.5">-:--</span>`;
  } else {
    const currentMinutes = Math.floor(bgVideo.currentTime / 60);
    const currentSeconds = Math.floor(bgVideo.currentTime % 60);
    currentTime.textContent = currentMinutes + ":" + formatZero(currentSeconds);
  }

  if (index === songs.length - 1) {
    duration.innerHTML = `<button id="btn-ao-vivo" style="background:none;border:none;padding:0px;margin:3;font:inherit;color:red;cursor:pointer;display:inline-block;font-size:0.9rem;">AO VIVO</button>`;
  } else {
    duration.innerHTML = `<button id="btn-ao-vivo" style="background:none;border:none;padding:0px;margin:3;font:inherit;color:#ffffff86;opacity: 0.5;cursor:pointer;display:inline-block;font-size:0.9rem;">AO VIVO</button>`;
  }

  progress.style.width = progressWidth + "%";
};

// Troca o vídeo de fundo e configurações
function setVideoSources(src) {
  bgVideo.src = src;
  bgVideo.loop = (index === songs.length - 1);
  bgVideo.muted = (index === 0);
  bgVideo.play().catch(()=>{});
}

// Alterna entre a última faixa (ao vivo) e a segunda música ao clicar no botão AO VIVO
document.addEventListener("click", (e) => {
  if (e.target && e.target.id === "btn-ao-vivo") {
    e.preventDefault();
    setTimeout(() => {
      if (index === songs.length - 1) {
        index = 1;
      } else {
        index = songs.length - 1;
      }
      setVideoSources(songs[index].src);
      musicName.innerHTML = songs[index].name;
      playPause();
      updateTime();
      atualizarBotoesAvanco();
    }, 10);
  }
});

const formatZero = (n) => (n < 10 ? "0" + n : n);

// Permite clicar na barra de progresso para avançar o vídeo
progressBar.onclick = (e) => {
  const newTime = (e.offsetX / progressBar.offsetWidth) * bgVideo.duration;
  bgVideo.currentTime = newTime;
};

let bgToggle = false;

// Troca de música/vídeo
const prevNextMusic = (type = "next") => {
  if (type === "next") {
    index = (index + 1) % songs.length;
  } else if (type === "prev") {
    index = (index - 1 + songs.length) % songs.length;
  }
  setVideoSources(songs[index].src);
  musicName.innerHTML = songs[index].name;
  musicAuthor.textContent = songs[index].author || "";
  atualizarBackground();
  if (songs[index].src) {
    bgVideo.play().catch(()=>{});
    playPauseButton.innerHTML = textButtonPause;
  } else {
    playPauseButton.innerHTML = textButtonPlay;
  }
  updateTime();
  atualizarBotoesAvanco && atualizarBotoesAvanco();
};

// Cursor customizado
var cursor = document.querySelector('.cursor');
var cursorinner = document.querySelector('.cursor2');
var a = document.querySelectorAll('a');
var buttons = document.querySelectorAll('button');

document.addEventListener('mousemove', function(e){
  cursor.style.transform = `translate3d(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%), 0)`;
});

document.addEventListener('mousemove', function(e){
  var x = e.clientX;
  var y = e.clientY;
  cursorinner.style.left = x + 'px';
  cursorinner.style.top = y + 'px';
});

// Efeito de clique no cursor
document.addEventListener('mousedown', function(){
  cursor.classList.add('click');
  cursorinner.classList.add('cursorinnerhover');
});

document.addEventListener('mouseup', function(){
  cursor.classList.remove('click');
  cursorinner.classList.remove('cursorinnerhover');
});

// Cursor reage ao passar o mouse sobre links
a.forEach(item => {
  item.addEventListener('mouseover', () => {
    cursor.classList.add('hover');
  });
  item.addEventListener('mouseleave', () => {
    cursor.classList.remove('hover');
  });
});

// Cursor reage ao passar o mouse sobre botões
buttons.forEach(item => {
  item.addEventListener('mouseover', () => {
    cursor.classList.add('hover');
  });
  item.addEventListener('mouseleave', () => {
    cursor.classList.remove('hover');
  });
});

// Atualiza o estado dos botões de avançar e voltar conforme a música atual
function atualizarBotoesAvanco() {
  if (index === 0) {
    nextButton.disabled = true;
    prevButton.disabled = true;
    nextButton.classList.add('botao-desativado');
    prevButton.classList.add('botao-desativado');
  } else if (index === 1) {
    nextButton.disabled = false;
    prevButton.disabled = true;
    nextButton.classList.remove('botao-desativado');
    prevButton.classList.add('botao-desativado');
  } else if (index === songs.length - 2) {
    nextButton.disabled = true;
    prevButton.disabled = false;
    nextButton.classList.add('botao-desativado');
    prevButton.classList.remove('botao-desativado');
  } else if (index === songs.length - 1) {
    nextButton.disabled = true;
    prevButton.disabled = true;
    nextButton.classList.add('botao-desativado');
    prevButton.classList.add('botao-desativado');
  } else {
    nextButton.disabled = false;
    prevButton.disabled = false;
    nextButton.classList.remove('botao-desativado');
    prevButton.classList.remove('botao-desativado');
  }
}

// Efeito hover para o botão AO VIVO
document.addEventListener('mouseover', function(e) {
  if (e.target && e.target.id === "btn-ao-vivo") {
    cursor.classList.add('hover');
  }
});
document.addEventListener('mouseout', function(e) {
  if (e.target && e.target.id === "btn-ao-vivo") {
    cursor.classList.remove('hover');
  }
});

// Efeito hover para o nome da música
musicName.addEventListener('mouseover', () => {
  if (index !== 0 && index !== songs.length - 1) {
    cursor.classList.add('hover');
    musicName.style.cursor = 'pointer';
  } else {
    musicName.style.cursor = 'default';
  }
});
musicName.addEventListener('mouseleave', () => {
  cursor.classList.remove('hover');
  musicName.style.cursor = 'default';
});

// Efeito hover para a barra de progresso
progressBar.addEventListener('mouseover', () => {
  if (index !== songs.length - 1) {
    cursor.classList.add('hover');
  }
});
progressBar.addEventListener('mouseleave', () => {
  cursor.classList.remove('hover');
});

bgVideo.removeAttribute('controls');

// Avança para a próxima faixa ao terminar a reprodução
bgVideo.addEventListener('ended', () => {
  let next = index + 1;
  while (next < songs.length && !songs[next].src) {
    next++;
  }
  if (next < songs.length) {
    index = next;
    setVideoSources(songs[index].src);
    musicName.innerHTML = songs[index].name;
    bgVideo.play().catch(()=>{});
    playPauseButton.innerHTML = textButtonPause;
    updateTime();
    atualizarBotoesAvanco && atualizarBotoesAvanco();
  }
});

// Atualiza nome e autor ao trocar de faixa
function atualizarFaixa() {
  musicName.innerHTML = songs[index].name;
  musicAuthor.textContent = songs[index].author || "";
}

// Sempre que trocar de música, chama a função acima
atualizarFaixa();

window.addEventListener('DOMContentLoaded', () => {
  index = 1;
  atualizarBackground();
  setVideoSources(songs[index].src);
  musicName.innerHTML = songs[index].name;
  musicAuthor.textContent = songs[index].author || "";
  playPauseButton.innerHTML = `<i style="font-size: 4rem;" class='bx bx-pause-circle'></i>`;
  updateTime();
  atualizarBotoesAvanco && atualizarBotoesAvanco();
  bgVideo.play().catch(()=>{});
});

function atualizarBackground() {
  if (index === 0) {
    document.body.classList.add('body-capa');
  } else {
    document.body.classList.remove('body-capa');
  }
}

// Botão de tela cheia
document.getElementById('fullscreenButton').addEventListener('click', () => {
  const elem = document.documentElement;
  if (!document.fullscreenElement) {
    elem.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Alterna a exibição da playlist ao clicar no botão
document.addEventListener('DOMContentLoaded', () => {
  const playlistToggleButton = document.getElementById('playlistToggleButton');
  const playlistSection = document.getElementById('playlistSection');

  if (playlistToggleButton && playlistSection) {
    playlistToggleButton.addEventListener('click', () => {
      const isExpanded = playlistSection.classList.contains('expanded');
      if (isExpanded) {
        playlistSection.classList.remove('expanded');
        playlistToggleButton.setAttribute('aria-expanded', 'false');
      } else {
        playlistSection.classList.add('expanded');
        playlistToggleButton.setAttribute('aria-expanded', 'true');
      }
    });
  }
});

// --- Playlist ---

let currentSongIndex = 0;

// Renderiza a lista de músicas
function renderPlaylist(selectedIndex = 1) {
  playlistItems.innerHTML = "";
  for (let idx = 1; idx < songs.length - 1; idx++) {
    const song = songs[idx];
    const li = document.createElement("li");
    li.textContent = song.author ? `${song.name} - ${song.author}` : song.name;
    li.style.padding = "6px 2px";
    li.style.cursor = "pointer";
    li.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
    if (idx === selectedIndex) {
      li.style.fontWeight = "bold";
      li.style.background = "rgba(255,255,255,0.08)";
    }
    li.onclick = () => {
      selectSong(idx);
    };
    playlistItems.appendChild(li);
  }
}

// Seleciona uma música da playlist
function selectSong(idx) {
  currentSongIndex = idx;
  renderPlaylist(idx);
  musicName.textContent = songs[idx].name;
  musicAuthor.textContent = songs[idx].author;
  if (songs[idx].src) {
    bgVideo.src = songs[idx].src;
    bgVideo.play();
  } else {
    bgVideo.src = "";
  }
}

// Inicializa a playlist e exibe a primeira faixa visível
renderPlaylist(1);
selectSong(1);
