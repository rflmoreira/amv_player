// Seletores dos elementos principais
const bgVideo = document.getElementById('bg-video');
const syncCanvas = document.getElementById('sync-canvas');
const ctx = syncCanvas.getContext('2d');
const musicName = document.querySelector("#musicName");
const musicAuthor = document.querySelector("#musicAuthor");
const playPauseButton = document.querySelector("#playPauseButton");
const prevButton = document.querySelector("#prevButton");
const nextButton = document.querySelector("#nextButton");
const currentTime = document.querySelector("#currentTime");
const duration = document.querySelector("#duration");
const progressBar = document.querySelector(".progress-bar");
const progress = document.querySelector(".progress");
const playlistItems = document.getElementById("playlistItems");
const playlistToggleButton = document.getElementById('playlistToggleButton');
const playlistSection = document.getElementById('playlistSection');
const playlistCloseButton = document.getElementById('playlistCloseButton');

import songs from "./songs.js";

const textButtonPlay = `<i style="font-size: 4rem;" class='bx bx-play-circle'></i>`;
const textButtonPause = `<i style="font-size: 4rem;" class='bx bx-pause-circle'></i>`;

let index = 0;
let isPlaying = false;
let isBuffering = false;

// Inicialização única ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
  index = 0;
  atualizarBackground();
  setVideoSources();
  atualizarFaixa();
  playPauseButton.innerHTML = textButtonPlay;
  updateTime();
  atualizarBotoesAvanco();
  renderPlaylist(0);
  
  // Adicionar tooltips nos botões
  playPauseButton.title = "Reproduzir/Pausar (Espaço)";
  prevButton.title = "Música anterior (Seta esquerda)";
  nextButton.title = "Próxima música (Seta direita)";
  playlistToggleButton.title = "Abrir playlist";
  playlistCloseButton.title = "Fechar playlist";
  document.getElementById('fullscreenButton').title = "Tela cheia";
  document.getElementById('pipButton').title = "Picture-in-Picture";
  progressBar.title = "Clique para navegar na música";
});

// Event listeners únicos
prevButton.onclick = () => prevNextMusic("prev");
nextButton.onclick = () => prevNextMusic();
playPauseButton.onclick = () => playPause();

// Adicionar eventos touch para iOS
prevButton.addEventListener('touchend', (e) => {
  e.preventDefault();
  prevNextMusic("prev");
});

nextButton.addEventListener('touchend', (e) => {
  e.preventDefault();
  prevNextMusic();
});

playPauseButton.addEventListener('touchend', (e) => {
  e.preventDefault();
  playPause();
});

playlistToggleButton.addEventListener('touchend', (e) => {
  e.preventDefault();
  playlistSection.classList.toggle('expanded');
});

playlistCloseButton.addEventListener('touchend', (e) => {
  e.preventDefault();
  playlistSection.classList.remove('expanded');
});

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

// Event listeners do vídeo
bgVideo.ontimeupdate = () => updateTime();

bgVideo.addEventListener('waiting', () => {
  isBuffering = true;
  currentTime.textContent = "Buffering...";
});

bgVideo.addEventListener('playing', () => {
  isBuffering = false;
  updateTime();
});

bgVideo.addEventListener('play', () => {
  drawToCanvas();
});

bgVideo.addEventListener('ended', () => {
  let next = index + 1;
  while (next < songs.length && !songs[next].src) {
    next++;
  }
  if (next < songs.length) {
    index = next;
    setVideoSources(songs[index].src);
    atualizarFaixa();
    bgVideo.play().catch(()=>{});
    playPauseButton.innerHTML = textButtonPause;
    updateTime();
    atualizarBotoesAvanco();
    renderPlaylist(index);
  } else {
    // Adicionar esta linha para mudar o botão para play quando não há próxima música
    playPauseButton.innerHTML = textButtonPlay;
  }
});

bgVideo.addEventListener('pause', hideControlsIfNotFullscreen);

