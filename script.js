// Elementos que vou usar na interface.
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
const waveAnimation = document.getElementById('wave-animation');

// Elementos do mini player.
const mainPlayer = document.getElementById('main-player');
const miniPlayer = document.getElementById('mini-player');
const minimizeButton = document.getElementById('minimizeButton');
const restoreButton = document.getElementById('restoreButton');
const miniPlayPauseButton = document.getElementById('mini-play-pause-button');
const miniMusicName = document.getElementById('mini-music-name');
const miniMusicAuthor = document.getElementById('mini-music-author');


import songs from "./songs.js";

// Defino os ícones do player principal.
const textButtonPlay = `<i style="font-size: 4rem;" class='bx bx-play-circle'></i>`;
const textButtonPause = `<i style="font-size: 4rem;" class='bx bx-pause-circle'></i>`;
const textButtonStop = `<i style="font-size: 4rem;" class='bx bx-stop-circle'></i>`;
const textButtonLoading = `<i style="font-size: 4rem;" class='bx bx-loader-alt bx-spin'></i>`;

// Ícones do mini player, para ficar igual ao principal.
const miniIconPlay = `<i class='bx bx-play-circle'></i>`;
const miniIconPause = `<i class='bx bx-pause-circle'></i>`;
const miniIconStop = `<i class='bx bx-stop-circle'></i>`;
const miniIconLoading = `<i class='bx bx-loader-alt bx-spin'></i>`;

// --- novo: lógica fundo aleatório ---
// array com os caminhos das imagens de fundo
const backgroundImages = [
    'src/background/Naruto.jpg',
    'src/background/Nezuko.jpg',
    'src/background/Shinji.jpg',
];

// Função para definir uma imagem de fundo aleatória
const setRandomBackground = () => {
    // Escolhe um índice aleatório do array de imagens
    const randomIndex = Math.floor(Math.random() * backgroundImages.length);
    // Pega o caminho da imagem correspondente
    const randomImage = backgroundImages[randomIndex];
    // Define a variável CSS '--bg-image' no elemento raiz (<html>), que será usada pelo style.css
    document.documentElement.style.setProperty('--bg-image', `url('${randomImage}')`);
};
// --- FIM DA NOVA LÓGICA ---


// Variáveis de estado.
let index = 0;
let isPlaying = false;
let isBuffering = false;
let isLiveMode = false;
let livePlaylistIndex = 1; 
let lastLiveSong = null;
let lastLiveTime = 0;
let liveExitTime = 0;
let currentSongColor = 'var(--catppuccin-lavender)';

// Função para ajustar o vídeo de fundo e preencher a tela.
const adjustVideoSize = () => {
    // Se não tiver vídeo ou ele não carregou ainda, não continua.
    if (!bgVideo || bgVideo.videoWidth === 0) {
        return;
    }

    const videoRatio = bgVideo.videoWidth / bgVideo.videoHeight;
    const windowRatio = window.innerWidth / window.innerHeight;

    // Reseto o estilo para poder calcular de novo.
    bgVideo.style.width = 'auto';
    bgVideo.style.height = 'auto';

    if (windowRatio > videoRatio) {
        // Se a janela for mais larga, o vídeo acompanha a largura.
        bgVideo.style.width = '100vw';
    } else {
        // Se for mais alta, o vídeo acompanha a altura.
        bgVideo.style.height = '100vh';
    }
};

// Checo as capacidades do dispositivo, principalmente mobile.
const checkDeviceCapabilities = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;
  
  console.log('Capacidades do dispositivo:', { isIOS, isAndroid, isMobile, pipEnabled: document.pictureInPictureEnabled });
  
  // Atualizo a dica do botão PiP dependendo do suporte.
  const pipButton = document.getElementById('pipButton');
  if (pipButton) {
    if (!document.pictureInPictureEnabled) {
      pipButton.style.opacity = '0.5';
      pipButton.title = "Picture-in-Picture não disponível neste dispositivo";
    } else {
      pipButton.style.opacity = '1';
      pipButton.title = "Picture-in-Picture";
    }
  }
  
  return { isIOS, isAndroid, isMobile };
};

// Salvo o estado do modo "ao vivo" no localStorage.
const saveLiveState = () => {
  if (isLiveMode) {
    const state = {
      lastLiveSong: livePlaylistIndex,
      lastLiveTime: bgVideo.currentTime || 0,
      liveExitTime: Date.now()
    };
    localStorage.setItem('amvPlayerLiveState', JSON.stringify(state));
  }
};

// Carrego o estado salvo.
const loadLiveState = () => {
  const saved = localStorage.getItem('amvPlayerLiveState');
  if (saved) {
    try {
      const state = JSON.parse(saved);
      lastLiveSong = state.lastLiveSong;
      lastLiveTime = state.lastLiveTime;
      liveExitTime = state.liveExitTime;
      console.log('Estado ao vivo carregado:', state);
    } catch (error) {
      console.error('Erro ao carregar estado ao vivo:', error);
    }
  }
};

// Mudo a dica do botão de play se estiver no modo "ao vivo".
const updatePlayButtonTooltip = () => {
  if (isLiveMode) {
    playPauseButton.title = "Pausar/Retomar transmissão ao vivo (Espaço)";
  } else {
    playPauseButton.title = "Reproduzir/Pausar (Espaço)";
  }
};

