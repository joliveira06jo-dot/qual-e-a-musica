const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.get('/telao', (req, res) => res.sendFile(path.join(__dirname, '../public/telao/index.html')));
app.get('/celular', (req, res) => res.sendFile(path.join(__dirname, '../public/celular/index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/index.html')));

const BASE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;

const CATALOGO = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/musicas.json'), 'utf8'));
const salas = {};
const ESTAGIOS = [
  { duracao: 2, pontos: 1000, dicaIdx: null },
  { duracao: 4, pontos: 800, dicaIdx: 0 },
  { duracao: 6, pontos: 600, dicaIdx: 1 },
  { duracao: 10, pontos: 400, dicaIdx: 2 }
];

function gerarCodigo() {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; let s = '';
  for (let i = 0; i < 4; i++) s += c.charAt(Math.floor(Math.random() * c.length));
  return salas[s] ? gerarCodigo() : s;
}
function sortearMusicas(cats, qtd) {
  let p = cats && cats.length ? CATALOGO.filter(m => cats.includes(m.categoria)) : CATALOGO.slice();
  p = p.sort(() => Math.random() - 0.5);
  return p.slice(0, qtd);
}
function estadoPublico(sala) {
  return {
    codigo: sala.codigo, jogadores: sala.jogadores, loginsBloqueados: sala.loginsBloqueados,
    partidaIniciada: sala.partidaIniciada,
    rodada: sala.rodada ? {
      numero: sala.rodada.numero, totalMusicas: sala.rodada.totalMusicas,
      estagio: sala.rodada.estagio,
      duracao: ESTAGIOS[sala.rodada.estagio].duracao, pontos: ESTAGIOS[sala.rodada.estagio].pontos,
      dica: sala.rodada.dica, estado: sala.rodada.estado,
      equipeDaVez: sala.rodada.equipeDaVez, modo: sala.rodada.modo, resultado: sala.rodada.resultado,
      jaPassou: sala.rodada.jaPassou, passeDe: sala.rodada.passeDe,
      proximoEstagio: sala.rodada.estagio < 3 ? {
        duracao: ESTAGIOS[sala.rodada.estagio + 1].duracao,
        pontos: ESTAGIOS[sala.rodada.estagio + 1].pontos
      } : null,
      musica: {
        titulo: sala.rodada.musica.titulo, artista: sala.rodada.musica.artista,
        ano: sala.rodada.musica.ano, categoria: sala.rodada.musica.categoria,
        capaUrl: sala.rodada.musica.capaUrl,
        dicas: sala.rodada.musica.dicas // IMPORTANTE PARA O TELÃO
      }
    } : null,
    placar: sala.placar, log: sala.log,
    historicoMusicas: sala.historicoMusicas || []
  };
}
function logar(sala, texto) {
  sala.log.unshift({ texto, ts: Date.now() });
  if (sala.log.length > 10) sala.log.pop();
}
function criarEstadoSala(codigo, adminId) {
  return { codigo, adminId, jogadores: [], loginsBloqueados: false,
    partidaIniciada: false, rodada: null, placar: { vermelha: 0, azul: 0 },
    filaMusicas: [], indiceMusica: 0, log: [], timeoutBuzina: null, historicoMusicas: [] };
}
function finalizarRodadaNoHistorico(s) {
  if (!s.rodada || s.rodada.adicionadoAoHistorico) return;
  s.historicoMusicas.push({
    numero: s.rodada.numero,
    titulo: s.rodada.musica.titulo, artista: s.rodada.musica.artista,
    ano: s.rodada.musica.ano, capaUrl: s.rodada.musica.capaUrl,
    resultado: s.rodada.resultado,
    equipeVencedora: s.rodada.equipeVencedora,
    equipeZerada: s.rodada.equipeZerada,
    pontos: s.rodada.pontosGanhos
  });
  s.rodada.adicionadoAoHistorico = true;
}

