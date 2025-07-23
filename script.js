// Elementos da interface
const bgVideo = document.getElementById('bg-video');
const syncCanvas = document.getElementById('sync-canvas');
const verticalCover = document.getElementById('vertical-cover');
const horizontalCover = document.getElementById('horizontal-cover');
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

// Elementos do Mini Player
const mainPlayer = document.getElementById('main-player');
const miniPlayer = document.getElementById('mini-player');
const minimizeButton = document.getElementById('minimizeButton');
const restoreButton = document.getElementById('restoreButton');
const miniPlayPauseButton = document.getElementById('mini-play-pause-button');
const miniMusicName = document.getElementById('mini-music-name');
const miniMusicAuthor = document.getElementById('mini-music-author');


import songs from "./songs.js";

// Ícones do Player Principal
const textButtonPlay = `<i style="font-size: 4rem;" class='bx bx-play-circle'></i>`;
const textButtonPause = `<i style="font-size: 4rem;" class='bx bx-pause-circle'></i>`;
const textButtonStop = `<i style="font-size: 4rem;" class='bx bx-stop-circle'></i>`;
const textButtonLoading = `<i style="font-size: 4rem;" class='bx bx-loader-alt bx-spin'></i>`;

// Ícones do Mini Player (correspondentes ao principal, sem estilo inline)
const miniIconPlay = `<i class='bx bx-play-circle'></i>`;
const miniIconPause = `<i class='bx bx-pause-circle'></i>`;
const miniIconStop = `<i class='bx bx-stop-circle'></i>`;
const miniIconLoading = `<i class='bx bx-loader-alt bx-spin'></i>`;


let index = 0;
let isPlaying = false;
let isBuffering = false;
let isLiveMode = false;
let livePlaylistIndex = 1; // primeira música da playlist
let lastLiveSong = null; // última música reproduzida no modo ao vivo
let lastLiveTime = 0; // tempo da última música no modo ao vivo
let liveExitTime = 0; // quando saiu do modo ao vivo

// NOVA FUNÇÃO: Ajusta o tamanho do vídeo de fundo para preencher a tela
const adjustVideoSize = () => {
    // Sai se o elemento de vídeo não existir ou se os metadados ainda não foram carregados
    if (!bgVideo || bgVideo.videoWidth === 0) {
        return;
    }

    const videoRatio = bgVideo.videoWidth / bgVideo.videoHeight;
    const windowRatio = window.innerWidth / window.innerHeight;

    // Reseta os estilos para recalcular
    bgVideo.style.width = 'auto';
    bgVideo.style.height = 'auto';

    if (windowRatio > videoRatio) {
        // Se a janela for mais "larga" que o vídeo, a largura do vídeo deve preencher a janela
        bgVideo.style.width = '100vw';
    } else {
        // Se a janela for mais "alta" que o vídeo, a altura do vídeo deve preencher a janela
        bgVideo.style.height = '100vh';
    }
};

// verificações de compatibilidade para dispositivos móveis
const checkDeviceCapabilities = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;
  
  console.log('Device capabilities:', {
    isIOS,
    isAndroid,
    isMobile,
    pipEnabled: document.pictureInPictureEnabled,
  });
  
  // Atualiza tooltips baseado no dispositivo
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

// salva o estado no localStorage
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

// carrega estado do localStorage
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

// atualiza tooltip do botão play
const updatePlayButtonTooltip = () => {
  if (isLiveMode) {
    playPauseButton.title = "Pausar/Retomar transmissão ao vivo (Espaço)";
  } else {
    playPauseButton.title = "Reproduzir/Pausar (Espaço)";
  }
};

