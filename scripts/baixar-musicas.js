const fs = require('fs');
const path = require('path');

const MUSICAS = [
  { titulo: 'Ai Se Eu Te Pego', artista: 'Michel Teló', ano: 2011, categoria: 'Sertanejo Universitário', dicas: ['Artista brasileiro', 'Grande hit de 2011', 'Ficou famosa em toda a Europa'] },
  { titulo: 'Fugidinha', artista: 'Michel Teló', ano: 2010, categoria: 'Sertanejo Universitário', dicas: ['Artista brasileiro', 'Sertanejo universitário dos anos 2010', 'Do mesmo cantor de "Ai Se Eu Te Pego"'] },
  { titulo: 'Leão', artista: 'Marília Mendonça', ano: 2020, categoria: 'Feminejo', dicas: ['Artista brasileira', 'Sucesso recente', 'Da "Rainha da Sofrência"'] },
  { titulo: 'Infiel', artista: 'Marília Mendonça', ano: 2016, categoria: 'Feminejo', dicas: ['Artista brasileira', 'Sertanejo dos anos 2010', 'Um dos maiores hits da carreira da cantora'] },
  { titulo: 'Eu Sei de Cor', artista: 'Marília Mendonça', ano: 2016, categoria: 'Feminejo', dicas: ['Artista brasileira', 'Feminejo', 'Do mesmo álbum de "Infiel"'] },
  { titulo: 'Tubarões', artista: 'Diego & Victor Hugo', ano: 2024, categoria: 'Sertanejo', dicas: ['Artista brasileiro', 'Dupla sertaneja', 'Hit recente de 2024'] },
  { titulo: 'Última Saudade', artista: 'Henrique & Juliano', ano: 2024, categoria: 'Sertanejo', dicas: ['Artista brasileiro', 'Dupla sertaneja famosa', 'Do álbum "Manuel" (2024)'] },
  { titulo: 'Cuida Bem Dela', artista: 'Henrique & Juliano', ano: 2014, categoria: 'Sertanejo', dicas: ['Artista brasileiro', 'Dupla sertaneja', 'Grande sucesso de 2014'] },
  { titulo: 'Colo', artista: 'Jorge & Mateus', ano: 2015, categoria: 'Sertanejo', dicas: ['Artista brasileiro', 'Dupla sertaneja', 'Hit dos anos 2010'] },
  { titulo: 'Amo Noite e Dia', artista: 'Jorge & Mateus', ano: 2010, categoria: 'Sertanejo', dicas: ['Artista brasileiro', 'Sertanejo universitário', 'Começo da carreira da dupla'] },
  { titulo: 'Dou a Vida por um Beijo', artista: 'Zezé Di Camargo & Luciano', ano: 2000, categoria: 'Sertanejo', dicas: ['Artista brasileiro', 'Sertanejo romântico dos anos 2000', 'Dupla famosa pelo hit "É o Amor"'] },
  { titulo: 'Dormi na Praça', artista: 'Bruno & Marrone', ano: 2001, categoria: 'Sertanejo', dicas: ['Artista brasileiro', 'Sertanejo dos anos 2000', 'Dupla com o hit "Choram as Rosas"'] },
  { titulo: 'Choram as Rosas', artista: 'Bruno & Marrone', ano: 2003, categoria: 'Sertanejo', dicas: ['Artista brasileiro', 'Sertanejo romântico', 'Um dos maiores sucessos da dupla'] },
  { titulo: 'P do Pecado', artista: 'Grupo Menos é Mais e Simone Mendes', ano: 2024, categoria: 'Pagode', dicas: ['Artista brasileiro', 'Pagode recente', 'Parceria de 2024 com Simone Mendes'] },
  { titulo: 'Coração Partido', artista: 'Grupo Menos é Mais', ano: 2024, categoria: 'Pagode', dicas: ['Artista brasileiro', 'Pagode', 'Do mesmo grupo de "P do Pecado"'] },
  { titulo: 'Tá Vendo Aquela Lua', artista: 'Exaltasamba', ano: 2010, categoria: 'Pagode', dicas: ['Artista brasileiro', 'Pagode dos anos 2010', 'Grande sucesso do grupo'] },
  { titulo: 'Guerra Fria', artista: 'Sorriso Maroto', ano: 2010, categoria: 'Pagode', dicas: ['Artista brasileiro', 'Pagode romântico', 'Hit do grupo Sorriso Maroto'] },
  { titulo: 'Vai Vadiar', artista: 'Zeca Pagodinho', ano: 2000, categoria: 'Samba', dicas: ['Artista brasileiro', 'Samba carioca dos anos 2000', 'Do mesmo cantor de "Deixa a Vida Me Levar"'] },
  { titulo: 'Deixa A Vida Me Levar', artista: 'Zeca Pagodinho', ano: 2002, categoria: 'Samba', dicas: ['Artista brasileiro', 'Samba de 2002', 'Muito tocada em rodas de samba'] },
  { titulo: 'Você Abusou', artista: 'Jorge Aragão', ano: 2001, categoria: 'Samba', dicas: ['Artista brasileiro', 'Samba', 'Regravação de clássico de Antônio Carlos & Jocafi'] },
  { titulo: 'Mel Na Boca', artista: 'Almir Guineto', ano: 2000, categoria: 'Samba', dicas: ['Artista brasileiro', 'Samba dos anos 2000', 'Do fundador do grupo Fundo de Quintal'] },
  { titulo: 'Agachadinho', artista: 'Harmonia do Samba', ano: 2000, categoria: 'Pagode Baiano', dicas: ['Artista brasileiro', 'Axé/Pagode baiano', 'Hit de 2000 na Bahia'] },
  { titulo: 'Vem Neném', artista: 'Harmonia do Samba', ano: 2000, categoria: 'Pagode Baiano', dicas: ['Artista brasileiro', 'Pagode baiano', 'Do mesmo grupo de "Agachadinho"'] },
  { titulo: 'Xote dos Milagres', artista: 'Falamansa', ano: 2000, categoria: 'Forró', dicas: ['Artista brasileiro', 'Forró universitário', 'Grande sucesso do início dos anos 2000'] },
  { titulo: 'Rindo à Toa', artista: 'Falamansa', ano: 2001, categoria: 'Forró', dicas: ['Artista brasileiro', 'Forró', 'Do mesmo grupo de "Xote dos Milagres"'] },
  { titulo: 'Esperando na Janela', artista: 'Gilberto Gil', ano: 2000, categoria: 'Forró', dicas: ['Artista brasileiro', 'Forró/MPB', 'Trilha do filme "Eu, Tu, Eles"'] },
  { titulo: 'Eu Quero Tchu, Eu Quero Tcha', artista: 'João Lucas & Marcelo', ano: 2011, categoria: 'Sertanejo', dicas: ['Artista brasileiro', 'Hit de 2011', 'Música que viralizou com Neymar'] },
  { titulo: 'Trem-Bala', artista: 'Ana Vilela', ano: 2016, categoria: 'MPB', dicas: ['Artista brasileira', 'MPB de 2016', 'Viralizou nas redes sociais'] },
  { titulo: 'Pra Você Guardei o Amor', artista: 'Nando Reis e Marisa Monte', ano: 2009, categoria: 'MPB', dicas: ['Artista brasileiro', 'MPB dos anos 2000', 'Dueto famoso de 2009'] },
  { titulo: 'Ainda Bem', artista: 'Marisa Monte', ano: 2011, categoria: 'MPB', dicas: ['Artista brasileira', 'MPB de 2011', 'Do álbum "O Que Você Quer Saber de Verdade"'] },
  { titulo: 'Amor I Love You', artista: 'Marisa Monte', ano: 2000, categoria: 'MPB', dicas: ['Artista brasileira', 'MPB dos anos 2000', 'Famosa pela participação de Carlinhos Brown'] },
  { titulo: 'Velha Infância', artista: 'Tribalistas', ano: 2002, categoria: 'MPB', dicas: ['Artista brasileiro', 'MPB dos anos 2000', 'Tema da novela "Mulheres Apaixonadas"'] },
  { titulo: 'Já Sei Namorar', artista: 'Tribalistas', ano: 2002, categoria: 'MPB', dicas: ['Artista brasileiro', 'MPB de 2002', 'Do trio formado por Marisa, Carlinhos e Arnaldo'] },
  { titulo: 'Ai, Ai, Ai', artista: 'Vanessa da Mata', ano: 2007, categoria: 'MPB', dicas: ['Artista brasileira', 'MPB dos anos 2000', 'Da cantora de "Boa Sorte"'] },
  { titulo: 'Boa Sorte/Good Luck', artista: 'Vanessa da Mata e Ben Harper', ano: 2007, categoria: 'MPB', dicas: ['Artista brasileira', 'MPB de 2007', 'Dueto com cantor americano'] },
  { titulo: 'Envolver', artista: 'Anitta', ano: 2021, categoria: 'Funk', dicas: ['Artista brasileira', 'Hit recente', 'Ficou famosa mundialmente em 2022'] },
  { titulo: 'Paradinha', artista: 'Anitta', ano: 2017, categoria: 'Funk', dicas: ['Artista brasileira', 'Funk pop', 'Sucesso de 2017'] },
  { titulo: 'Vai Malandra', artista: 'Anitta', ano: 2017, categoria: 'Funk', dicas: ['Artista brasileira', 'Funk de 2017', 'Clipe gravado no Morro do Vidigal'] },
  { titulo: 'Bola Rebola', artista: 'Anitta, Tropkillaz, J Balvin', ano: 2019, categoria: 'Funk', dicas: ['Artista brasileira', 'Parceria internacional de 2019', 'Com J Balvin e Tropkillaz'] },
  { titulo: 'Favela Chegou', artista: 'Ludmilla e Anitta', ano: 2019, categoria: 'Funk', dicas: ['Artista brasileira', 'Funk de 2019', 'Parceria entre duas grandes cantoras'] },
  { titulo: 'Onda Diferente', artista: 'Anitta, Ludmilla, Snoop Dogg', ano: 2019, categoria: 'Funk', dicas: ['Artista brasileira', 'Parceria internacional', 'Com Snoop Dogg'] },
  { titulo: 'Socadona', artista: 'Ludmilla', ano: 2021, categoria: 'Funk', dicas: ['Artista brasileira', 'Funk recente', 'Hit de 2021'] },
  { titulo: 'Rainha da Favela', artista: 'Ludmilla', ano: 2020, categoria: 'Funk', dicas: ['Artista brasileira', 'Funk pop', 'Sucesso de 2020'] },
  { titulo: 'Verdinha', artista: 'Ludmilla', ano: 2019, categoria: 'Funk', dicas: ['Artista brasileira', 'Funk', 'Hit de 2019'] },
  { titulo: 'Cheguei', artista: 'Ludmilla', ano: 2017, categoria: 'Funk', dicas: ['Artista brasileira', 'Funk pop', 'Um dos primeiros hits da cantora'] },
  { titulo: 'Se Eu Não Te Amasse Tanto Assim', artista: 'Ivete Sangalo', ano: 2000, categoria: 'MPB', dicas: ['Artista brasileira', 'MPB/pop dos anos 2000', 'Regravação de Roberto Carlos'] },
  { titulo: 'Extravasa', artista: 'Claudia Leitte', ano: 2010, categoria: 'Axé', dicas: ['Artista brasileira', 'Axé dos anos 2010', 'Hit de carnaval'] },
  { titulo: 'Xibom Bombom', artista: 'As Meninas', ano: 2000, categoria: 'Axé', dicas: ['Artista brasileiro', 'Axé dos anos 2000', 'Hit de carnaval do grupo baiano'] },
  { titulo: 'Leilão', artista: 'César Menotti & Fabiano', ano: 2005, categoria: 'Sertanejo', dicas: ['Artista brasileiro', 'Sertanejo dos anos 2000', 'Da dupla mineira de sucesso'] },
  { titulo: 'Vem me Amar', artista: 'Alexandre Pires', ano: 2000, categoria: 'Samba', dicas: ['Artista brasileiro', 'Samba/pagode dos anos 2000', 'Do ex-vocalista do Soweto'] },
];