// Configuração inicial quando a página carrega.
window.addEventListener('DOMContentLoaded', () => {
  setRandomBackground(); // Define o fundo aleatório ao carregar
  checkDeviceCapabilities();
  loadLiveState();
  
  index = 0;
  setVideoSources();
  atualizarFaixa();
  playPauseButton.innerHTML = textButtonPlay;
  miniPlayPauseButton.innerHTML = miniIconPlay;
  updateTime();
  atualizarBotoesAvanco();
  renderPlaylist(0);
  adjustVideoSize();
  
  // Dicas dos botões.
  playPauseButton.title = "Reproduzir/Pausar (Espaço)";
  prevButton.title = "Música anterior (Seta esquerda)";
  nextButton.title = "Próxima música (Seta direita)";
  playlistToggleButton.title = "Abrir playlist";
  playlistCloseButton.title = "Fechar playlist";
  document.getElementById('pipButton').title = "Picture-in-Picture";
  progressBar.title = "Clique para navegar na música";
  
  updatePlayButtonTooltip();
  
  if (lastLiveSong !== null && liveExitTime > 0) {
    playPauseButton.title = "Retomar transmissão ao vivo (Espaço)";
  }
  
  // Configuração do botão PiP.
  const pipButton = document.getElementById('pipButton');
  if (pipButton) {
    const handlePiP = async function (e) {
      e.preventDefault();
      e.stopPropagation();
      
      if (!document.pictureInPictureEnabled || !bgVideo.requestPictureInPicture) {
        console.log('PiP não está disponível');
        const originalText = pipButton.innerHTML;
        pipButton.innerHTML = 'PiP não disponível';
        pipButton.style.opacity = '0.5';
        setTimeout(() => {
          pipButton.innerHTML = originalText;
          pipButton.style.opacity = '1';
        }, 2000);
        return;
      }
      
      if (!bgVideo.src || bgVideo.readyState < 2) {
        console.log('Vídeo não está pronto para PiP');
        return;
      }
      
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await bgVideo.requestPictureInPicture();
        }
      } catch (error) {
        console.error('Erro no PiP:', error);
        const originalText = pipButton.innerHTML;
        pipButton.innerHTML = 'Erro ao ativar PiP';
        pipButton.style.opacity = '0.5';
        setTimeout(() => {
          pipButton.innerHTML = originalText;
          pipButton.style.opacity = '1';
        }, 2000);
      }
    };
    
    pipButton.addEventListener('click', handlePiP);
    pipButton.addEventListener('touchend', handlePiP);
  }
});

// Eventos para o vídeo.
window.addEventListener('resize', adjustVideoSize);
bgVideo.addEventListener('loadedmetadata', adjustVideoSize);


// Salvo o estado antes de fechar a página.
window.addEventListener('beforeunload', () => {
  if (isLiveMode) {
    saveLiveState();
  }
});

// Salvo o estado periodicamente no modo ao vivo.
setInterval(() => {
  if (isLiveMode && !bgVideo.paused) {
    lastLiveSong = livePlaylistIndex;
    lastLiveTime = bgVideo.currentTime || 0;
    liveExitTime = Date.now();
    saveLiveState();
  }
}, 5000);

// --- Controles do Mini Player ---
minimizeButton.onclick = () => {
    mainPlayer.classList.add('minimized');
    miniPlayer.classList.remove('minimized');
};

restoreButton.onclick = () => {
    mainPlayer.classList.remove('minimized');
    miniPlayer.classList.add('minimized');
};

// Suporte a toque para minimizar/restaurar.
minimizeButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    mainPlayer.classList.add('minimized');
    miniPlayer.classList.remove('minimized');
});

restoreButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    mainPlayer.classList.remove('minimized');
    miniPlayer.classList.add('minimized');
});

miniPlayPauseButton.onclick = () => playPause();

// Botões principais.
prevButton.onclick = () => prevNextMusic("prev");
nextButton.onclick = () => prevNextMusic();
playPauseButton.onclick = () => playPause();

// Suporte a toque para os botões.
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

// Atalhos do teclado.
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

// Eventos do player de vídeo.
bgVideo.ontimeupdate = () => updateTime();

bgVideo.addEventListener('waiting', () => {
  isBuffering = true;
  if (!isLiveMode) {
    currentTime.textContent = "Carregando...";
  }
});

bgVideo.addEventListener('playing', () => {
  isBuffering = false;
  isPlaying = true;
  waveAnimation.classList.add('playing');
  playPauseButton.innerHTML = isLiveMode ? textButtonStop : textButtonPause;
  miniPlayPauseButton.innerHTML = isLiveMode ? miniIconStop : miniIconPause;
  updateTime();
  renderPlaylist(index);
});