// setup inicial
window.addEventListener('DOMContentLoaded', () => {
  // verifica capacidades do dispositivo
  const deviceInfo = checkDeviceCapabilities();
  
  // carrega estado salvo do modo ao vivo
  loadLiveState();
  
  index = 0;
  atualizarBackground();
  setVideoSources();
  atualizarFaixa();
  playPauseButton.innerHTML = textButtonPlay;
  miniPlayPauseButton.innerHTML = miniIconPlay;
  updateTime();
  atualizarBotoesAvanco();
  renderPlaylist(0);
  atualizarVerticalCover();
  adjustVideoSize(); // Chama a função de ajuste no carregamento inicial
  
  // tooltips dos botões
  playPauseButton.title = "Reproduzir/Pausar (Espaço)";
  prevButton.title = "Música anterior (Seta esquerda)";
  nextButton.title = "Próxima música (Seta direita)";
  playlistToggleButton.title = "Abrir playlist";
  playlistCloseButton.title = "Fechar playlist";
  document.getElementById('pipButton').title = "Picture-in-Picture";
  progressBar.title = "Clique para navegar na música";
  
  updatePlayButtonTooltip();
  
  // se tinha estado salvo, mostra que pode retomar
  if (lastLiveSong !== null && liveExitTime > 0) {
    playPauseButton.title = "Retomar transmissão ao vivo (Espaço)";
  }
  
  // configuração do botão PiP
  const pipButton = document.getElementById('pipButton');
  if (pipButton) {
    const handlePiP = async function (e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Verifica se PiP está disponível
      if (!document.pictureInPictureEnabled || !bgVideo.requestPictureInPicture) {
        console.log('Picture-in-Picture não está disponível neste dispositivo');
        
        // Mostra feedback visual para o usuário
        const originalText = pipButton.innerHTML;
        pipButton.innerHTML = 'PiP não disponível';
        pipButton.style.opacity = '0.5';
        
        setTimeout(() => {
          pipButton.innerHTML = originalText;
          pipButton.style.opacity = '1';
        }, 2000);
        
        return;
      }
      
      // Verifica se o vídeo está pronto
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
        console.error('Erro ao ativar/desativar PiP:', error);
        
        // Mostra feedback de erro para o usuário
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

// Eventos para redimensionamento do vídeo
window.addEventListener('resize', adjustVideoSize);
bgVideo.addEventListener('loadedmetadata', adjustVideoSize);


// salva estado ao fechar/recarregar
window.addEventListener('beforeunload', () => {
  if (isLiveMode) {
    saveLiveState();
  }
});

// salva estado a cada 5 segundos no modo ao vivo
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

// Suporte a toque para minimizar/restaurar
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

// botões principais
prevButton.onclick = () => prevNextMusic("prev");
nextButton.onclick = () => prevNextMusic();
playPauseButton.onclick = () => playPause();

// suporte touch
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

// atalhos do teclado
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

// eventos do player de vídeo
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
});

bgVideo.addEventListener('play', () => {
  isPlaying = true;
  waveAnimation.classList.add('playing');
  playPauseButton.innerHTML = isLiveMode ? textButtonStop : textButtonPause;
  miniPlayPauseButton.innerHTML = isLiveMode ? miniIconStop : miniIconPause;
  // se estiver no modo ao vivo e dar play, simula que a transmissão continuou
  if (isLiveMode && lastLiveSong !== null && liveExitTime > 0) {
    const timeAway = (Date.now() - liveExitTime) / 1000;
    const projectedTime = lastLiveTime + timeAway;
    
    console.log('Retomando modo ao vivo. Tempo projetado:', projectedTime);
    
    // verifica se precisa pular para próxima música
    if (bgVideo.duration && !isNaN(bgVideo.duration) && projectedTime >= bgVideo.duration) {
      setTimeout(() => {
        livePlaylistIndex++;
        
        if (livePlaylistIndex >= songs.length - 1) {
          const validSongs = [];
          for (let i = 1; i < songs.length - 1; i++) {
            if (songs[i].src) {
              validSongs.push(i);
            }
          }
          
          if (validSongs.length > 0) {
            const randomIndex = Math.floor(Math.random() * validSongs.length);
            livePlaylistIndex = validSongs[randomIndex];
          } else {
            livePlaylistIndex = 1;
          }
        }
        
        // Pula músicas sem src
        while (livePlaylistIndex < songs.length - 1 && !songs[livePlaylistIndex].src) {
          livePlaylistIndex++;
        }
        
        // Carrega a nova música
        index = livePlaylistIndex;
        setVideoSources(songs[index].src);
        atualizarFaixa();
        atualizarBackground();
        
        const nextSongHandler = () => {
          if (bgVideo.duration && !isNaN(bgVideo.duration)) {
            const overflowTime = projectedTime - bgVideo.duration;
            const newTime = Math.min(overflowTime, bgVideo.duration * 0.9);
            bgVideo.currentTime = Math.max(0, newTime);
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
      // Continua na mesma música, mas em ponto mais avançado
      setTimeout(() => {
        bgVideo.currentTime = Math.min(projectedTime, bgVideo.duration * 0.95);
      }, 100);
    }
  }
  
  drawToCanvas();
});

bgVideo.addEventListener('ended', () => {
  waveAnimation.classList.remove('playing');
  if (isLiveMode) {
    // modo ao vivo: vai para próxima música
    livePlaylistIndex++;
    
    // se chegou no final da playlist, escolhe música aleatória
    if (livePlaylistIndex >= songs.length - 1) {
      const validSongs = [];
      for (let i = 1; i < songs.length - 1; i++) {
        if (songs[i].src) {
          validSongs.push(i);
        }
      }
      
      console.log('Fim da playlist no modo ao vivo. Músicas válidas:', validSongs);
      
      if (validSongs.length > 0) {
        const randomIndex = Math.floor(Math.random() * validSongs.length);
        livePlaylistIndex = validSongs[randomIndex];
      } else {
        livePlaylistIndex = 1;
      }
    }
    
    // pula músicas sem src
    while (livePlaylistIndex < songs.length - 1 && !songs[livePlaylistIndex].src) {
      livePlaylistIndex++;
    }
    
    if (livePlaylistIndex < songs.length - 1 && songs[livePlaylistIndex].src) {
      index = livePlaylistIndex;
      setVideoSources(songs[index].src);
      atualizarFaixa();
      atualizarBackground();
      
      // no modo ao vivo, a próxima música sempre começa do início
      const startFromBeginningHandler = () => {
        if (bgVideo.duration && !isNaN(bgVideo.duration)) {
          bgVideo.currentTime = 0;
        }
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
    // modo normal (não ao vivo)
    let next = index + 1;
    while (next < songs.length && !songs[next].src) {
      next++;
    }
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
      // quando acaba tudo, volta o botão para play
      playPauseButton.innerHTML = textButtonPlay;
      miniPlayPauseButton.innerHTML = miniIconPlay;
    }
  }
});

bgVideo.addEventListener('pause', () => {
  isPlaying = false;
  waveAnimation.classList.remove('playing');
  playPauseButton.innerHTML = textButtonPlay;
  miniPlayPauseButton.innerHTML = miniIconPlay;

  // se estiver no modo ao vivo e pausar, salva o estado
  if (isLiveMode) {
    lastLiveSong = livePlaylistIndex;
    lastLiveTime = bgVideo.currentTime || 0;
    liveExitTime = Date.now();
    saveLiveState();
    console.log('Pausado no modo ao vivo. Salvando estado:', lastLiveSong, lastLiveTime);
  }
});

// atualiza informações da música
function atualizarFaixa() {
  const currentSong = songs[index];
  const songName = currentSong.name;
  const songAuthor = currentSong.author || "";

  if (isLiveMode && index > 0 && index < songs.length - 1) {
    musicName.innerHTML = songName;
    musicAuthor.textContent = songAuthor;
  } else {
    musicName.innerHTML = songName;
    musicAuthor.textContent = songAuthor;
  }
  
  // Atualiza mini player
  miniMusicName.textContent = songName;
  miniMusicAuthor.textContent = songAuthor;

  changeMusicNameColor();
  atualizarVerticalCover();
}

// Exibe a capa vertical apenas se não houver vídeo válido
function atualizarVerticalCover() {
  if (!verticalCover || !horizontalCover) return;
  // Considera que a faixa 0 é "capa" (sem vídeo), demais faixas têm vídeo
  const isNoVideo = songs[index] && (!songs[index].src || songs[index].src === '' || songs[index].isCover);
  if (isNoVideo) {
    // Deixa o CSS controlar qual capa mostrar
    verticalCover.style.display = '';
    horizontalCover.style.display = '';
    bgVideo.style.display = 'none';
  } else {
    // Oculta ambas as capas, mostra o vídeo
    verticalCover.style.display = 'none';
    horizontalCover.style.display = 'none';
    bgVideo.style.display = '';
  }
}

// Atualiza capa ao mudar orientação
window.addEventListener('orientationchange', atualizarVerticalCover);
window.addEventListener('resize', atualizarVerticalCover);
//

// navegar entre músicas
const prevNextMusic = (type = "next") => {
  // se estava no modo ao vivo, salva o estado antes de sair
  if (isLiveMode) {
    lastLiveSong = livePlaylistIndex;
    lastLiveTime = bgVideo.currentTime || 0;
    liveExitTime = Date.now();
    saveLiveState();
    console.log('Saindo do modo ao vivo via navegação manual. Salvando estado:', lastLiveSong, lastLiveTime);
  }
  
  // sai do modo ao vivo quando navegar manualmente
  isLiveMode = false;
  
  if (type === "next") {
    index = (index + 1) % songs.length;
  } else if (type === "prev") {
    index = (index - 1 + songs.length) % songs.length;
  }

  renderPlaylist(index);
  bgVideo.pause();
  atualizarFaixa();
  atualizarVerticalCover();
  atualizarBackground();
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
      console.error("Erro ao reproduzir:", error);
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

// controle principal de play/pause
const playPause = () => {
  if (index === 0) {
    // quando estiver na capa, inicia o modo ao vivo
    console.log('Iniciando modo ao vivo a partir da capa');
    isLiveMode = true;
    
    // verifica se deve retomar a transmissão anterior
    if (lastLiveSong !== null && liveExitTime > 0) {
      console.log('Retomando transmissão anterior após recarregar página. Música:', lastLiveSong, 'Tempo:', lastLiveTime);
      const timeAway = (Date.now() - liveExitTime) / 1000;
      livePlaylistIndex = lastLiveSong;
      
      // simula que a transmissão continuou
      const projectedTime = lastLiveTime + timeAway;
      
      // sempre tenta retomar a mesma música primeiro
      if (songs[livePlaylistIndex] && songs[livePlaylistIndex].src) {
        index = livePlaylistIndex;
        setVideoSources(songs[index].src);
        atualizarFaixa();
        atualizarBackground();
        bgVideo.loop = false;
        
        playPauseButton.innerHTML = textButtonLoading;
        miniPlayPauseButton.innerHTML = miniIconLoading;
        
        const resumeHandler = () => {
          if (bgVideo.duration && !isNaN(bgVideo.duration)) {
            if (projectedTime >= bgVideo.duration) {
              // se o tempo projetado passou da duração, vai para próxima música
              livePlaylistIndex++;
              
              // se chegou ao final da playlist, reinicia
              if (livePlaylistIndex >= songs.length - 1) {
                const validSongs = [];
                for (let i = 1; i < songs.length - 1; i++) {
                  if (songs[i].src) {
                    validSongs.push(i);
                  }
                }
                
                if (validSongs.length > 0) {
                  const randomIndex = Math.floor(Math.random() * validSongs.length);
                  livePlaylistIndex = validSongs[randomIndex];
                } else {
                  livePlaylistIndex = 1;
                }
              }
              
              // pula músicas sem src
              while (livePlaylistIndex < songs.length - 1 && !songs[livePlaylistIndex].src) {
                livePlaylistIndex++;
              }
              
              // carrega a próxima música
              index = livePlaylistIndex;
              setVideoSources(songs[index].src);
              atualizarFaixa();
              atualizarBackground();
              
              const nextSongHandler = () => {
                if (bgVideo.duration && !isNaN(bgVideo.duration)) {
                  // calcula o tempo restante e aplica na nova música
                  const overflowTime = projectedTime - bgVideo.duration;
                  const newTime = Math.min(overflowTime, bgVideo.duration * 0.9);
                  bgVideo.currentTime = Math.max(0, newTime);
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
              // continua na mesma música, mas em ponto mais avançado
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
    
    // primeira vez ou fallback - escolhe música aleatória
    const validSongs = [];
    for (let i = 1; i < songs.length - 1; i++) {
      if (songs[i].src) {
        validSongs.push(i);
      }
    }
    
    if (validSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * validSongs.length);
      livePlaylistIndex = validSongs[randomIndex];
    } else {
      livePlaylistIndex = 1;
    }
    
    // garante que a música escolhida tem src
    while (livePlaylistIndex < songs.length - 1 && !songs[livePlaylistIndex].src) {
      livePlaylistIndex++;
    }
    
    index = livePlaylistIndex;
    setVideoSources(songs[index].src);
    atualizarFaixa();
    atualizarBackground();
    bgVideo.loop = false;
    
    playPauseButton.innerHTML = textButtonLoading;
    miniPlayPauseButton.innerHTML = miniIconLoading;
    
    const playHandler = () => {
      // define um tempo aleatório na música (entre 0% e 80%)
      if (bgVideo.duration && !isNaN(bgVideo.duration)) {
        const randomTime = Math.random() * (bgVideo.duration * 0.8);
        bgVideo.currentTime = randomTime;
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
    
    // se estava pausado no modo ao vivo, simula que a transmissão continuou
    if (isLiveMode && lastLiveSong !== null && liveExitTime > 0) {
      const timeAway = (Date.now() - liveExitTime) / 1000;
      const projectedTime = lastLiveTime + timeAway;
      
      // verifica se precisa pular para próxima música
      if (bgVideo.duration && !isNaN(bgVideo.duration) && projectedTime >= bgVideo.duration) {
        livePlaylistIndex++;
        
        if (livePlaylistIndex >= songs.length - 1) {
          const validSongs = [];
          for (let i = 1; i < songs.length - 1; i++) {
            if (songs[i].src) {
              validSongs.push(i);
            }
          }
          
          if (validSongs.length > 0) {
            const randomIndex = Math.floor(Math.random() * validSongs.length);
            livePlaylistIndex = validSongs[randomIndex];
          } else {
            livePlaylistIndex = 1;
          }
        }
        
        // Pula músicas sem src
        while (livePlaylistIndex < songs.length - 1 && !songs[livePlaylistIndex].src) {
          livePlaylistIndex++;
        }
        
        // Carrega a nova música
        index = livePlaylistIndex;
        setVideoSources(songs[index].src);
        atualizarFaixa();
        atualizarBackground();
        
        const nextSongHandler = () => {
          if (bgVideo.duration && !isNaN(bgVideo.duration)) {
            const overflowTime = projectedTime - bgVideo.duration;
            const newTime = Math.min(overflowTime, bgVideo.duration * 0.9);
            bgVideo.currentTime = Math.max(0, newTime);
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
        // Continua na mesma música, mas em ponto mais avançado
        bgVideo.currentTime = Math.min(projectedTime, bgVideo.duration * 0.95);
      }
    }
    
    // verifica se o vídeo já está pronto
    if (bgVideo.readyState >= 3) {
      // vídeo já carregado, pode reproduzir
      if (index === songs.length - 1) {
        playPauseButton.innerHTML = textButtonStop;
        miniPlayPauseButton.innerHTML = miniIconStop;
      } else if (isLiveMode) {
        playPauseButton.innerHTML = textButtonStop;
        miniPlayPauseButton.innerHTML = miniIconStop;
      } else {
        playPauseButton.innerHTML = textButtonPause;
        miniPlayPauseButton.innerHTML = miniIconPause;
      }
      bgVideo.play().catch(() => {
        playPauseButton.innerHTML = textButtonPlay;
        miniPlayPauseButton.innerHTML = miniIconPlay;
      });
    } else {
      // vídeo ainda não carregado, mostra loading
      playPauseButton.innerHTML = textButtonLoading;
      miniPlayPauseButton.innerHTML = miniIconLoading;
      
      const playHandler = () => {
        if (index === songs.length - 1) {
          playPauseButton.innerHTML = textButtonStop;
           miniPlayPauseButton.innerHTML = miniIconStop;
        } else if (isLiveMode) {
          playPauseButton.innerHTML = textButtonStop;
          miniPlayPauseButton.innerHTML = miniIconStop;
        } else {
          playPauseButton.innerHTML = textButtonPause;
          miniPlayPauseButton.innerHTML = miniIconPause;
        }
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
      // se pausar no modo ao vivo, salva o estado mas não sai do modo
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

// atualiza timer e barra de progresso
const updateTime = () => {
  const durationFormatted = isNaN(bgVideo.duration) ? 0 : bgVideo.duration;
  const progressWidth = durationFormatted
    ? (bgVideo.currentTime / durationFormatted) * 100
    : 0;

  if (isLiveMode) {
    // no modo ao vivo, desabilita a barra de progresso
    currentTime.innerHTML = `<span style="opacity:0.5">-:--</span>`;
    duration.innerHTML = `<button id="btn-ao-vivo" style="background:none;border:none;padding:4px 8px;margin:3;font:inherit;color:#ff6b6b;cursor:pointer;display:inline-block;font-size:0.9rem;">● AO VIVO</button>`;
    progress.style.width = "0%";
    progressBar.style.pointerEvents = "none";
    progressBar.style.opacity = "0.3";
    progressBar.title = "Transmissão ao vivo - navegação desabilitada";
  } else if (isBuffering && index !== 0 && !isLiveMode) {
    currentTime.textContent = "Carregando...";
    duration.textContent = "-:--";
    progress.style.background = "";
    progressBar.style.cursor = "pointer";
    progressBar.style.pointerEvents = "auto";
    progressBar.style.opacity = "1";
    progressBar.title = "Clique para navegar na música";
  } else if (
    !bgVideo.src ||
    isNaN(bgVideo.currentTime) ||
    (bgVideo.currentTime === 0 && durationFormatted === 0) ||
    (index === songs.length - 1 && !isLiveMode)
  ) {
    currentTime.innerHTML = `<span style="opacity:0.5">-:--</span>`;
    duration.innerHTML = `<span style="opacity:0.5">-:--</span>`;
    progress.style.background = "";
    progressBar.style.cursor = "pointer";
    progressBar.style.pointerEvents = "auto";
    progressBar.style.opacity = "1";
    progressBar.title = "Clique para navegar na música";
  } else {
    const currentMinutes = Math.floor(bgVideo.currentTime / 60);
    const currentSeconds = Math.floor(bgVideo.currentTime % 60);
    currentTime.textContent = currentMinutes + ":" + formatZero(currentSeconds);
    progress.style.background = "";
    progressBar.style.cursor = "pointer";
    progressBar.style.pointerEvents = "auto";
    progressBar.style.opacity = "1";
    progressBar.title = "Clique para navegar na música";
  }

  if (!isLiveMode) {
    if (index === songs.length - 1) {
      duration.innerHTML = `<button id="btn-ao-vivo" style="background:none;border:none;padding:4px 8px;margin:3;font:inherit;color:#ff6b6b;cursor:pointer;display:inline-block;font-size:0.9rem;">● AO VIVO</button>`;
    } else {
      duration.innerHTML = `<button id="btn-ao-vivo" style="background:none;border:none;padding:4px 8px;margin:3;font:inherit;color:#ffffff86;opacity: 0.5;cursor:pointer;display:inline-block;font-size:0.9rem;">● AO VIVO</button>`;
    }
    
    progress.style.width = progressWidth + "%";
  }
};

// configura o vídeo de fundo
function setVideoSources(src) {
  if (src) {
    // monitora o carregamento apenas se não estiver no modo ao vivo
    if (!isLiveMode) {
      const loadingHandler = () => {
        currentTime.textContent = "Carregando...";
      };
      
      bgVideo.addEventListener('loadstart', loadingHandler);
      
      // remove o manipulador após carregar
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
  }
}

// estado dos botões prev/next
function atualizarBotoesAvanco() {
  if (index === 0 || isLiveMode) {
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
    // Adiciona o background diretamente para garantir que o caminho esteja correto,
    // corrigindo o problema da imagem não aparecer.
    document.body.style.backgroundImage = "url('src/capa.jpg')";
  } else {
    document.body.classList.remove('body-capa');
    // Remove o background para que o vídeo de fundo das outras faixas possa ser exibido.
    document.body.style.backgroundImage = 'none';
  }
}

// monta a playlist
function renderPlaylist(selectedIndex = 1) {
  playlistItems.innerHTML = ""; // limpa para evitar duplicação

  for (let idx = 1; idx < songs.length - 1; idx++) { // do primeiro até o penúltimo
    const song = songs[idx];
    const li = document.createElement("li");
    li.className = 'playlist-item';
    
    if (idx === selectedIndex) {
      li.classList.add('selected');
    }

    // Create the inner HTML structure
    li.innerHTML = `
      <div class="thumbnail-container">
        <img 
          src="${song.thumbnail || 'https://placehold.co/96x54/11111b/cdd6f4?text=???'}" 
          alt="Thumbnail for ${song.name}" 
          onerror="this.onerror=null;this.src='https://placehold.co/96x54/11111b/cdd6f4?text=Error';"
          loading="lazy"
        >
        <div class="thumbnail-overlay">
            <i class='bx bx-play'></i>
        </div>
      </div>
      <div class="song-details">
        <span class="song-name">${song.name}</span>
        <span class="song-author">${song.author || ''}</span>
      </div>
    `;

    // Add a simple click listener
    const songIndex = idx;
    li.addEventListener('click', () => {
      selectSong(songIndex);
    });

    playlistItems.appendChild(li);
  }
}

// seleciona música da playlist
function selectSong(idx) {
  // se estava no modo ao vivo, salva antes de sair
  if (isLiveMode) {
    lastLiveSong = livePlaylistIndex;
    lastLiveTime = bgVideo.currentTime || 0;
    liveExitTime = Date.now();
    saveLiveState();
    console.log('Saindo do modo ao vivo via seleção. Salvando estado:', lastLiveSong, lastLiveTime);
  }
  
  // sai do modo ao vivo
  isLiveMode = false;
  
  index = idx;
  renderPlaylist(idx);
  bgVideo.pause();
  atualizarFaixa();
  atualizarBackground();
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

    // tenta dar play
    bgVideo.play().catch((error) => {
      console.error("Erro ao reproduzir:", error);
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

// clique na barra de progresso
progressBar.onclick = handleProgressClick;
progressBar.addEventListener('touchend', handleProgressClick);

function handleProgressClick(e) {
  // não permite clique na barra no modo ao vivo
  if (isLiveMode) {
    return;
  }
  
  e.preventDefault();
  const rect = progressBar.getBoundingClientRect();
  const offsetX = (e.clientX || e.touches?.[0]?.clientX || e.changedTouches?.[0]?.clientX) - rect.left;
  const newTime = (offsetX / progressBar.offsetWidth) * bgVideo.duration;
  bgVideo.currentTime = newTime;
}

// Event delegation robusto para o botão AO VIVO
document.addEventListener("click", handleAoVivoClick);
document.addEventListener("touchend", handleAoVivoClick);

function handleAoVivoClick(e) {
  // Verificação robusta do ID do alvo, mesmo quando o botão é recriado dinamicamente
  const target = e.target;
  if (!target || target.id !== "btn-ao-vivo") {
    return; // Não é o botão que queremos
  }
  
  e.preventDefault();
  e.stopPropagation();
  
  setTimeout(() => {
      if (isLiveMode) {
        // Sair do modo ao vivo - volta para música individual
        console.log('Saindo do modo ao vivo. Música atual:', livePlaylistIndex, 'Tempo:', bgVideo.currentTime);
        isLiveMode = false;
        
        // Armazena informações da transmissão atual
        lastLiveSong = livePlaylistIndex;
        lastLiveTime = bgVideo.currentTime || 0;
        liveExitTime = Date.now();
        saveLiveState(); // Salva no localStorage
        
        // Sempre vai para a faixa [AMV] - WARRIORS (índice 1) ao sair do modo ao vivo
        index = 1;
        bgVideo.loop = false;
        
        console.log('Definindo index = 1 para [AMV] - WARRIORS:', songs[1]);
        
        setVideoSources(songs[index].src);
        atualizarFaixa();
        atualizarBackground();
        atualizarBotoesAvanco();
        updateTime();
        updatePlayButtonTooltip();
        
        // Chama renderPlaylist por último para garantir que o index correto seja usado
        renderPlaylist(index);
        
        console.log('Index após todas as chamadas:', index);
        
        // Reproduz automaticamente a música do índice 1
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
            console.error("Erro ao reproduzir automaticamente:", error);
            playPauseButton.innerHTML = textButtonPlay;
            miniPlayPauseButton.innerHTML = miniIconPlay;
            bgVideo.removeEventListener('canplay', autoPlayHandler);
          });
        }
      } else {
        // Entrar no modo ao vivo - inicia transmissão da playlist
        console.log('Entrando no modo ao vivo');
        isLiveMode = true;
        
        // Verifica se deve retomar a transmissão anterior
        if (lastLiveSong !== null && liveExitTime > 0) {
          console.log('Retomando transmissão anterior. Música:', lastLiveSong, 'Tempo:', lastLiveTime);
          // Calcula quanto tempo passou desde que saiu do modo ao vivo
          const timeAway = (Date.now() - liveExitTime) / 1000; // em segundos
          livePlaylistIndex = lastLiveSong;
          
          // Simula que a transmissão continuou
          const projectedTime = lastLiveTime + timeAway;
          
          // Sempre tenta retomar a mesma música primeiro
          if (songs[livePlaylistIndex] && songs[livePlaylistIndex].src) {
            index = livePlaylistIndex;
            setVideoSources(songs[index].src);
            
            const resumeHandler = () => {
              if (bgVideo.duration && !isNaN(bgVideo.duration)) {
                if (projectedTime >= bgVideo.duration) {
                  // Se o tempo projetado passou da duração, vai para a próxima música
                  livePlaylistIndex++;
                  
                  // Se chegou ao final da playlist, reinicia do começo
                  if (livePlaylistIndex >= songs.length - 1) {
                    livePlaylistIndex = 1;
                  }
                  
                  // Pula músicas sem src
                  while (livePlaylistIndex < songs.length - 1 && !songs[livePlaylistIndex].src) {
                    livePlaylistIndex++;
                  }
                  
                  // Carrega a próxima música
                  index = livePlaylistIndex;
                  setVideoSources(songs[index].src);
                  atualizarFaixa();
                  atualizarBackground();
                  
                  const nextSongHandler = () => {
                    if (bgVideo.duration && !isNaN(bgVideo.duration)) {
                      // Calcula o tempo restante e aplica na nova música
                      const overflowTime = projectedTime - bgVideo.duration;
                      const newTime = Math.min(overflowTime, bgVideo.duration * 0.9);
                      bgVideo.currentTime = Math.max(0, newTime);
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
                  // Continua na mesma música, mas em ponto mais avançado
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
            atualizarBackground();
            return;
          }
        }
        
        // Primeira vez ou fallback - escolhe música aleatória
        const validSongs = [];
        for (let i = 1; i < songs.length - 1; i++) { // Inclui todas as músicas da playlist (primeira até última música real)
          if (songs[i].src) {
            validSongs.push(i);
          }
        }
        
        console.log('Músicas válidas para modo ao vivo:', validSongs);
        
        // Escolhe uma música aleatória do array de músicas válidas
        if (validSongs.length > 0) {
          const randomIndex = Math.floor(Math.random() * validSongs.length);
          livePlaylistIndex = validSongs[randomIndex];
        } else {
          livePlaylistIndex = 1; // Fallback para a primeira música
        }
        
        // Garante que a música escolhida tem src (caso não tenha sido pega no filtro acima)
        while (livePlaylistIndex < songs.length - 1 && !songs[livePlaylistIndex].src) {
          livePlaylistIndex++;
        }
        
        if (livePlaylistIndex < songs.length - 1) {
          index = livePlaylistIndex;
          setVideoSources(songs[index].src);
          atualizarFaixa();
          atualizarBackground();
          bgVideo.loop = false; // Não faz loop individual, mas continua para próxima
          
          // Inicia a reprodução automaticamente
          playPauseButton.innerHTML = textButtonLoading;
          miniPlayPauseButton.innerHTML = miniIconLoading;
          
          const playHandler = () => {
            // Define um tempo aleatório na música (entre 0% e 80% da duração)
            if (bgVideo.duration && !isNaN(bgVideo.duration)) {
              const randomTime = Math.random() * (bgVideo.duration * 0.8); // Até 80% da música
              bgVideo.currentTime = randomTime;
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
            console.error("Erro ao reproduzir:", error);
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

// controles da playlist
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

// desenha o vídeo no canvas
function drawToCanvas() {
  if (!bgVideo.paused && !bgVideo.ended) {
    ctx.drawImage(bgVideo, 0, 0, syncCanvas.width, syncCanvas.height);
  }
  requestAnimationFrame(drawToCanvas);
}

// Eventos específicos para Picture-in-Picture
bgVideo.addEventListener('enterpictureinpicture', () => {
  console.log('Entrou em Picture-in-Picture');
  const pipButton = document.getElementById('pipButton');
  if (pipButton) {
    pipButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ffffff86;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="9" y="9" width="8" height="8" rx="1" ry="1"></rect></svg>Sair do Picture-in-Picture';
  }
});

bgVideo.addEventListener('leavepictureinpicture', () => {
  console.log('Saiu do Picture-in-Picture');
  const pipButton = document.getElementById('pipButton');
  if (pipButton) {
    pipButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ffffff86;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><rect x="9" y="9" width="8" height="8" rx="1" ry="1"></rect></svg>Ativar Picture-in-Picture';
  }
});

// cores da paleta Catppuccin
const catppuccinColors = [
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

// elementos do nome da música e autor
const musicNameElement = document.getElementById('musicName');
const musicAuthorElement = document.getElementById('musicAuthor');

// altera a cor do nome da música e autor
function changeMusicNameColor() {
  // não altera cor na primeira faixa (capa)
  if (index === 0) {
    musicNameElement.style.color = '';
    musicAuthorElement.style.color = '';
    miniMusicName.style.color = '';
    miniMusicAuthor.style.color = '';
    return;
  }

  // escolhe cor aleatória da paleta
  const randomColor = catppuccinColors[Math.floor(Math.random() * catppuccinColors.length)];
  
  // aplica a mesma cor no nome e autor de ambos os players
  musicNameElement.style.color = randomColor;
  musicAuthorElement.style.color = randomColor;
  miniMusicName.style.color = randomColor;
  miniMusicAuthor.style.color = randomColor;
}

// quando a música mudar
document.getElementById('nextButton').addEventListener('click', () => {
  changeMusicNameColor();
  atualizarVerticalCover();
});

function togglePlaylist() {
  const playlistSection = document.getElementById('playlistSection');
  
  if (playlistSection.classList.contains('expanded')) {
    // fechar playlist
    playlistSection.classList.add('closing');
    playlistSection.classList.remove('expanded');
    
    // só esconde após a transição
    playlistSection.addEventListener('transitionend', function handler() {
      playlistSection.style.display = 'none';
      playlistSection.classList.remove('closing');
      playlistSection.removeEventListener('transitionend', handler);
      
      // limpa a playlist ao fechar
      playlistItems.innerHTML = "";
    });
  } else {
    // abrir playlist
    playlistSection.style.display = 'flex';
    // força o reflow
    void playlistSection.offsetWidth;
    playlistSection.classList.add('expanded');
    
    // regenera a playlist ao abrir
    setTimeout(() => {
      renderPlaylist(index);
    }, 50);
  }
}
