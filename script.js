// Elementos principais da interface
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

// Configuração inicial quando a página carrega
window.addEventListener('DOMContentLoaded', () => {
  index = 0;
  atualizarBackground();
  setVideoSources();
  atualizarFaixa();
  playPauseButton.innerHTML = textButtonPlay;
  updateTime();
  atualizarBotoesAvanco();
  renderPlaylist(0);
  
  // Tooltips nos botões principais
  playPauseButton.title = "Reproduzir/Pausar (Espaço)";
  prevButton.title = "Música anterior (Seta esquerda)";
  nextButton.title = "Próxima música (Seta direita)";
  playlistToggleButton.title = "Abrir playlist";
  playlistCloseButton.title = "Fechar playlist";
  document.getElementById('fullscreenButton').title = "Tela cheia";
  document.getElementById('pipButton').title = "Picture-in-Picture";
  progressBar.title = "Clique para navegar na música";
});

// Eventos dos botões principais
prevButton.onclick = () => prevNextMusic("prev");
nextButton.onclick = () => prevNextMusic();
playPauseButton.onclick = () => playPause();

// Suporte touch para dispositivos móveis
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

// Atalhos do teclado
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

// Eventos do player de vídeo
bgVideo.ontimeupdate = () => updateTime();

bgVideo.addEventListener('waiting', () => {
  isBuffering = true;
  currentTime.textContent = "Carregando...";
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
    // Volta o botão para play quando acaba
    playPauseButton.innerHTML = textButtonPlay;
  }
});

bgVideo.addEventListener('pause', hideControlsIfNotFullscreen);

// Atualiza informações da faixa
function atualizarFaixa() {
  musicName.innerHTML = songs[index].name;
  musicAuthor.textContent = songs[index].author || "";
  
  // Altera a cor do nome da música
  changeMusicNameColor();
}

// Navegação entre músicas
const prevNextMusic = (type = "next") => {
  if (type === "next") {
    index = (index + 1) % songs.length;
  } else if (type === "prev") {
    index = (index - 1 + songs.length) % songs.length;
  }

  renderPlaylist(index);
  bgVideo.pause();
  atualizarFaixa();
  atualizarBackground();
  atualizarBotoesAvanco();

  playPauseButton.innerHTML = `<i style="font-size: 4rem;" class='bx bx-loader-alt bx-spin'></i>`;

  if (songs[index].src) {
    setVideoSources(songs[index].src);

    const minLoadingTime = 200;
    const startTime = Date.now();

    bgVideo.oncanplay = null;
    bgVideo.oncanplay = () => {
      const elapsed = Date.now() - startTime;
      setTimeout(() => {
        playPauseButton.innerHTML = textButtonPause;
        updateTime();
      }, Math.max(0, minLoadingTime - elapsed));
      bgVideo.oncanplay = null;
    };

    bgVideo.play().catch(() => {
      playPauseButton.innerHTML = textButtonPlay;
      updateTime();
      bgVideo.oncanplay = null;
    });
  } else {
    setVideoSources('');
    playPauseButton.innerHTML = textButtonPlay;
    updateTime();
  }
};

// Controle principal de play/pause
const playPause = () => {
  if (index === 0) {
    index = 1;
    setVideoSources(songs[index].src);
    atualizarFaixa();
    atualizarBackground();
    playPauseButton.innerHTML = `<i style="font-size: 4rem;" class='bx bx-loader-alt bx-spin'></i>`;
    bgVideo.oncanplay = () => {
      playPauseButton.innerHTML = textButtonPause;
      updateTime();
      bgVideo.oncanplay = null;
    };
    bgVideo.play();
    atualizarBotoesAvanco();
    renderPlaylist(index);
    return;
  }

  if (bgVideo.paused) {
    if (index === songs.length - 1) {
      setVideoSources(songs[index].src);
      bgVideo.currentTime = 0;
    }
    playPauseButton.innerHTML = `<i style="font-size: 4rem;" class='bx bx-loader-alt bx-spin'></i>`;
    bgVideo.oncanplay = () => {
      if (index === songs.length - 1) {
        playPauseButton.innerHTML = `<i style="font-size: 4rem;" class='bx bx-stop-circle'></i>`;
      } else {
        playPauseButton.innerHTML = textButtonPause;
      }
      updateTime();
      bgVideo.oncanplay = null;
    };
    bgVideo.play();
  } else {
    bgVideo.pause();
    playPauseButton.innerHTML = textButtonPlay;
  }
};