bgVideo.addEventListener('play', () => {
  // Adiciona a classe para mostrar o vídeo e esconder a capa
  document.body.classList.add('video-reproduzindo');
  isPlaying = true;
  waveAnimation.classList.add('playing');
  playPauseButton.innerHTML = isLiveMode ? textButtonStop : textButtonPause;
  miniPlayPauseButton.innerHTML = isLiveMode ? miniIconStop : miniIconPause;
  renderPlaylist(index);
  
  if (isLiveMode && lastLiveSong !== null && liveExitTime > 0) {
    const timeAway = (Date.now() - liveExitTime) / 1000;
    const projectedTime = lastLiveTime + timeAway;
    
    console.log('Retomando modo ao vivo. Tempo projetado:', projectedTime);
    
    if (bgVideo.duration && !isNaN(bgVideo.duration) && projectedTime >= bgVideo.duration) {
      setTimeout(() => {
        livePlaylistIndex++;
        
        if (livePlaylistIndex >= songs.length - 1) {
          const validSongs = songs.slice(1, -1).map((s, i) => s.src ? i + 1 : -1).filter(i => i !== -1);
          livePlaylistIndex = validSongs.length > 0 ? validSongs[Math.floor(Math.random() * validSongs.length)] : 1;
        }
        
        while (livePlaylistIndex < songs.length - 1 && !songs[livePlaylistIndex].src) {
          livePlaylistIndex++;
        }
        
        index = livePlaylistIndex;
        setVideoSources(songs[index].src);
        atualizarFaixa();
        
        const nextSongHandler = () => {
          if (bgVideo.duration && !isNaN(bgVideo.duration)) {
            const overflowTime = projectedTime - bgVideo.duration;
            bgVideo.currentTime = Math.max(0, Math.min(overflowTime, bgVideo.duration * 0.9));
          }
          updateTime();
          atualizarBotoesAvanco();
          renderPlaylist(index);
          bgVideo.removeEventListener('canplay', nextSongHandler);
        };
        
        bgVideo.addEventListener('canplay', nextSongHandler, { once: true });
        bgVideo.play().catch(() => {});
      }, 100);
    } else if (bgVideo.duration && !isNaN(bgVideo.duration)) {
      setTimeout(() => {
        bgVideo.currentTime = Math.min(projectedTime, bgVideo.duration * 0.95);
      }, 100);
    }
  }
  
  drawToCanvas();
});

bgVideo.addEventListener('ended', () => {
  // Remove a classe para mostrar a capa novamente
  document.body.classList.remove('video-reproduzindo');
  waveAnimation.classList.remove('playing');
  if (isLiveMode) {
    livePlaylistIndex++;
    
    if (livePlaylistIndex >= songs.length - 1) {
      const validSongs = songs.slice(1, -1).map((s, i) => s.src ? i + 1 : -1).filter(i => i !== -1);
      livePlaylistIndex = validSongs.length > 0 ? validSongs[Math.floor(Math.random() * validSongs.length)] : 1;
    }
    
    while (livePlaylistIndex < songs.length - 1 && !songs[livePlaylistIndex].src) {
      livePlaylistIndex++;
    }
    
    if (livePlaylistIndex < songs.length - 1 && songs[livePlaylistIndex].src) {
      index = livePlaylistIndex;
      setVideoSources(songs[index].src);
      atualizarFaixa();
      
      const startFromBeginningHandler = () => {
        if (bgVideo.duration && !isNaN(bgVideo.duration)) bgVideo.currentTime = 0;
        bgVideo.removeEventListener('canplay', startFromBeginningHandler);
      };
      
      bgVideo.addEventListener('canplay', startFromBeginningHandler, { once: true });
      bgVideo.play().catch(()=>{});
      playPauseButton.innerHTML = isLiveMode ? textButtonStop : textButtonPause;
      miniPlayPauseButton.innerHTML = isLiveMode ? miniIconStop : miniIconPause;
      updateTime();
      atualizarBotoesAvanco();
      renderPlaylist(index);
    }
  } else {
    let next = index + 1;
    while (next < songs.length && !songs[next].src) next++;
    
    if (next < songs.length) {
      index = next;
      setVideoSources(songs[index].src);
      atualizarFaixa();
      bgVideo.play().catch(()=>{});
      playPauseButton.innerHTML = isLiveMode ? textButtonStop : textButtonPause;
      miniPlayPauseButton.innerHTML = isLiveMode ? miniIconStop : miniIconPause;
      updateTime();
      atualizarBotoesAvanco();
      renderPlaylist(index);
    } else {
      playPauseButton.innerHTML = textButtonPlay;
      miniPlayPauseButton.innerHTML = miniIconPlay;
    }
  }
});

bgVideo.addEventListener('pause', () => {
  // Remove a classe para mostrar a capa novamente
  if (bgVideo.currentTime !== bgVideo.duration) {
      document.body.classList.remove('video-reproduzindo');
  }
  isPlaying = false;
  waveAnimation.classList.remove('playing');
  playPauseButton.innerHTML = textButtonPlay;
  miniPlayPauseButton.innerHTML = miniIconPlay;
  renderPlaylist(index);

  if (isLiveMode) {
    lastLiveSong = livePlaylistIndex;
    lastLiveTime = bgVideo.currentTime || 0;
    liveExitTime = Date.now();
    saveLiveState();
    console.log('Pausado no modo ao vivo. Estado salvo:', lastLiveSong, lastLiveTime);
  }
});

// Atualiza as informações da faixa na tela.
function atualizarFaixa() {
  const { name, author } = songs[index];
  musicName.innerHTML = name;
  musicAuthor.textContent = author || "";
  
  miniMusicName.textContent = name;
  miniMusicAuthor.textContent = author || "";

  changeMusicNameColor();
}