// Função para tocar ou pausar
const playPause = () => {
  if (index === 0) {
    index = 1;
    setVideoSources(songs[index].src);
    atualizarFaixa();
    atualizarBackground();
    bgVideo.play();
    playPauseButton.innerHTML = textButtonPause;
    updateTime();
    atualizarBotoesAvanco();
    renderPlaylist(index);
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

// Troca de música/vídeo
const prevNextMusic = (type = "next") => {
  if (type === "next") {
    index = (index + 1) % songs.length;
  } else if (type === "prev") {
    index = (index - 1 + songs.length) % songs.length;
  }
  setVideoSources(songs[index].src);
  atualizarFaixa();
  atualizarBackground();
  if (songs[index].src) {
    bgVideo.play().catch(()=>{});
    playPauseButton.innerHTML = textButtonPause;
  } else {
    playPauseButton.innerHTML = textButtonPlay;
  }
  updateTime();
  atualizarBotoesAvanco();
  renderPlaylist(index);
};

// Atualiza tempo e barra de progresso
const updateTime = () => {
  const durationFormatted = isNaN(bgVideo.duration) ? 0 : bgVideo.duration;
  const progressWidth = durationFormatted
    ? (bgVideo.currentTime / durationFormatted) * 100
    : 0;

  if (isBuffering && index !== 0) {
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
  if (src) {
    bgVideo.src = src;
    bgVideo.loop = (index === songs.length - 1);
    bgVideo.muted = false;
    bgVideo.load();
  } else {
    bgVideo.src = '';
  }
}

// Atualiza nome e autor ao trocar de faixa
function atualizarFaixa() {
  musicName.innerHTML = songs[index].name;
  musicAuthor.textContent = songs[index].author || "";
}

// Atualiza o estado dos botões de avançar e voltar
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

function atualizarBackground() {
  if (index === 0) {
    document.body.classList.add('body-capa');
  } else {
    document.body.classList.remove('body-capa');
  }
}

// Renderiza a lista de músicas
function renderPlaylist(selectedIndex = 1) {
  playlistItems.innerHTML = "";
  for (let idx = 1; idx < songs.length - 1; idx++) {
    const song = songs[idx];
    const li = document.createElement("li");
    li.textContent = song.author ? `${song.name} - ${song.author}` : song.name;
    li.style.padding = "6px 2px";
    li.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
    li.style.cursor = "pointer";
    li.style.webkitTapHighlightColor = "rgba(255,255,255,0.1)";
    
    if (idx === selectedIndex) {
      li.style.fontWeight = "bold";
      li.style.background = "rgba(255,255,255,0.08)";
    }
    
    // Adicionar eventos click e touch
    li.onclick = () => selectSong(idx);
    li.addEventListener('touchend', (e) => {
      e.preventDefault();
      selectSong(idx);
    });
    
    playlistItems.appendChild(li);
  }
}

// Seleciona uma música da playlist
function selectSong(idx) {
  index = idx;
  renderPlaylist(idx);
  atualizarFaixa();
  
  if (songs[idx].src) {
    setVideoSources(songs[idx].src);
    // Adicionar reprodução automática
    bgVideo.play().catch(() => {});
    playPauseButton.innerHTML = textButtonPause;
  } else {
    setVideoSources('');
    playPauseButton.innerHTML = textButtonPlay;
  }
  
  atualizarBackground();
  updateTime();
  atualizarBotoesAvanco();
}

const formatZero = (n) => (n < 10 ? "0" + n : n);

// Permite clicar na barra de progresso para avançar o vídeo
progressBar.onclick = handleProgressClick;
progressBar.addEventListener('touchend', handleProgressClick);

function handleProgressClick(e) {
  e.preventDefault();
  const rect = progressBar.getBoundingClientRect();
  const offsetX = (e.clientX || e.touches?.[0]?.clientX || e.changedTouches?.[0]?.clientX) - rect.left;
  const newTime = (offsetX / progressBar.offsetWidth) * bgVideo.duration;
  bgVideo.currentTime = newTime;
}

// Alterna entre a última faixa (ao vivo) e a segunda música ao clicar no botão AO VIVO
document.addEventListener("click", handleAoVivoClick);
document.addEventListener("touchend", handleAoVivoClick);

function handleAoVivoClick(e) {
  if (e.target && e.target.id === "btn-ao-vivo") {
    e.preventDefault();
    e.stopPropagation();
    
    setTimeout(() => {
      if (index === songs.length - 1) {
        index = 1;
      } else {
        index = songs.length - 1;
      }
      setVideoSources(songs[index].src);
      atualizarFaixa();
      playPause();
      updateTime();
      atualizarBotoesAvanco();
      renderPlaylist(index);
    }, 10);
  }
}

// Controles de playlist
playlistToggleButton.addEventListener('click', () => {
  togglePlaylist();
});

playlistToggleButton.addEventListener('touchend', (e) => {
  e.preventDefault();
  togglePlaylist();
});

playlistCloseButton.addEventListener('click', () => {
  togglePlaylist();
});

playlistCloseButton.addEventListener('touchend', (e) => {
  e.preventDefault();
  togglePlaylist();
});

// Canvas drawing
function drawToCanvas() {
  if (!bgVideo.paused && !bgVideo.ended) {
    ctx.drawImage(bgVideo, 0, 0, syncCanvas.width, syncCanvas.height);
  }
  requestAnimationFrame(drawToCanvas);
}

// Função para esconder os controles quando não estiver em tela cheia
function hideControlsIfNotFullscreen() {
  const video = document.getElementById('bg-video');
  const isFullscreen =
    document.fullscreenElement === video ||
    document.webkitFullscreenElement === video ||
    document.mozFullScreenElement === video ||
    document.msFullscreenElement === video ||
    video.webkitDisplayingFullscreen; // Específico para iOS Safari

  if (!isFullscreen) {
    video.removeAttribute('controls');
    video.style.pointerEvents = 'none';
    // Pausar a reprodução ao sair da tela cheia
    if (!video.paused) {
      video.pause();
      playPauseButton.innerHTML = textButtonPlay;
    }
  }
}

// Handler de saída do fullscreen
function exitFullscreenHandler() {
  // Timeout maior para iOS
  setTimeout(hideControlsIfNotFullscreen, 200);
}

// Botão de tela cheia
document.getElementById('fullscreenButton').addEventListener('click', function () {
  const video = document.getElementById('bg-video');
  video.setAttribute('controls', 'controls');
  video.style.pointerEvents = 'auto';

  if (video.requestFullscreen) {
    video.requestFullscreen();
  } else if (video.webkitEnterFullscreen) {
    video.webkitEnterFullscreen();
  } else if (video.webkitRequestFullscreen) {
    video.webkitRequestFullscreen();
  } else if (video.msRequestFullscreen) {
    video.msRequestFullscreen();
  }
});

// Event listeners de fullscreen (adicionar mais eventos para iOS)
document.addEventListener('fullscreenchange', exitFullscreenHandler);
document.addEventListener('webkitfullscreenchange', exitFullscreenHandler);
document.addEventListener('mozfullscreenchange', exitFullscreenHandler);
document.addEventListener('msfullscreenchange', exitFullscreenHandler);

// Específico para iOS Safari
bgVideo.addEventListener('webkitendfullscreen', exitFullscreenHandler);
bgVideo.addEventListener('webkitbeginfullscreen', () => {
  // Quando entra em fullscreen no iOS
  bgVideo.setAttribute('controls', 'controls');
});

// Picture-in-Picture
document.getElementById('pipButton').addEventListener('click', async () => {
  if (document.pictureInPictureElement) {
    await document.exitPictureInPicture();
  } else {
    try {
      await bgVideo.requestPictureInPicture();
    } catch (error) {
      console.error('Erro ao ativar PiP:', error);
    }
  }
});

// Exemplo de como modificar o JavaScript para usar a animação
function togglePlaylist() {
  const playlistSection = document.getElementById('playlistSection');
  
  if (playlistSection.classList.contains('expanded')) {
    // Fechar playlist
    playlistSection.classList.add('closing');
    playlistSection.classList.remove('expanded');
    
    setTimeout(() => {
      playlistSection.style.display = 'none';
      playlistSection.classList.remove('closing');
    }, 300); // Tempo da transição
  } else {
    // Abrir playlist
    playlistSection.style.display = 'flex';
    // Força o reflow para garantir que a mudança de display seja aplicada
    playlistSection.offsetHeight;
    playlistSection.classList.add('expanded');
  }
}