// Atualiza timer e barra de progresso
const updateTime = () => {
  const durationFormatted = isNaN(bgVideo.duration) ? 0 : bgVideo.duration;
  const progressWidth = durationFormatted
    ? (bgVideo.currentTime / durationFormatted) * 100
    : 0;

  if (isBuffering && index !== 0) {
    currentTime.textContent = "Carregando...";
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

// Configura o vídeo de fundo
function setVideoSources(src) {
  if (src) {
    // Evento para monitorar o carregamento
    const loadingHandler = () => {
      currentTime.textContent = "Carregando...";
    };
    
    bgVideo.addEventListener('loadstart', loadingHandler);
    
    bgVideo.src = src;
    bgVideo.loop = (index === songs.length - 1);
    bgVideo.muted = false;
    bgVideo.load();
    
    // Remove o manipulador após o carregamento
    bgVideo.addEventListener('canplay', () => {
      bgVideo.removeEventListener('loadstart', loadingHandler);
      updateTime();
    }, { once: true });
  } else {
    bgVideo.src = '';
  }
}

// Controla estado dos botões prev/next
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

// Monta a lista de reprodução
function renderPlaylist(selectedIndex = 1) {
  playlistItems.innerHTML = ""; // Limpa a lista para evitar duplicação de eventos

  for (let idx = 1; idx < songs.length - 1; idx++) { // Começa em 1 e vai até o penúltimo índice
    const song = songs[idx];
    const li = document.createElement("li");
    li.textContent = song.author ? `${song.name} - ${song.author}` : song.name;
    li.style.padding = "6px 2px";
    li.style.cursor = "pointer";
    li.style.webkitTapHighlightColor = "rgba(255,255,255,0.1)";
    
    if (idx === selectedIndex) {
      li.style.fontWeight = "bold";
      li.style.background = "rgba(255,255,255,0.08)";
      li.style.borderRadius = "8px"; // Adiciona borda arredondada
      
      // Aplica a mesma cor do nome da música
      const currentColor = musicNameElement.style.color || "#ffffff86";
      li.style.color = currentColor;
    } else {
      li.style.color = "#ffffff86"; // Reseta a cor para os outros itens
      li.style.borderRadius = "";   // Remove o border-radius dos não selecionados
    }
    
    // Use onclick em vez de addEventListener para evitar potenciais duplicações
    const songIndex = idx; // Captura o índice em uma constante
    
    // Evento de clique para desktop
    li.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectSong(songIndex);
    };
    
    // Variáveis para controlar o toque
    let touchStartY = 0;
    let touchStartTime = 0;
    
    // Eventos específicos para toque
    li.addEventListener('touchstart', (e) => {
      // Guarda a posição inicial do toque
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      li.style.background = "rgba(255,255,255,0.15)";
    }, { passive: true });
    
    li.addEventListener('touchmove', (e) => {
      // Detecta movimento vertical maior que 10px
      const touchMoveY = e.touches[0].clientY;
      const deltaY = Math.abs(touchMoveY - touchStartY);
      
      if (deltaY > 10) {
        // Se o usuário deslizou mais de 10px, interpreta como scroll
        li.style.background = idx === selectedIndex ? 
          "rgba(255,255,255,0.08)" : "transparent";
      }
    }, { passive: true });
    
    li.addEventListener('touchend', (e) => {
      e.preventDefault();
      
      // Calcula o tempo e a distância do toque
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = Math.abs(touchEndY - touchStartY);
      
      // Considera como seleção apenas se:
      // 1. O movimento vertical foi menor que 10px (não foi um scroll)
      // 2. A duração do toque foi menor que 300ms (toque rápido)
      if (deltaY < 10 && touchDuration < 300) {
        selectSong(songIndex);
      } else {
        // Restaura o estilo se não for selecionado
        li.style.background = idx === selectedIndex ? 
          "rgba(255,255,255,0.08)" : "transparent";
      }
    });

    playlistItems.appendChild(li);
  }
}

// Seleciona música da playlist
function selectSong(idx) {
  index = idx;
  renderPlaylist(idx);
  bgVideo.pause();
  atualizarFaixa();
  atualizarBackground();
  atualizarBotoesAvanco();

  playPauseButton.innerHTML = `<i style="font-size: 4rem;" class='bx bx-loader-alt bx-spin'></i>`;

  if (songs[idx].src) {
    setVideoSources(songs[idx].src);

    const minLoadingTime = 200;
    const startTime = Date.now();

    // Remove qualquer listener anterior para evitar múltiplas execuções
    bgVideo.oncanplay = null;

    bgVideo.oncanplay = () => {
      const elapsed = Date.now() - startTime;
      setTimeout(() => {
        playPauseButton.innerHTML = textButtonPause;
        updateTime();
      }, Math.max(0, minLoadingTime - elapsed));
      bgVideo.oncanplay = null; // Remove o listener após executar
    };

    // Tenta dar play, mas só troca o botão no canplay
    bgVideo.play().catch((error) => {
      console.error("Erro ao reproduzir:", error);
      playPauseButton.innerHTML = textButtonPlay;
      updateTime();
      bgVideo.oncanplay = null;
    });
  } else {
    setVideoSources('');
    playPauseButton.innerHTML = textButtonPlay;
    updateTime();
  }
}

const formatZero = (n) => (n < 10 ? "0" + n : n);

// Clique na barra de progresso
progressBar.onclick = handleProgressClick;
progressBar.addEventListener('touchend', handleProgressClick);

function handleProgressClick(e) {
  e.preventDefault();
  const rect = progressBar.getBoundingClientRect();
  const offsetX = (e.clientX || e.touches?.[0]?.clientX || e.changedTouches?.[0]?.clientX) - rect.left;
  const newTime = (offsetX / progressBar.offsetWidth) * bgVideo.duration;
  bgVideo.currentTime = newTime;
}

// Botão AO VIVO - alterna entre stream e música normal
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

// Controles da playlist
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

// Desenha o vídeo no canvas
function drawToCanvas() {
  if (!bgVideo.paused && !bgVideo.ended) {
    ctx.drawImage(bgVideo, 0, 0, syncCanvas.width, syncCanvas.height);
  }
  requestAnimationFrame(drawToCanvas);
}

// Esconde controles fora do fullscreen
function hideControlsIfNotFullscreen() {
  const video = document.getElementById('bg-video');
  const isFullscreen =
    document.fullscreenElement === video ||
    document.webkitFullscreenElement === video ||
    document.mozFullScreenElement === video ||
    document.msFullscreenElement === video ||
    video.webkitDisplayingFullscreen; // iOS Safari

  if (!isFullscreen) {
    video.removeAttribute('controls');
    video.style.pointerEvents = 'none';
    // Pausa ao sair do fullscreen
    if (!video.paused) {
      video.pause();
      playPauseButton.innerHTML = textButtonPlay;
    }
  }
}

// Quando sai do fullscreen
function exitFullscreenHandler() {
  // Timeout maior pro iOS
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

// Eventos de fullscreen (incluindo iOS)
document.addEventListener('fullscreenchange', exitFullscreenHandler);
document.addEventListener('webkitfullscreenchange', exitFullscreenHandler);
document.addEventListener('mozfullscreenchange', exitFullscreenHandler);
document.addEventListener('msfullscreenchange', exitFullscreenHandler);

// iOS Safari específico
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

// Lista de cores da paleta Catppuccin
const catppuccinColors = [
  // Removido: 'var(--catppuccin-flamingo)',
  'var(--catppuccin-pink)',
  'var(--catppuccin-mauve)',
  'var(--catppuccin-red)',
  'var(--catppuccin-maroon)',
  'var(--catppuccin-peach)',
  'var(--catppuccin-yellow)',
  'var(--catppuccin-green)',
  'var(--catppuccin-teal)',
  'var(--catppuccin-sky)',
  'var(--catppuccin-blue)',
  'var(--catppuccin-lavender)',
];

// Seleciona o elemento do nome da música
const musicNameElement = document.getElementById('musicName');

// Função para alterar a cor do nome da música
function changeMusicNameColor() {
  // Não altera a cor na primeira faixa
  if (index === 0) {
    musicNameElement.style.color = ''; // Reseta para a cor padrão
    renderPlaylist(index); // Atualiza a playlist
    return;
  }

  // Escolhe uma cor aleatória da paleta
  const randomColor = catppuccinColors[Math.floor(Math.random() * catppuccinColors.length)];
  
  // Aplica a cor ao elemento
  musicNameElement.style.color = randomColor;

  // Atualiza a playlist com a nova cor
  renderPlaylist(index);
}

// função sempre que a música mudar
document.getElementById('nextButton').addEventListener('click', () => {
  changeMusicNameColor();
});

function togglePlaylist() {
  const playlistSection = document.getElementById('playlistSection');
  
  if (playlistSection.classList.contains('expanded')) {
    // Fechar playlist
    playlistSection.classList.add('closing');
    playlistSection.classList.remove('expanded');
    
    // Só esconde após a transição
    playlistSection.addEventListener('transitionend', function handler() {
      playlistSection.style.display = 'none';
      playlistSection.classList.remove('closing');
      playlistSection.removeEventListener('transitionend', handler);
    });
  } else {
    // Abrir playlist
    playlistSection.style.display = 'flex';
    // Força o reflow para garantir que a mudança de display seja aplicada
    void playlistSection.offsetWidth;
    playlistSection.classList.add('expanded');
  }
}