// Navega entre as músicas.
const prevNextMusic = (type = "next") => {
  if (isLiveMode) {
    lastLiveSong = livePlaylistIndex;
    lastLiveTime = bgVideo.currentTime || 0;
    liveExitTime = Date.now();
    saveLiveState();
    console.log('Saindo do modo ao vivo. Estado salvo:', lastLiveSong, lastLiveTime);
  }
  
  isLiveMode = false;
  
  if (type === "next") {
    index = (index + 1) % songs.length;
  } else {
    index = (index - 1 + songs.length) % songs.length;
  }

  bgVideo.pause();
  atualizarFaixa();
  renderPlaylist(index);
  atualizarBotoesAvanco();

  playPauseButton.innerHTML = textButtonLoading;
  miniPlayPauseButton.innerHTML = miniIconLoading;

  if (songs[index].src) {
    setVideoSources(songs[index].src);

    const minLoadingTime = 200;
    const startTime = Date.now();

    const canPlayHandler = () => {
      const elapsed = Date.now() - startTime;
      setTimeout(() => {
        playPauseButton.innerHTML = isLiveMode ? textButtonStop : textButtonPause;
        miniPlayPauseButton.innerHTML = isLiveMode ? miniIconStop : miniIconPause;
        updateTime();
      }, Math.max(0, minLoadingTime - elapsed));
    };
    bgVideo.addEventListener('canplay', canPlayHandler, { once: true });
    bgVideo.addEventListener('playing', canPlayHandler, { once: true });

    bgVideo.play().catch((error) => {
      console.error("Erro ao tocar:", error);
      playPauseButton.innerHTML = textButtonPlay;
      miniPlayPauseButton.innerHTML = miniIconPlay;
      updateTime();
      bgVideo.removeEventListener('canplay', canPlayHandler);
      bgVideo.removeEventListener('playing', canPlayHandler);
    });
  } else {
    setVideoSources('');
    playPauseButton.innerHTML = textButtonPlay;
    miniPlayPauseButton.innerHTML = miniIconPlay;
    updateTime();
  }
};

// Controle principal de play/pause.
const playPause = () => {
  if (index === 0) {
    console.log('Iniciando modo ao vivo');
    isLiveMode = true;
    
    if (lastLiveSong !== null && liveExitTime > 0) {
      console.log('Retomando transmissão:', lastLiveSong, lastLiveTime);
      const timeAway = (Date.now() - liveExitTime) / 1000;
      livePlaylistIndex = lastLiveSong;
      const projectedTime = lastLiveTime + timeAway;
      
      if (songs[livePlaylistIndex] && songs[livePlaylistIndex].src) {
        index = livePlaylistIndex;
        setVideoSources(songs[index].src);
        atualizarFaixa();
        bgVideo.loop = false;
        
        playPauseButton.innerHTML = textButtonLoading;
        miniPlayPauseButton.innerHTML = miniIconLoading;
        
        const resumeHandler = () => {
          if (bgVideo.duration && !isNaN(bgVideo.duration)) {
            if (projectedTime >= bgVideo.duration) {
              livePlaylistIndex++;
              if (livePlaylistIndex >= songs.length - 1) {
                const validSongs = songs.slice(1, -1).map((s, i) => s.src ? i + 1 : -1).filter(i => i !== -1);
                livePlaylistIndex = validSongs.length > 0 ? validSongs[Math.floor(Math.random() * validSongs.length)] : 1;
              }
              while (livePlaylistIndex < songs.length - 1 && !songs[livePlaylistIndex].src) livePlaylistIndex++;
              
              index = livePlaylistIndex;
              setVideoSources(songs[index].src);
              atualizarFaixa();
              
              const nextSongHandler = () => {
                if (bgVideo.duration && !isNaN(bgVideo.duration)) {
                  const overflowTime = projectedTime - bgVideo.duration;
                  bgVideo.currentTime = Math.max(0, Math.min(overflowTime, bgVideo.duration * 0.9));
                }
                playPauseButton.innerHTML = textButtonStop;
                miniPlayPauseButton.innerHTML = miniIconStop;
                updateTime();
                atualizarBotoesAvanco();
                renderPlaylist(index);
                updatePlayButtonTooltip();
                bgVideo.removeEventListener('canplay', nextSongHandler);
              };
              bgVideo.addEventListener('canplay', nextSongHandler, { once: true });
              bgVideo.play().catch(() => {});
            } else {
              bgVideo.currentTime = Math.min(projectedTime, bgVideo.duration * 0.95);
              playPauseButton.innerHTML = textButtonStop;
              miniPlayPauseButton.innerHTML = miniIconStop;
              updateTime();
              atualizarBotoesAvanco();
              renderPlaylist(index);
              updatePlayButtonTooltip();
              bgVideo.play().catch(() => {});
            }
          }
          bgVideo.removeEventListener('canplay', resumeHandler);
        };
        bgVideo.addEventListener('canplay', resumeHandler, { once: true });
        return;
      }
    }
    
    // Se não tiver estado salvo, escolhe uma música aleatória.
    const validSongs = songs.slice(1, -1).map((s, i) => s.src ? i + 1 : -1).filter(i => i !== -1);
    livePlaylistIndex = validSongs.length > 0 ? validSongs[Math.floor(Math.random() * validSongs.length)] : 1;
    
    while (livePlaylistIndex < songs.length - 1 && !songs[livePlaylistIndex].src) livePlaylistIndex++;
    
    index = livePlaylistIndex;
    setVideoSources(songs[index].src);
    atualizarFaixa();
    bgVideo.loop = false;
    
    playPauseButton.innerHTML = textButtonLoading;
    miniPlayPauseButton.innerHTML = miniIconLoading;
    
    const playHandler = () => {
      if (bgVideo.duration && !isNaN(bgVideo.duration)) {
        bgVideo.currentTime = Math.random() * (bgVideo.duration * 0.8);
      }
      playPauseButton.innerHTML = textButtonStop;
      miniPlayPauseButton.innerHTML = miniIconStop;
      updateTime();
      atualizarBotoesAvanco();
      renderPlaylist(index);
      updatePlayButtonTooltip();
      bgVideo.removeEventListener('canplay', playHandler);
      bgVideo.removeEventListener('playing', playHandler);
    };
    
    bgVideo.addEventListener('canplay', playHandler, { once: true });
    bgVideo.addEventListener('playing', playHandler, { once: true });
    
    bgVideo.play().catch(() => {
      playPauseButton.innerHTML = textButtonPlay;
      miniPlayPauseButton.innerHTML = miniIconPlay;
      bgVideo.removeEventListener('canplay', playHandler);
      bgVideo.removeEventListener('playing', playHandler);
    });
    
    return;
  }

  if (bgVideo.paused) {
    if (index === songs.length - 1) {
      setVideoSources(songs[index].src);
      bgVideo.currentTime = 0;
    }
    
    if (isLiveMode && lastLiveSong !== null && liveExitTime > 0) {
      const timeAway = (Date.now() - liveExitTime) / 1000;
      const projectedTime = lastLiveTime + timeAway;
      
      if (bgVideo.duration && !isNaN(bgVideo.duration) && projectedTime >= bgVideo.duration) {
        livePlaylistIndex++;
        if (livePlaylistIndex >= songs.length - 1) {
          const validSongs = songs.slice(1, -1).map((s, i) => s.src ? i + 1 : -1).filter(i => i !== -1);
          livePlaylistIndex = validSongs.length > 0 ? validSongs[Math.floor(Math.random() * validSongs.length)] : 1;
        }
        while (livePlaylistIndex < songs.length - 1 && !songs[livePlaylistIndex].src) livePlaylistIndex++;
        
        index = livePlaylistIndex;
        setVideoSources(songs[index].src);
        atualizarFaixa();
        
        const nextSongHandler = () => {
          if (bgVideo.duration && !isNaN(bgVideo.duration)) {
            const overflowTime = projectedTime - bgVideo.duration;
            bgVideo.currentTime = Math.max(0, Math.min(overflowTime, bgVideo.duration * 0.9));
          }
          playPauseButton.innerHTML = textButtonStop;
          miniPlayPauseButton.innerHTML = miniIconStop;
          updateTime();
          atualizarBotoesAvanco();
          renderPlaylist(index);
          bgVideo.removeEventListener('canplay', nextSongHandler);
        };
        bgVideo.addEventListener('canplay', nextSongHandler, { once: true });
        bgVideo.play().catch(() => {
          playPauseButton.innerHTML = textButtonPlay;
          miniPlayPauseButton.innerHTML = miniIconPlay;
        });
        return;
      } else if (bgVideo.duration && !isNaN(bgVideo.duration)) {
        bgVideo.currentTime = Math.min(projectedTime, bgVideo.duration * 0.95);
      }
    }
    
    if (bgVideo.readyState >= 3) {
      playPauseButton.innerHTML = (index === songs.length - 1 || isLiveMode) ? textButtonStop : textButtonPause;
      miniPlayPauseButton.innerHTML = (index === songs.length - 1 || isLiveMode) ? miniIconStop : miniIconPause;
      bgVideo.play().catch(() => {
        playPauseButton.innerHTML = textButtonPlay;
        miniPlayPauseButton.innerHTML = miniIconPlay;
      });
    } else {
      playPauseButton.innerHTML = textButtonLoading;
      miniPlayPauseButton.innerHTML = miniIconLoading;
      
      const playHandler = () => {
        playPauseButton.innerHTML = (index === songs.length - 1 || isLiveMode) ? textButtonStop : textButtonPause;
        miniPlayPauseButton.innerHTML = (index === songs.length - 1 || isLiveMode) ? miniIconStop : miniIconPause;
        updateTime();
        bgVideo.removeEventListener('canplay', playHandler);
        bgVideo.removeEventListener('playing', playHandler);
      };
      
      bgVideo.addEventListener('canplay', playHandler, { once: true });
      bgVideo.addEventListener('playing', playHandler, { once: true });
      
      bgVideo.play().catch(() => {
        playPauseButton.innerHTML = textButtonPlay;
        miniPlayPauseButton.innerHTML = miniIconPlay;
        bgVideo.removeEventListener('canplay', playHandler);
        bgVideo.removeEventListener('playing', playHandler);
      });
    }
  } else {
    if (isLiveMode) {
      lastLiveSong = livePlaylistIndex;
      lastLiveTime = bgVideo.currentTime || 0;
      liveExitTime = Date.now();
      saveLiveState();
    }
    bgVideo.pause();
    playPauseButton.innerHTML = textButtonPlay;
    miniPlayPauseButton.innerHTML = miniIconPlay;
  }
};

