import songs from "./songs.js";

const playlistSection = document.getElementById("playlistSection");
const playerTitle = document.getElementById("playerTitle"); // Elemento que exibe o nome da faixa

function renderPlaylist(selectedIndex = 0) {
  playlistSection.innerHTML = ""; // Limpa a lista de músicas
  songs.forEach((song, idx) => {
    const li = document.createElement("li");
    li.textContent = song.author
      ? `${song.name} - ${song.author}`
      : song.name;
    li.style.cursor = "pointer";
    if (idx === selectedIndex) li.style.fontWeight = "bold";
    li.onclick = () => {
      renderPlaylist(idx);
      // Atualiza o título do player com o nome da música selecionada
      playerTitle.textContent = song.name;
      // Aqui pode ser adicionado o carregamento da música/vídeo, exemplo: player.src = song.src;
    };
    playlistSection.appendChild(li);
  });
}

// Chama a função para exibir a playlist ao iniciar
renderPlaylist();