const PASTA_AUDIO = path.join(__dirname, '../public/audio');
const PASTA_IMG = path.join(__dirname, '../public/img');
const ARQUIVO_JSON = path.join(__dirname, '../data/musicas.json');

fs.mkdirSync(PASTA_AUDIO, { recursive: true });
fs.mkdirSync(PASTA_IMG, { recursive: true });
fs.mkdirSync(path.dirname(ARQUIVO_JSON), { recursive: true });

async function buscarITunes(titulo, artista) {
  const termo = encodeURIComponent(titulo + ' ' + artista);
  const url = 'https://itunes.apple.com/search?term=' + termo + '&media=music&country=BR&limit=5';
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

async function baixarArquivo(url, destino) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destino, buffer);
}

async function main() {
  const catalogo = [];
  let idx = 1;

  for (const m of MUSICAS) {
    const id = 'mus_' + String(idx).padStart(3, '0');
    console.log('[' + idx + '/' + MUSICAS.length + '] ' + m.titulo + ' - ' + m.artista);

    try {
      const resultados = await buscarITunes(m.titulo, m.artista);
      const match = resultados.find(r => r.previewUrl);

      if (!match) {
        console.log('  ⚠️  Sem preview disponível, pulando.');
        idx++;
        continue;
      }

      const nomeAudio = id + '.m4a';
      const nomeImg = id + '.jpg';

      await baixarArquivo(match.previewUrl, path.join(PASTA_AUDIO, nomeAudio));

      const capaUrl = match.artworkUrl100 ? match.artworkUrl100.replace('100x100', '600x600') : null;
      if (capaUrl) await baixarArquivo(capaUrl, path.join(PASTA_IMG, nomeImg));

      catalogo.push({
        id,
        titulo: m.titulo,
        artista: m.artista,
        ano: m.ano,
        categoria: m.categoria,
        capaUrl: 'img/' + nomeImg,
        previewUrl: 'audio/' + nomeAudio,
        duracaoPreview: 30,
        dicas: m.dicas
      });

      console.log('  ✅ OK');
    } catch (e) {
      console.log('  ❌ Erro: ' + e.message);
    }

    await new Promise(r => setTimeout(r, 300));
    idx++;
  }

  fs.writeFileSync(ARQUIVO_JSON, JSON.stringify(catalogo, null, 2));
  console.log('\n✅ Catálogo salvo em data/musicas.json');
  console.log('Total de músicas baixadas: ' + catalogo.length);
}

main().catch(console.error);