// Atualiza o timer e a barra de progresso.
const updateTime = () => {
  const durationFormatted = isNaN(bgVideo.duration) ? 0 : bgVideo.duration;
  const progressWidth = durationFormatted ? (bgVideo.currentTime / durationFormatted) * 100 : 0;

  if (isLiveMode) {
    currentTime.innerHTML = `<span style="opacity:0.5">-:--</span>`;
    duration.innerHTML = `<button type="button" class="btn-ao-vivo" style="background-color:rgba(255, 255, 255, 0.1);transition: background-color 0.2s ease;border-radius:15px;padding:4px 8px;margin:3;font:inherit;color:#f38ba8;cursor:pointer;display:inline-block;font-size:0.9rem;">● AO VIVO</button>`;
    progress.style.width = "0%";
    progressBar.style.pointerEvents = "none";
    progressBar.style.opacity = "0.3";
    progressBar.title = "Navegação desabilitada em modo ao vivo";
  } else if (isBuffering && index !== 0 && !isLiveMode) {
    currentTime.textContent = "Carregando...";
    duration.textContent = "-:--";
    progressBar.style.pointerEvents = "auto";
    progressBar.style.opacity = "1";
    progressBar.title = "Clique para navegar";
  } else if (!bgVideo.src || isNaN(bgVideo.currentTime) || (bgVideo.currentTime === 0 && durationFormatted === 0) || (index === songs.length - 1 && !isLiveMode)) {
    currentTime.innerHTML = `<span style="opacity:0.5">-:--</span>`;
    duration.innerHTML = `<span style="opacity:0.5">-:--</span>`;
    progressBar.style.pointerEvents = "auto";
    progressBar.style.opacity = "1";
    progressBar.title = "Clique para navegar";
  } else {
    currentTime.textContent = `${Math.floor(bgVideo.currentTime / 60)}:${formatZero(Math.floor(bgVideo.currentTime % 60))}`;
    progressBar.style.pointerEvents = "auto";
    progressBar.style.opacity = "1";
    progressBar.title = "Clique para navegar";
  }

  if (!isLiveMode) {
    if (index === songs.length - 1) {
      if (duration) {
        duration.innerHTML = `<button class="btn-ao-vivo" style="background:none;border:none;padding:4px 8px;margin:3;font:inherit;color:#f38ba8;opacity: 0.5;cursor:pointer;display:inline-block;font-size:0.9rem;">● AO VIVO</button>`;
      }
    } else {
      if (duration) {
        duration.innerHTML = `<button class="btn-ao-vivo" style="background:none;border:none;padding:4px 8px;margin:3;font:inherit;color:#ffffff86;opacity: 0.5;cursor:pointer;display:inline-block;font-size:0.9rem;">● AO VIVO</button>`;
      }
    }
    progress.style.width = `${progressWidth}%`;
  }
};