io.on('connection', (socket) => {
  socket.on('admin:criar_sala', async () => {
    const codigo = gerarCodigo();
    salas[codigo] = criarEstadoSala(codigo, socket.id);
    socket.codigoSala = codigo;
    const qrCode = await QRCode.toDataURL(`${BASE_URL}/celular?sala=${codigo}`, { margin: 0 });
    io.emit('sala:criada', { codigo, qrCode });
    io.emit('sala:estado', estadoPublico(salas[codigo]));
  });

  socket.on('admin:nova_partida', async () => {
    const antigo = socket.codigoSala;
    if (antigo) delete salas[antigo];
    const codigo = gerarCodigo();
    salas[codigo] = criarEstadoSala(codigo, socket.id);
    socket.codigoSala = codigo;
    const qrCode = await QRCode.toDataURL(`${BASE_URL}/celular?sala=${codigo}`, { margin: 0 });
    io.emit('nova_partida', { codigo, qrCode });
    io.emit('sala:criada', { codigo, qrCode });
    io.emit('sala:estado', estadoPublico(salas[codigo]));
  });

  socket.on('jogador:entrar', ({ nome, codigoSala }) => {
    const s = salas[codigoSala];
    if (!s) return socket.emit('erro', { mensagem: 'Sala não encontrada.' });
    if (s.loginsBloqueados) return socket.emit('erro', { mensagem: 'Logins bloqueados pelo Maestro.' });
    socket.codigoSala = codigoSala;
    s.jogadores.push({ id: socket.id, nome, equipe: null });
    logar(s, '👤 ' + nome + ' entrou');
    io.emit('sala:estado', estadoPublico(s));
  });

  socket.on('admin:atribuir_equipe', ({ idDispositivo, equipe }) => {
    const s = salas[socket.codigoSala]; if (!s) return;
    const j = s.jogadores.find(x => x.id === idDispositivo);
    if (j) { j.equipe = equipe; logar(s, '🏷️ ' + j.nome + ' → ' + equipe); io.emit('sala:estado', estadoPublico(s)); }
  });
  socket.on('admin:expulsar_dispositivo', ({ idDispositivo }) => {
    const s = salas[socket.codigoSala]; if (!s) return;
    s.jogadores = s.jogadores.filter(j => j.id !== idDispositivo);
    io.to(idDispositivo).emit('jogador:removido');
    io.emit('sala:estado', estadoPublico(s));
  });
  socket.on('admin:bloquear_logins', ({ bloquear }) => {
    const s = salas[socket.codigoSala]; if (!s) return;
    s.loginsBloqueados = bloquear; io.emit('sala:estado', estadoPublico(s));
  });

  socket.on('admin:iniciar_partida', ({ categorias, totalRodadas }) => {
    const s = salas[socket.codigoSala]; if (!s) return;
    const t = Math.min(Math.max(totalRodadas || 5, 1), 10);
    s.filaMusicas = sortearMusicas(categorias, t);
    s.indiceMusica = 0; s.placar = { vermelha: 0, azul: 0 }; s.partidaIniciada = true;
    s.historicoMusicas = [];
    logar(s, '🎮 Partida iniciada (' + t + ' músicas)');
    iniciarMusica(s);
  });

  function iniciarMusica(s) {
    if (s.timeoutBuzina) { clearTimeout(s.timeoutBuzina); s.timeoutBuzina = null; }
    const m = s.filaMusicas[s.indiceMusica];
    if (!m) {
      s.rodada = null; logar(s, '🏁 Fim de partida!');
      const vencedor = s.placar.vermelha > s.placar.azul ? 'vermelha' :
                       s.placar.azul > s.placar.vermelha ? 'azul' : 'empate';
      io.emit('partida:encerrada', { placar: s.placar, vencedor });
      io.emit('sala:estado', estadoPublico(s)); return;
    }
    s.rodada = { numero: s.indiceMusica + 1, totalMusicas: s.filaMusicas.length,
      estagio: 0, musica: m, dica: null, estado: 'AGUARDANDO',
      equipeDaVez: null, modo: 'normal', resultado: null,
      jaPassou: false, passeDe: null,
      adicionadoAoHistorico: false, pontosGanhos: 0, equipeVencedora: null, equipeZerada: null };
    io.emit('rodada:iniciada', estadoPublico(s));
  }

  socket.on('admin:tocar_trecho', () => {
    const s = salas[socket.codigoSala]; if (!s || !s.rodada) return;
    const r = s.rodada;
    if (r.estado !== 'AGUARDANDO' && r.estado !== 'BUZINA') return;
    const est = ESTAGIOS[r.estagio];
    r.estado = 'TOCANDO'; r.equipeDaVez = null; r.modo = 'normal'; r.resultado = null;
    if (est.dicaIdx !== null) r.dica = r.musica.dicas[est.dicaIdx];
    io.emit('audio:tocar', { url: r.musica.previewUrl, duracao: est.duracao, dica: r.dica });
    io.emit('sala:estado', estadoPublico(s));
    setTimeout(() => {
      if (s.rodada && s.rodada.estado === 'TOCANDO') {
        s.rodada.estado = 'BUZINA';
        io.emit('buzina:habilitada', { timeout: 10 });
        io.emit('sala:estado', estadoPublico(s));
        s.timeoutBuzina = setTimeout(() => {
          if (s.rodada && s.rodada.estado === 'BUZINA') {
            io.emit('buzina:timeout');
            logar(s, '⏱️ Ninguém apertou (música ' + s.rodada.numero + ', estágio ' + (s.rodada.estagio + 1) + ')');
            io.emit('sala:estado', estadoPublico(s));
          }
        }, 10000);
      }
    }, est.duracao * 1000 + 500);
  });

  socket.on('admin:proximo_estagio', () => {
    const s = salas[socket.codigoSala]; if (!s || !s.rodada) return;
    if (s.rodada.modo === 'virada' && s.rodada.estado === 'RESPONDENDO') return;
    if (s.timeoutBuzina) { clearTimeout(s.timeoutBuzina); s.timeoutBuzina = null; }
    const r = s.rodada;
    if (r.estagio >= 3) {
      r.estado = 'REVELACAO';
      logar(s, '🎬 Fim dos estágios, indo para revelação');
    } else {
      r.estagio++; r.estado = 'AGUARDANDO'; r.equipeDaVez = null; r.modo = 'normal';
      logar(s, '⏭️ Estágio ' + (r.estagio + 1) + ' (' + ESTAGIOS[r.estagio].duracao + 's / ' + ESTAGIOS[r.estagio].pontos + ' pts)');
    }
    io.emit('sala:estado', estadoPublico(s));
  });

  socket.on('equipe:buzinar', ({ equipe }) => {
    const s = salas[socket.codigoSala];
    if (!s || !s.rodada || s.rodada.estado !== 'BUZINA') return;
    if (s.timeoutBuzina) { clearTimeout(s.timeoutBuzina); s.timeoutBuzina = null; }
    s.rodada.estado = 'RESPONDENDO'; s.rodada.equipeDaVez = equipe; s.rodada.modo = 'normal';
    logar(s, '🔔 ' + equipe + ' apertou primeiro');
    io.emit('buzina:apertada', { equipe });
    io.emit('buzina:desabilitada');
    io.emit('sala:estado', estadoPublico(s));
  });

  socket.on('admin:marcar_acertou', ({ equipe }) => {
    const s = salas[socket.codigoSala]; if (!s || !s.rodada) return;
    const est = ESTAGIOS[s.rodada.estagio];
    const pts = s.rodada.modo === 'virada' ? est.pontos * 2 : est.pontos;
    s.placar[equipe] += pts;
    s.rodada.resultado = 'acertou'; s.rodada.equipeDaVez = equipe; s.rodada.estado = 'REVELACAO';
    s.rodada.pontosGanhos = pts; s.rodada.equipeVencedora = equipe;
    logar(s, '✅ ' + equipe + ' acertou +' + pts + (s.rodada.modo === 'virada' ? ' [VIRADA]' : '') + (s.rodada.jaPassou ? ' [pós-passe]' : ''));
    finalizarRodadaNoHistorico(s);
    io.emit('resultado:acertou', { equipe, pontos: pts });
    io.emit('sala:estado', estadoPublico(s));
  });

  socket.on('admin:marcar_errou', ({ equipe }) => {
    const s = salas[socket.codigoSala]; if (!s || !s.rodada) return;
    const est = ESTAGIOS[s.rodada.estagio];
    const isUltimo = s.rodada.estagio === 3;
    const isVirada = s.rodada.modo === 'virada';
    const isPosPasse = s.rodada.jaPassou && s.rodada.equipeDaVez === equipe;

    if (isVirada) {
      s.rodada.resultado = 'ninguem'; s.rodada.estado = 'REVELACAO';
      s.rodada.pontosGanhos = 0;
      logar(s, '❌ ' + equipe + ' errou na virada (NÃO perdeu). Fim.');
      io.emit('resultado:errou', { equipe, zerou: false });
      finalizarRodadaNoHistorico(s);
    } else if (isUltimo) {
      const ptsAntes = s.placar[equipe];
      s.placar[equipe] = 0;
      s.rodada.resultado = 'zerou'; s.rodada.estado = 'REVELACAO';
      s.rodada.pontosGanhos = -ptsAntes; s.rodada.equipeZerada = equipe;
      logar(s, '💀 ' + equipe + ' errou no ÚLTIMO e ZEROU!');
      io.emit('resultado:zerou', { equipe });
      finalizarRodadaNoHistorico(s);
    } else if (isPosPasse) {
      s.rodada.resultado = 'ninguem'; s.rodada.estado = 'REVELACAO';
      s.rodada.pontosGanhos = 0;
      logar(s, '❌ ' + equipe + ' errou após receber o passe (NÃO perdeu pontos). Fim.');
      io.emit('resultado:errou', { equipe, zerou: false });
      finalizarRodadaNoHistorico(s);
    } else {
      const ptsAntes = s.placar[equipe];
      s.placar[equipe] = 0;
      s.rodada.pontosGanhos = -ptsAntes; s.rodada.equipeZerada = equipe;
      const outra = equipe === 'vermelha' ? 'azul' : 'vermelha';
      s.rodada.equipeDaVez = outra; s.rodada.modo = 'virada'; s.rodada.estado = 'RESPONDENDO';
      logar(s, '💀 ' + equipe + ' errou e ZEROU (-' + ptsAntes + '). 🔄 VIROU O DISCO! ' + outra + ' pode ganhar ' + (est.pontos * 2) + ' pts!');
      io.emit('resultado:zerou', { equipe });
      io.emit('resultado:virada', { equipe: outra, pontos: est.pontos * 2 });
    }
    io.emit('sala:estado', estadoPublico(s));
  });

  socket.on('admin:marcar_passar_vez', () => {
    const s = salas[socket.codigoSala]; if (!s || !s.rodada) return;
    if (s.rodada.estagio === 3) return;
    if (s.rodada.modo === 'virada') return;
    if (s.rodada.jaPassou) return;
    const de = s.rodada.equipeDaVez;
    const para = de === 'vermelha' ? 'azul' : 'vermelha';
    s.rodada.equipeDaVez = para;
    s.rodada.modo = 'normal';
    s.rodada.estado = 'RESPONDENDO';
    s.rodada.jaPassou = true;
    s.rodada.passeDe = de;
    logar(s, '↔️ ' + de + ' passou a vez para ' + para + ' (passe único)');
    io.emit('resultado:passou', { de, para, pontos: ESTAGIOS[s.rodada.estagio].pontos });
    io.emit('sala:estado', estadoPublico(s));
  });

  socket.on('admin:marcar_nao_respondeu', () => {
    const s = salas[socket.codigoSala]; if (!s || !s.rodada) return;
    if (s.rodada.estagio === 3) {
      const eq = s.rodada.equipeDaVez || 'vermelha';
      const ptsAntes = s.placar[eq];
      s.placar[eq] = 0; s.rodada.resultado = 'zerou'; s.rodada.estado = 'REVELACAO';
      s.rodada.pontosGanhos = -ptsAntes; s.rodada.equipeZerada = eq;
      logar(s, '💀 ' + eq + ' não respondeu no último estágio e ZEROU!');
      io.emit('resultado:zerou', { equipe: eq });
      finalizarRodadaNoHistorico(s);
      io.emit('sala:estado', estadoPublico(s));
    }
  });

  socket.on('admin:marcar_ninguem_acertou', () => {
    const s = salas[socket.codigoSala]; if (!s || !s.rodada) return;
    s.rodada.resultado = 'ninguem'; s.rodada.estado = 'REVELACAO';
    s.rodada.pontosGanhos = 0;
    logar(s, '❓ Ninguém acertou');
    finalizarRodadaNoHistorico(s);
    io.emit('sala:estado', estadoPublico(s));
  });

  socket.on('admin:tocar_revelacao', () => {
    const s = salas[socket.codigoSala]; if (!s || !s.rodada) return;
    s.rodada.estado = 'REVELACAO';
    finalizarRodadaNoHistorico(s);
    io.emit('audio:tocar', { url: s.rodada.musica.previewUrl, duracao: 30, dica: null });
    io.emit('rodada:revelacao', {
      musica: { titulo: s.rodada.musica.titulo, artista: s.rodada.musica.artista,
        ano: s.rodada.musica.ano, categoria: s.rodada.musica.categoria,
        capaUrl: s.rodada.musica.capaUrl },
      resultado: s.rodada.resultado
    });
    io.emit('sala:estado', estadoPublico(s));
  });

  socket.on('admin:proxima_rodada', () => {
    const s = salas[socket.codigoSala]; if (!s) return;
    s.indiceMusica++; iniciarMusica(s);
  });

  socket.on('admin:encerrar_partida', () => {
    const s = salas[socket.codigoSala]; if (!s) return;
    if (!s.partidaIniciada) return;
    if (s.timeoutBuzina) { clearTimeout(s.timeoutBuzina); s.timeoutBuzina = null; }
    s.rodada = null;
    logar(s, '🏁 Partida encerrada pelo Maestro!');
    const vencedor = s.placar.vermelha > s.placar.azul ? 'vermelha' :
                     s.placar.azul > s.placar.vermelha ? 'azul' : 'empate';
    io.emit('partida:encerrada', { placar: s.placar, vencedor });
    io.emit('sala:estado', estadoPublico(s));
  });

  socket.on('disconnect', () => {
    const s = salas[socket.codigoSala];
    if (s) { s.jogadores = s.jogadores.filter(j => j.id !== socket.id); io.emit('sala:estado', estadoPublico(s)); }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Base URL: ${BASE_URL}`);
});