// Define o source do vídeo.
function setVideoSources(src) {
  if (src) {
    if (!isLiveMode) {
      const loadingHandler = () => currentTime.textContent = "Carregando...";
      bgVideo.addEventListener('loadstart', loadingHandler);
      bgVideo.addEventListener('canplay', () => {
        bgVideo.removeEventListener('loadstart', loadingHandler);
        updateTime();
      }, { once: true });
    }
    bgVideo.src = src;
    bgVideo.loop = (index === songs.length - 1);
    bgVideo.muted = false;
    bgVideo.load();
  } else {
    bgVideo.src = '';
    // Garante que a capa seja mostrada se não houver vídeo
    document.body.classList.remove('video-reproduzindo');
  }
}

// Atualiza o estado dos botões de avançar/voltar.
function atualizarBotoesAvanco() {
  const desativado = index === 0 || isLiveMode;
  nextButton.disabled = desativado;
  prevButton.disabled = desativado;
  nextButton.classList.toggle('botao-desativado', desativado);
  prevButton.classList.toggle('botao-desativado', desativado);
}

// Monta a lista de músicas.
function renderPlaylist(selectedIndex = 1) {
  playlistItems.innerHTML = "";
  if (!playlistSection.classList.contains('expanded')) return;

  for (let idx = 1; idx < songs.length - 1; idx++) {
    const song = songs[idx];
    const li = document.createElement("li");
    li.className = 'playlist-item';

    const isSelected = (idx === selectedIndex);
    const isCurrentlyPlaying = (isSelected && isPlaying);
    const waveAnimationClass = isCurrentlyPlaying ? 'playing' : '';
    const overlayContent = isSelected ? `<div class="playlist-wave-animation ${waveAnimationClass}">${'<span class="wave-bar"></span>'.repeat(4)}</div>` : '';
    const thumbnailContent = song.thumbnail ? `<img src="${song.thumbnail}" alt="Thumbnail de ${song.name}" onerror="this.style.display='none';" loading="lazy">` : '';

    li.innerHTML = `
      <div class="thumbnail-container">
        ${thumbnailContent}
        <div class="thumbnail-overlay">${overlayContent}</div>
      </div>
      <div class="song-details">
        <span class="song-name">${song.name}</span>
        <span class="song-author">${song.author || ''}</span>
      </div>
    `;
    
    if (isSelected) {
      li.classList.add('selected');
      const songNameEl = li.querySelector('.song-name');
      const songAuthorEl = li.querySelector('.song-author');
      if (songNameEl) songNameEl.style.color = currentSongColor;
      if (songAuthorEl) {
        songAuthorEl.style.color = currentSongColor;
        songAuthorEl.style.opacity = '0.8';
      }
      li.querySelectorAll('.playlist-wave-animation .wave-bar').forEach(bar => bar.style.backgroundColor = currentSongColor);
    }
    if (isCurrentlyPlaying) li.classList.add('is-playing');

    li.addEventListener('click', () => selectSong(idx));
    playlistItems.appendChild(li);
  }
}

// Seleciona uma música da playlist.
function selectSong(idx) {
  if (isLiveMode) {
    lastLiveSong = livePlaylistIndex;
    lastLiveTime = bgVideo.currentTime || 0;
    liveExitTime = Date.now();
    saveLiveState();
    console.log('Saindo do modo ao vivo. Estado salvo:', lastLiveSong, lastLiveTime);
  }
  
  isLiveMode = false;
  index = idx;
  bgVideo.pause();
  atualizarFaixa();
  renderPlaylist(idx);
  atualizarBotoesAvanco();

  playPauseButton.innerHTML = textButtonLoading;
  miniPlayPauseButton.innerHTML = miniIconLoading;

  if (songs[idx].src) {
    setVideoSources(songs[idx].src);
    const minLoadingTime = 200;
    const startTime = Date.now();

    const playHandler = () => {
      const elapsed = Date.now() - startTime;
      setTimeout(() => {
        playPauseButton.innerHTML = isLiveMode ? textButtonStop : textButtonPause;
        miniPlayPauseButton.innerHTML = isLiveMode ? miniIconStop : miniIconPause;
        updateTime();
      }, Math.max(0, minLoadingTime - elapsed));
    };

    bgVideo.addEventListener('canplay', playHandler, { once: true });
    bgVideo.addEventListener('playing', playHandler, { once: true });
    bgVideo.play().catch((error) => {
      console.error("Erro ao tocar:", error);
      playPauseButton.innerHTML = textButtonPlay;
      miniPlayPauseButton.innerHTML = miniIconPlay;
      updateTime();
      bgVideo.removeEventListener('canplay', playHandler);
      bgVideo.removeEventListener('playing', playHandler);
    });
  } else {
    setVideoSources('');
    playPauseButton.innerHTML = textButtonPlay;
    miniPlayPauseButton.innerHTML = miniIconPlay;
    updateTime();
  }
}

const formatZero = (n) => (n < 10 ? "0" + n : n);

// Clique na barra de progresso.
progressBar.onclick = handleProgressClick;
progressBar.addEventListener('touchend', handleProgressClick);

function handleProgressClick(e) {
  if (isLiveMode) return;
  e.preventDefault();
  const rect = progressBar.getBoundingClientRect();
  const offsetX = (e.clientX || e.touches?.[0]?.clientX || e.changedTouches?.[0]?.clientX) - rect.left;
  bgVideo.currentTime = (offsetX / progressBar.offsetWidth) * bgVideo.duration;
}

// Lida com o clique no botão "AO VIVO".
document.addEventListener("click", handleAoVivoClick);
document.addEventListener("touchend", handleAoVivoClick);

function handleAoVivoClick(e) {
  if (!e.target.classList.contains("btn-ao-vivo")) return;
  e.preventDefault();
  e.stopPropagation();
  
  setTimeout(() => {
      if (isLiveMode) {
        console.log('Saindo do modo ao vivo.');
        isLiveMode = false;
        lastLiveSong = livePlaylistIndex;
        lastLiveTime = bgVideo.currentTime || 0;
        liveExitTime = Date.now();
        saveLiveState();
        
        index = 1; // Sempre volta para a primeira música
        bgVideo.loop = false;
        setVideoSources(songs[index].src);
        atualizarFaixa();
        atualizarBotoesAvanco();
        updateTime();
        updatePlayButtonTooltip();
        renderPlaylist(index);
        
        if (songs[index].src) {
          playPauseButton.innerHTML = textButtonLoading;
          miniPlayPauseButton.innerHTML = miniIconLoading;
          const autoPlayHandler = () => {
            playPauseButton.innerHTML = textButtonPause;
            miniPlayPauseButton.innerHTML = miniIconPause;
            updateTime();
            bgVideo.removeEventListener('canplay', autoPlayHandler);
          };
          bgVideo.addEventListener('canplay', autoPlayHandler, { once: true });
          bgVideo.play().catch((error) => {
            console.error("Erro ao tocar:", error);
            playPauseButton.innerHTML = textButtonPlay;
            miniPlayPauseButton.innerHTML = miniIconPlay;
            bgVideo.removeEventListener('canplay', autoPlayHandler);
          });
        }
      } else {
        console.log('Entrando no modo ao vivo');
        isLiveMode = true;
        
        if (lastLiveSong !== null && liveExitTime > 0) {
          console.log('Retomando transmissão:', lastLiveSong, lastLiveTime);
          const timeAway = (Date.now() - liveExitTime) / 1000;
          livePlaylistIndex = lastLiveSong;
          const projectedTime = lastLiveTime + timeAway;
          
          if (songs[livePlaylistIndex] && songs[livePlaylistIndex].src) {
            index = livePlaylistIndex;
            setVideoSources(songs[index].src);
            
            const resumeHandler = () => {
              if (bgVideo.duration && !isNaN(bgVideo.duration)) {
                if (projectedTime >= bgVideo.duration) {
                  livePlaylistIndex++;
                  if (livePlaylistIndex >= songs.length - 1) livePlaylistIndex = 1;
                  while (livePlaylistIndex < songs.length - 1 && !songs[livePlaylistIndex].src) livePlaylistIndex++;
                  
                  index = livePlaylistIndex;
                  setVideoSources(songs[index].src);
                  atualizarFaixa();
                  
                  const nextSongHandler = () => {
                    if (bgVideo.duration && !isNaN(bgVideo.duration)) {
                      const overflowTime = projectedTime - bgVideo.duration;
                      bgVideo.currentTime = Math.max(0, Math.min(overflowTime, bgVideo.duration * 0.9));
                    }
                    playPauseButton.innerHTML = textButtonStop;
                    miniPlayPauseButton.innerHTML = miniIconStop;
                    updateTime();
                    atualizarBotoesAvanco();
                    renderPlaylist(index);
                    bgVideo.removeEventListener('canplay', nextSongHandler);
                  };
                  bgVideo.addEventListener('canplay', nextSongHandler, { once: true });
                  bgVideo.play().catch(() => {});
                } else {
                  bgVideo.currentTime = Math.min(projectedTime, bgVideo.duration * 0.95);
                  playPauseButton.innerHTML = textButtonStop;
                  miniPlayPauseButton.innerHTML = miniIconStop;
                  updateTime();
                  atualizarBotoesAvanco();
                  renderPlaylist(index);
                  bgVideo.play().catch(() => {});
                }
              }
              bgVideo.removeEventListener('canplay', resumeHandler);
            };
            bgVideo.addEventListener('canplay', resumeHandler, { once: true });
            atualizarFaixa();
            return;
          }
        }
        
        const validSongs = songs.slice(1, -1).map((s, i) => s.src ? i + 1 : -1).filter(i => i !== -1);
        livePlaylistIndex = validSongs.length > 0 ? validSongs[Math.floor(Math.random() * validSongs.length)] : 1;
        while (livePlaylistIndex < songs.length - 1 && !songs[livePlaylistIndex].src) livePlaylistIndex++;
        
        if (livePlaylistIndex < songs.length - 1) {
          index = livePlaylistIndex;
          setVideoSources(songs[index].src);
          atualizarFaixa();
          bgVideo.loop = false;
          
          playPauseButton.innerHTML = textButtonLoading;
          miniPlayPauseButton.innerHTML = miniIconLoading;
          
          const playHandler = () => {
            if (bgVideo.duration && !isNaN(bgVideo.duration)) {
              bgVideo.currentTime = Math.random() * (bgVideo.duration * 0.8);
            }
            playPauseButton.innerHTML = textButtonStop;
            miniPlayPauseButton.innerHTML = miniIconStop;
            updateTime();
            bgVideo.removeEventListener('canplay', playHandler);
            bgVideo.removeEventListener('playing', playHandler);
          };
          
          bgVideo.addEventListener('canplay', playHandler, { once: true });
          bgVideo.addEventListener('playing', playHandler, { once: true });
          
          bgVideo.play().catch((error) => {
            console.error("Erro ao tocar:", error);
            playPauseButton.innerHTML = textButtonPlay;
            miniPlayPauseButton.innerHTML = miniIconPlay;
            updateTime();
            bgVideo.removeEventListener('canplay', playHandler);
            bgVideo.removeEventListener('playing', playHandler);
          });
          
          updateTime();
          atualizarBotoesAvanco();
          renderPlaylist(index);
          updatePlayButtonTooltip();
        }
      }
    }, 10);
}

// Controles da playlist.
playlistToggleButton.addEventListener('click', togglePlaylist);
playlistToggleButton.addEventListener('touchend', (e) => { e.preventDefault(); togglePlaylist(); });
playlistCloseButton.addEventListener('click', togglePlaylist);
playlistCloseButton.addEventListener('touchend', (e) => { e.preventDefault(); togglePlaylist(); });

// Desenha o vídeo no canvas para sincronia.
function drawToCanvas() {
  if (!bgVideo.paused && !bgVideo.ended) {
    ctx.drawImage(bgVideo, 0, 0, syncCanvas.width, syncCanvas.height);
  }
  requestAnimationFrame(drawToCanvas);
}

// Eventos do Picture-in-Picture.
bgVideo.addEventListener('enterpictureinpicture', () => {
  console.log('Entrou em PiP');
  const pipButton = document.getElementById('pipButton');
  if (pipButton) pipButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ffffff86;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="9" y="9" width="8" height="8" rx="1" ry="1"></rect></svg>Sair do PiP';
});

bgVideo.addEventListener('leavepictureinpicture', () => {
  console.log('Saiu do PiP');
  const pipButton = document.getElementById('pipButton');
  if (pipButton) pipButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ffffff86;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="9" y="9" width="8" height="8" rx="1" ry="1"></rect></svg>Ativar PiP';
});

// Paleta de cores.
const catppuccinColors = [
  'var(--catppuccin-pink)', 'var(--catppuccin-mauve)', 'var(--catppuccin-red)',
  'var(--catppuccin-maroon)', 'var(--catppuccin-peach)', 'var(--catppuccin-yellow)',
  'var(--catppuccin-green)', 'var(--catppuccin-teal)', 'var(--catppuccin-sky)',
  'var(--catppuccin-blue)', 'var(--catppuccin-lavender)',
];

const musicNameElement = document.getElementById('musicName');
const musicAuthorElement = document.getElementById('musicAuthor');

// Muda a cor do nome da música.
function changeMusicNameColor() {
  if (index === 0) {
    musicNameElement.style.color = '';
    musicAuthorElement.style.color = '';
    musicAuthorElement.style.opacity = '';
    miniMusicName.style.color = '';
    miniMusicAuthor.style.color = '';
    miniMusicAuthor.style.opacity = '';
    currentSongColor = 'var(--catppuccin-lavender)';
    return;
  }

  const randomColor = catppuccinColors[Math.floor(Math.random() * catppuccinColors.length)];
  currentSongColor = randomColor;
  
  musicNameElement.style.color = currentSongColor;
  musicAuthorElement.style.color = currentSongColor;
  musicAuthorElement.style.opacity = '0.8'; 
  miniMusicName.style.color = currentSongColor;
  miniMusicAuthor.style.color = currentSongColor;
  miniMusicAuthor.style.opacity = '0.8';
}

document.getElementById('nextButton').addEventListener('click', () => {
  changeMusicNameColor();
});

function togglePlaylist() {
  const playlistSection = document.getElementById('playlistSection');
  
  if (playlistSection.classList.contains('expanded')) {
    playlistSection.classList.add('closing');
    playlistSection.classList.remove('expanded');
    playlistSection.addEventListener('transitionend', function handler() {
      playlistSection.style.display = 'none';
      playlistSection.classList.remove('closing');
      playlistSection.removeEventListener('transitionend', handler);
      playlistItems.innerHTML = "";
    });
  } else {
    playlistSection.style.display = 'flex';
    void playlistSection.offsetWidth; // Força o reflow para a animação funcionar
    playlistSection.classList.add('expanded');
    setTimeout(() => renderPlaylist(index), 50);
  }
}
