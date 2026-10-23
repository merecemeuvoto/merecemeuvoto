/* ¿Merece Meu Voto? — a lógica do comparador por cadernos. Arquivo estático, sem dependência; lê os dados do
   <script id="mmv-dados" type="application/json"> que a página monta a partir de dados/ (lib/cadernos.ts).
   Origem: estudo «Comparador por cadernos» (docs/simulacoes, no repositório dos bastidores), alpha.9 de 23/out/2026. */
(function () {
  var D = JSON.parse(document.getElementById('mmv-dados').textContent);
  var CANDIDATURAS = D.candidaturas, GRUPOS = D.grupos, TEMAS = D.temas, TRECHOS = D.trechos;
  /* ---------- a lógica do comparador (alpha.9): um caderno por vez, em dois grupos (plano · histórico); marcação por par, na régua do
     par — «¿qual pesa mais para você?» A · igual · B · nenhuma —, sem seleção prévia; placar só no fim ou a pedido; revelação como fecho; régua só no
     mouse, carregando o filtro; capa que abre e folha que vira; indicador de IA que explica ao toque; fonte às cegas pede
     confirmação; o caderno começa fechado (capa à direita, frase à esquerda), «Próximo caderno» fecha o lado direito para a esquerda
     (contracapa «Em progresso») e abre o seguinte; o sininho abre o cardápio. Fala com a casa por eventos no document: «mmv:primeira-marca» (a pessoa fez a primeira marcação),
     «mmv:placar-aberto» (a tela «Meu placar» abriu) e «mmv:luz-alternar» (a pessoa pediu, no menu, para pausar ou ligar a luz). ---------- */
  /* a marcação é por par, na régua do par: «¿qual pesa mais para você?» — a candidatura da esquerda, igual, a da direita, nenhuma */
  var OPCOES_PAR = ['igual', 'nenhuma'];
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function dataExtenso(iso) { var p = iso.split('-'); return p[2] + '/' + MESES[Number(p[1]) - 1] + '/' + p[0]; }
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, texto) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (texto !== undefined) { e.textContent = texto; } return e; }
  function texto(s) { return document.createTextNode(s); }
  function icone(id, cls) { var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'icone' + (cls ? ' ' + cls : '')); s.setAttribute('aria-hidden', 'true'); var u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#' + id); s.appendChild(u); return s; }
  function todos(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
  function temaDe(chave) { return TEMAS.filter(function (t) { return t.chave === chave; })[0]; }
  function grupoDe(chave) { return GRUPOS.filter(function (g) { return g.chave === chave; })[0]; }
  function sinal(n) { return (n > 0 ? '+' : '') + n; }
  var reduz = false;
  try { reduz = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) {}

  /* ---------- estado: posição sorteada, rótulos A e B, nomes ocultos, marcações só deste navegador, caderno atual ---------- */
  var CHAVE = 'mmv.comparador.pares.v1', CHAVE_ENVELOPE = 'mmv.comparador.envelope';
  var CHAVES = Object.keys(CANDIDATURAS).sort(); /* alfabética pela chave; a posição A/B é sorteada a cada visita */
  var esquerda = Math.random() < 0.5 ? CHAVES[0] : CHAVES[1], direita = esquerda === CHAVES[0] ? CHAVES[1] : CHAVES[0];
  var rotulo = {}; rotulo[esquerda] = 'A'; rotulo[direita] = 'B';
  var revelado = false, invertido = false, marcas = {}, filtros = {}, filtroAberto = {}, modo = 'um', vendoPlacar = false, atual = TEMAS[0].chave;
  var livroFechado = true, livroTras = false, transicao = null; /* o primeiro caderno começa fechado, com a frase de abertura ao lado */
  try { var salvo = JSON.parse(localStorage.getItem(CHAVE) || '{}'); if (salvo && typeof salvo === 'object') { marcas = salvo; } } catch (e) {}
  try { var env = localStorage.getItem(CHAVE_ENVELOPE); if (env === 'pedra') { document.documentElement.setAttribute('data-envelope', 'pedra'); } } catch (e) {}
  function guardar() { try { localStorage.setItem(CHAVE, JSON.stringify(marcas)); } catch (e) {} }
  function nomeCurto(c) { return revelado ? CANDIDATURAS[c].nome + ' (' + CANDIDATURAS[c].partido + ' ' + CANDIDATURAS[c].numero + ')' : 'Candidatura ' + rotulo[c]; }
  function preencher(modelo, c) {
    return modelo
      .replace('{quem}', revelado ? 'de ' + CANDIDATURAS[c].nome : 'da candidatura ' + rotulo[c])
      .replace('{Quem}', revelado ? CANDIDATURAS[c].nome : 'O candidato ' + rotulo[c])
      .replace('{de quem}', revelado ? 'de ' + CANDIDATURAS[c].nome : 'do candidato ' + rotulo[c])
      .replace('{pessoa}', revelado ? CANDIDATURAS[c].nome : 'o candidato ' + rotulo[c])
      .replace('{nome}', revelado ? CANDIDATURAS[c].nome + ' (' + CANDIDATURAS[c].partido + ', ' + CANDIDATURAS[c].numero + ')' : 'candidatura ' + rotulo[c]);
  }
  function trechosDe(c, tema) { return TRECHOS.filter(function (t) { return (!c || t.candidato === c) && (!tema || t.tema === tema); }); }
  /* os pares de um caderno: o k-ésimo trecho de cada lado, na ordem; só pares com os dois lados recebem marcação */
  function paresDe(tema) {
    var deA = trechosDe(esquerda, tema).sort(function (x, y) { return x.ordem - y.ordem; }), deB = trechosDe(direita, tema).sort(function (x, y) { return x.ordem - y.ordem; });
    var lista = []; for (var k = 0; k < Math.max(deA.length, deB.length); k++) { lista.push({ id: tema + '-' + (k + 1), tema: tema, k: k, a: deA[k] || null, b: deB[k] || null, completo: !!(deA[k] && deB[k]) }); }
    return lista;
  }
  function paresMarcaveis(tema) { var lista = []; (tema ? [temaDe(tema)] : TEMAS).forEach(function (t) { paresDe(t.chave).forEach(function (p) { if (p.completo) { lista.push(p); } }); }); return lista; }
  function temTrechos(tema) { return trechosDe(null, tema.chave).length > 0; }
  var COM_TRECHOS = TEMAS.filter(temTrechos), SEM_TRECHOS = TEMAS.filter(function (t) { return !temTrechos(t); });
  function totalMarcas() { return paresMarcaveis().filter(function (p) { return !!marcas[p.id]; }).length; }
  function completo(tema) { var ps = paresMarcaveis(tema.chave); return ps.length > 0 && ps.every(function (p) { return !!marcas[p.id]; }); }
  /* a visita começa no primeiro caderno com trechos que ainda não foi marcado por inteiro */
  (function () { var pendente = COM_TRECHOS.filter(function (t) { return !completo(t); })[0]; if (pendente && totalMarcas() > 0) { atual = pendente.chave; } })();

  var comparador = $('comparador'), regua = $('regua'), reguaFiltro = $('regua-filtro'), envelope = $('envelope'), pontos = $('pontos'), progresso = $('progresso'), menu = $('menu'), menuBotao = $('menu-botao'), placarTela = $('placar-tela'), dicaIa = $('dica-ia');

  /* ---------- os retratos ---------- */
  function retrato(c, grande) { var r = el('span', 'retrato' + (grande ? ' grande' : '')); r.setAttribute('data-candidato', c); r.setAttribute('aria-hidden', 'true'); return r; }
  function pintarRetratos() {
    todos('.retrato').forEach(function (r) {
      var c = r.getAttribute('data-candidato'); r.textContent = '';
      var naEsquerda = (c === esquerda) !== invertido;
      if (!revelado) { r.appendChild(texto(naEsquerda ? '¿' : '?')); return; }
      if (CANDIDATURAS[c].foto) { var img = el('img'); img.src = CANDIDATURAS[c].foto; img.alt = 'Foto oficial de ' + CANDIDATURAS[c].nome; img.width = 420; img.height = 560; r.appendChild(img); r.appendChild(el('span', 'legenda', 'foto oficial · TSE')); return; }
      r.appendChild(el('span', 'numero', String(CANDIDATURAS[c].numero))); r.appendChild(el('span', 'legenda', 'foto TSE'));
    });
  }

  /* ---------- a navegação: um ponto por caderno, em dois grupos ---------- */
  GRUPOS.forEach(function (g) {
    var grupo = el('div', 'grupo'); grupo.setAttribute('role', 'group'); grupo.setAttribute('aria-label', g.titulo);
    grupo.appendChild(el('span', 'grupo-nome', g.curto));
    TEMAS.filter(function (t) { return t.grupo === g.chave; }).forEach(function (tema) {
      var b = el('button', temTrechos(tema) ? '' : 'vazio'); b.type = 'button'; b.setAttribute('data-tema', tema.chave); b.style.setProperty('--cor-caderno', tema.cor);
      b.setAttribute('aria-label', tema.titulo + (temTrechos(tema) ? '' : ' (em preparo)')); b.title = temTrechos(tema) ? tema.titulo : tema.titulo + ' · em preparo';
      b.appendChild(icone(tema.icone)); b.appendChild(el('span', 'nome', tema.titulo)); grupo.appendChild(b);
    });
    pontos.appendChild(grupo);
  });
  pontos.addEventListener('click', function (ev) { var b = ev.target.closest('button'); if (b) { ir(b.getAttribute('data-tema')); } });

  /* ---------- um trecho ---------- */
  function pontoIa(buscado) { var b = el('button', 'ponto ia'); b.type = 'button'; b.setAttribute('data-buscado', buscado); b.setAttribute('aria-label', 'Buscado por IA em ' + dataExtenso(buscado) + ', não conferido por uma pessoa. Entenda.'); return b; }
  function trechoHtml(t, lado) {
    var art = el('article', 'trecho lado-' + lado); art.setAttribute('data-id', t.id); art.setAttribute('data-candidato', t.candidato); art.setAttribute('data-tags', t.tags.join(' '));
    var et = el('div', 'etiqueta');
    if (!t.conferido) { et.appendChild(pontoIa(t.buscado)); }
    et.appendChild(el('span', 'quem-curto'));
    et.appendChild(el('span', 'tipo', t.tipo.charAt(0).toLowerCase() + t.tipo.slice(1)));
    art.appendChild(et);
    var af = el('p', 'afirmacao'); af.setAttribute('data-modelo', t.afirmacao); art.appendChild(af);
    /* contexto, fonte e selo ficam atrás de «Fonte: veículo» */
    var veiculos = t.fontes.map(function (f) { return f.veiculo; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ');
    var mais = el('button', 'acao leve mais'); mais.type = 'button'; mais.setAttribute('aria-expanded', 'false'); mais.setAttribute('aria-controls', 'det-' + t.id);
    mais.appendChild(texto('Fonte: ' + veiculos)); mais.appendChild(el('span', 'seta baixo'));
    art.appendChild(mais);
    var det = el('div', 'detalhes'); det.id = 'det-' + t.id; det.hidden = true;
    det.appendChild(el('p', 'contexto', t.contexto));
    var fonte = el('div', 'fonte');
    t.fontes.forEach(function (f, i) {
      var a = el('a'); a.href = f.url; a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('data-modelo', f.titulo); if (f.anonimo) { a.setAttribute('data-anonimo', f.anonimo); }
      var s = el('span'); s.appendChild(texto(i === 0 ? 'Fonte: ' : 'e ')); s.appendChild(a); s.appendChild(texto(' · ' + f.veiculo)); fonte.appendChild(s);
    });
    fonte.appendChild(el('span', '', 'acessado em ' + dataExtenso(t.buscado)));
    det.appendChild(fonte);
    var selo = el('div', 'selo' + (t.conferido ? '' : ' ia'));
    if (t.conferido) { selo.appendChild(el('span', 'texto', 'Conferido na fonte por ' + t.conferido.por + ' em ' + dataExtenso(t.conferido.em))); }
    else { selo.appendChild(el('span', 'ponto ia')); selo.appendChild(el('span', 'texto', 'Buscado por IA em ' + dataExtenso(t.buscado) + ' · não conferido por uma pessoa')); }
    det.appendChild(selo);
    art.appendChild(det);
    return art;
  }

  /* ---------- os contadores (só nos cadernos que os têm), dentro da régua presa ---------- */
  function contadorHtml(tema, c, cont, n) {
    var b = el('button', 'conta' + (n === 0 ? ' zero' : '')); b.type = 'button'; b.setAttribute('aria-pressed', filtros[tema.chave] === cont.tag ? 'true' : 'false');
    b.setAttribute('data-tema', tema.chave); b.setAttribute('data-tag', cont.tag); b.setAttribute('data-candidato', c);
    b.appendChild(icone(cont.icone)); b.appendChild(el('b', '', String(n))); b.appendChild(texto(' ' + cont.nome[n === 1 ? 0 : 1]));
    var dica = el('span', 'dica', cont.dica + ' Toque para ver só esses trechos.'); dica.setAttribute('role', 'tooltip'); dica.id = 'dica-' + tema.chave + '-' + cont.tag + '-' + c; b.setAttribute('aria-describedby', dica.id); b.appendChild(dica);
    return b;
  }
  function montarResumo(tema, res) {
    res.textContent = '';
    [esquerda, direita].forEach(function (c, i) {
      var lado = el('div', 'resumo-lado lado-' + (i === 0 ? 'a' : 'b')); lado.setAttribute('data-candidato', c);
      var lista = trechosDe(c, tema.chave);
      tema.contadores.forEach(function (cont) { lado.appendChild(contadorHtml(tema, c, cont, lista.filter(function (t) { return t.tags.indexOf(cont.tag) >= 0; }).length)); });
      res.appendChild(lado);
    });
  }
  function resumoTexto(tema, c) {
    var lista = trechosDe(c, tema.chave);
    var partes = tema.contadores.map(function (cont) { var n = lista.filter(function (t) { return t.tags.indexOf(cont.tag) >= 0; }).length; return n ? n + ' ' + cont.nome[n === 1 ? 0 : 1] : null; }).filter(Boolean);
    return nomeCurto(c) + ': ' + lista.length + ' marcos — ' + partes.join(', ') + '.';
  }
  function reguaPresaHtml(tema) {
    var rp = el('div', 'regua-presa'); rp.id = 'regua-presa-' + tema.chave;
    rp.appendChild(el('span', 'regua-rotulo', 'Régua · filtros do caderno'));
    var fb = el('button', 'regua-filtro'); fb.type = 'button'; fb.setAttribute('data-tema', tema.chave); fb.setAttribute('aria-expanded', 'false'); fb.setAttribute('aria-controls', 'miolo-' + tema.chave); fb.appendChild(texto('Filtrar')); fb.appendChild(el('span', 'seta baixo'));
    rp.appendChild(fb);
    var miolo = el('div', 'regua-miolo'); miolo.id = 'miolo-' + tema.chave; miolo.hidden = true;
    [esquerda, direita].forEach(function (c) { var s = el('span', 'resumo-texto'); s.setAttribute('data-candidato', c); miolo.appendChild(s); });
    var res = el('div', 'resumo'); res.id = 'resumo-' + tema.chave; miolo.appendChild(res); montarResumo(tema, res);
    rp.appendChild(miolo);
    return rp;
  }

  /* ---------- a régua do par: atravessa as duas páginas e carrega a escolha «¿qual pesa mais para você?» ---------- */
  function reguaParHtml(par) {
    var rp = el('div', 'regua-par'); rp.setAttribute('data-par', par.id);
    if (!par.completo) { rp.appendChild(el('span', 'regua-par-vazia', 'Sem par para comparar aqui.')); return rp; }
    var fs = el('fieldset', 'escolha'); fs.appendChild(el('legend', 'pergunta', '¿Qual pesa mais para você?'));
    var opcoes = [[esquerda, 'lado-esq', 'quem'], ['igual', 'opcao-igual', 'Igual'], [direita, 'lado-dir', 'quem'], ['nenhuma', 'opcao-nenhuma', 'Nenhuma']];
    opcoes.forEach(function (o) {
      var lab = el('label', o[1] + (o[0] === 'igual' || o[0] === 'nenhuma' ? ' neutra' : '')); var inp = el('input'); inp.type = 'radio'; inp.name = 'p-' + par.id; inp.value = o[0]; inp.id = 'p-' + par.id + '-' + o[0];
      inp.checked = marcas[par.id] === o[0];
      lab.appendChild(inp); lab.appendChild(el('span', 'caixa'));
      if (o[2] === 'quem') { var q = el('span', 'quem-curto'); q.setAttribute('data-candidato', o[0]); lab.appendChild(q); } else { lab.appendChild(texto(o[2])); }
      fs.appendChild(lab);
    });
    rp.appendChild(fs);
    return rp;
  }

  /* ---------- os cadernos ---------- */
  function proximoCom(i) { for (var k = i + 1; k < TEMAS.length; k++) { if (temTrechos(TEMAS[k])) { return TEMAS[k]; } } return null; }
  function anteriorCom(i) { for (var k = i - 1; k >= 0; k--) { if (temTrechos(TEMAS[k])) { return TEMAS[k]; } } return null; }
  TEMAS.forEach(function (tema, i) {
    var sec = el('section', 'caderno' + (temTrechos(tema) ? '' : ' sem-trechos')); sec.setAttribute('data-tema', tema.chave); sec.setAttribute('aria-labelledby', 'caderno-' + tema.chave); sec.style.setProperty('--cor-caderno', tema.cor);
    /* a capa fechada e a folha que vira: só o gesto do documento — tecido, dourado, o sinal da marca */
    var capa = el('div', 'capa-caderno'); capa.setAttribute('aria-hidden', 'true');
    var frente = el('div', 'face frente');
    frente.appendChild(el('div', 'sinal-capa', '¿?')); frente.appendChild(el('div', 'filete')); frente.appendChild(el('div', 'titulo-capa', 'Caderno · ' + grupoDe(tema.grupo).titulo)); frente.appendChild(el('div', 'nome-capa', tema.titulo)); frente.appendChild(el('div', 'filete'));
    var verso = el('div', 'face verso'); verso.appendChild(el('div', 'sinal-capa', '¿?'));
    capa.appendChild(frente); capa.appendChild(verso); sec.appendChild(capa);
    /* a contracapa: página por fora; por dentro, o tecido com o lema — ou, ao voltar, a capa com o nome */
    var contra = el('div', 'contracapa'); contra.setAttribute('aria-hidden', 'true');
    contra.appendChild(el('div', 'face frente'));
    var lema = el('div', 'face verso lema'); lema.appendChild(el('div', 'filete')); lema.appendChild(el('div', 'lema-capa', 'Em progresso')); lema.appendChild(el('div', 'filete'));
    var nome = el('div', 'face verso nome'); nome.appendChild(el('div', 'sinal-capa', '¿?')); nome.appendChild(el('div', 'filete')); nome.appendChild(el('div', 'titulo-capa', 'Caderno · ' + grupoDe(tema.grupo).titulo)); nome.appendChild(el('div', 'nome-capa', tema.titulo)); nome.appendChild(el('div', 'filete'));
    contra.appendChild(lema); contra.appendChild(nome); sec.appendChild(contra);
    /* a frase de abertura, ao lado do livro fechado; nas transições vira o molde do caderno vizinho */
    var abertura = el('aside', 'frase-abertura'); abertura.setAttribute('aria-label', 'Antes de abrir');
    var frase = el('p', 'frase'); frase.appendChild(texto('Analise cada trecho com atenção e confira tudo o que não tiver certeza: '));
    frase.appendChild(el('b', '', 'a fonte está a um toque, em cada um.'));
    var abrirBotao = el('button', 'acao cheia abrir-livro'); abrirBotao.type = 'button'; abrirBotao.appendChild(texto('Abrir o caderno')); abrirBotao.appendChild(el('span', 'seta'));
    var pequeno = el('small'); pequeno.appendChild(abrirBotao); frase.appendChild(pequeno); abertura.appendChild(frase);
    var moldeLema = el('div', 'molde lema'); moldeLema.appendChild(el('div', 'filete')); moldeLema.appendChild(el('div', 'lema-capa', 'Em progresso')); moldeLema.appendChild(el('div', 'filete'));
    var moldeNome = el('div', 'molde nome'); moldeNome.appendChild(el('div', 'sinal-capa', '¿?')); moldeNome.appendChild(el('div', 'filete')); moldeNome.appendChild(el('div', 'titulo-capa', '')); moldeNome.appendChild(el('div', 'nome-capa', '')); moldeNome.appendChild(el('div', 'filete'));
    abertura.appendChild(moldeLema); abertura.appendChild(moldeNome); sec.appendChild(abertura);
    var folha = el('div', 'folha-virando'); folha.setAttribute('aria-hidden', 'true'); sec.appendChild(folha);
    var cab = el('header', 'caderno-cabeca');
    var h3 = el('h3'); h3.id = 'caderno-' + tema.chave; h3.appendChild(icone(tema.icone)); h3.appendChild(texto(tema.titulo)); h3.appendChild(el('small', '', grupoDe(tema.grupo).titulo)); cab.appendChild(h3);
    var lados = el('div', 'lados');
    [esquerda, direita].forEach(function (c, k) {
      var ln = el('div', 'lado-nome lado-' + (k === 0 ? 'a' : 'b')); ln.setAttribute('data-candidato', c);
      ln.appendChild(retrato(c, false)); ln.appendChild(el('span', 'quem-cabeca')); lados.appendChild(ln);
    });
    cab.appendChild(lados);
    if (temTrechos(tema) && trechosDe(null, tema.chave).some(function (t) { return !t.conferido; })) {
      var ia = el('button', 'caderno-ia'); ia.type = 'button'; ia.setAttribute('data-buscado', trechosDe(null, tema.chave)[0].buscado); ia.appendChild(el('span', 'ponto ia')); ia.appendChild(texto('Trechos buscados por IA, sem conferência humana')); cab.appendChild(ia);
    }
    sec.appendChild(cab);
    if (tema.nota) { sec.appendChild(el('p', 'caderno-nota', tema.nota)); }
    if (!tema.plano && tema.contadores.length && temTrechos(tema)) { sec.appendChild(reguaPresaHtml(tema)); }
    if (temTrechos(tema)) {
      var pares = el('div', 'pares');
      paresDe(tema.chave).forEach(function (p) {
        var par = el('div', 'par'); par.setAttribute('data-par', p.id);
        par.appendChild(p.a ? trechoHtml(p.a, 'a') : el('p', 'vazio lado-a', 'Sem trecho equivalente ainda.'));
        par.appendChild(p.b ? trechoHtml(p.b, 'b') : el('p', 'vazio lado-b', 'Sem trecho equivalente ainda.'));
        par.appendChild(reguaParHtml(p));
        pares.appendChild(par);
      });
      sec.appendChild(pares);
    } else {
      sec.appendChild(el('p', 'em-branco', 'Este caderno ainda não tem trechos.'));
    }
    var pe = el('div', 'caderno-pe');
    var ant = anteriorCom(i), prox = proximoCom(i);
    if (ant) { var ab = el('button', 'acao leve anterior'); ab.type = 'button'; ab.setAttribute('data-ir', ant.chave); ab.appendChild(el('span', 'seta volta')); ab.appendChild(texto(ant.titulo)); pe.appendChild(ab); }
    var pb = el('button', 'acao cheia proximo'); pb.type = 'button';
    if (prox) { pb.setAttribute('data-ir', prox.chave); pb.appendChild(texto('Próximo caderno: ' + prox.titulo)); }
    else { pb.setAttribute('data-ir', 'placar'); pb.appendChild(texto('Ver meu placar')); }
    pb.appendChild(el('span', 'seta')); pe.appendChild(pb); sec.appendChild(pe);
    comparador.appendChild(sec);
  });

  /* ---------- a vista: um caderno por vez (padrão), todos de uma vez, ou o placar ---------- */
  function topoDe(alvo) { return alvo.getBoundingClientRect().top + window.scrollY - envelope.offsetHeight - (parseFloat(getComputedStyle(envelope).top) || 0) - 10; }
  function rolarAte(alvo) { try { window.scrollTo({ top: Math.max(0, topoDe(alvo)), behavior: reduz ? 'auto' : 'smooth' }); } catch (e) { window.scrollTo(0, Math.max(0, topoDe(alvo))); } }
  function secaoDe(chave) { return comparador.querySelector('.caderno[data-tema="' + chave + '"]'); }
  function aplicarVista() {
    placarTela.hidden = !vendoPlacar; comparador.hidden = vendoPlacar;
    todos('.caderno', comparador).forEach(function (sec) {
      sec.hidden = modo === 'um' && sec.getAttribute('data-tema') !== atual; sec.querySelector('.caderno-pe').hidden = modo !== 'um';
      var fechado = modo === 'um' && !vendoPlacar && livroFechado && sec.getAttribute('data-tema') === atual;
      sec.classList.toggle('fechado', fechado); sec.classList.toggle('tras', fechado && livroTras);
      if (!fechado) { var ab = sec.querySelector('.frase-abertura'); ab.classList.remove('contracapa-anterior', 'capa-seguinte'); }
    });
    todos('button', pontos).forEach(function (b) { if (!vendoPlacar && b.getAttribute('data-tema') === atual) { b.setAttribute('aria-current', 'true'); } else { b.removeAttribute('aria-current'); } });
    progresso.textContent = '';
    var tema = temaDe(atual);
    if (vendoPlacar) { progresso.appendChild(el('b', '', 'Meu placar')); }
    else if (modo === 'um') {
      progresso.appendChild(el('b', '', tema.titulo));
      progresso.appendChild(texto(temTrechos(tema) ? ' · ' + (COM_TRECHOS.indexOf(tema) + 1) + ' de ' + COM_TRECHOS.length : ' · em preparo'));
    }
    else { progresso.appendChild(el('b', '', 'Todos os cadernos')); }
    $('modo').textContent = modo === 'um' ? 'Todos os cadernos de uma vez' : 'Um caderno por vez';
    esconderRegua(); fecharMenu();
  }
  var animando = null;
  function limparAnimacao(sec) { sec.classList.remove('abrindo', 'abrindo-livro', 'fechando', 'tras', 'virando'); var c = sec.querySelector('.contracapa'); c.style.top = ''; c.style.height = ''; }
  function focarTitulo(sec) { var h3 = sec.querySelector('h3'); h3.setAttribute('tabindex', '-1'); h3.focus({ preventScroll: true }); }
  /* a folha que fecha fica onde a pessoa está olhando: o topo dela é a janela, não o topo do caderno */
  function posicionarNaJanela(sec) {
    var c = sec.querySelector('.contracapa'); var topoSec = sec.getBoundingClientRect().top + window.scrollY;
    var inicio = Math.max(0, window.scrollY + envelope.offsetHeight - topoSec); var alt = Math.min(sec.offsetHeight - inicio, window.innerHeight - envelope.offsetHeight);
    c.style.top = inicio + 'px'; c.style.height = Math.max(240, alt) + 'px';
  }
  /* abrir o livro: a capa (ou, ao voltar, a contracapa) vira e some; as folhas entram */
  function abrirLivro(sec, tras) {
    livroFechado = false; livroTras = false; sec.classList.remove('fechado'); sec.classList.toggle('tras', !!tras);
    if (reduz) { limparAnimacao(sec); aplicarVista(); focarTitulo(sec); return; }
    sec.classList.remove('abrindo-livro'); void sec.offsetWidth; sec.classList.add('abrindo-livro');
    clearTimeout(animando); animando = setTimeout(function () { limparAnimacao(sec); aplicarVista(); focarTitulo(sec); }, 1050);
  }
  function mostrar(chave, comCapa) {
    atual = chave; vendoPlacar = false; livroFechado = false; livroTras = false; aplicarVista();
    var sec = secaoDe(chave); if (!sec) { return; }
    rolarAte(sec); focarTitulo(sec);
    if (comCapa && !reduz) { abrirLivro(sec, false); }
  }
  /* mostrar fechado: o livro do caderno à direita e, à esquerda, a frase — ou a contracapa do caderno que acabou de fechar;
     ao voltar, a contracapa do caderno à esquerda e, à direita, a capa do que acabou de fechar */
  function mostrarFechado(chave, tras, vizinho) {
    atual = chave; vendoPlacar = false; livroFechado = true; livroTras = !!tras; aplicarVista();
    var sec = secaoDe(chave), ab = sec.querySelector('.frase-abertura');
    ab.classList.remove('contracapa-anterior', 'capa-seguinte');
    if (vizinho) {
      ab.classList.add(tras ? 'capa-seguinte' : 'contracapa-anterior');
      todos('.molde', ab).forEach(function (m) { m.style.setProperty('--cor-caderno', vizinho.cor); });
      ab.querySelector('.molde.nome .titulo-capa').textContent = 'Caderno · ' + grupoDe(vizinho.grupo).titulo;
      ab.querySelector('.molde.nome .nome-capa').textContent = vizinho.titulo;
    }
    rolarAte(sec);
  }
  /* trocar de caderno: o atual fecha (o lado direito vira para a esquerda, mostrando a contracapa com o lema; ao voltar, o lado
     esquerdo vira para a direita, mostrando a capa com o nome), o vizinho aparece fechado por um instante e abre */
  function ir(chave, forcarCapa) {
    if (transicao) { return; }
    var deOnde = (!vendoPlacar && modo === 'um') ? secaoDe(atual) : null, paraOnde = secaoDe(chave);
    if (!paraOnde) { return; }
    if (chave === atual && !vendoPlacar) {
      if (livroFechado) { abrirLivro(deOnde, livroTras); } else { mostrar(chave, !!forcarCapa && !reduz); }
      return;
    }
    if (!deOnde || reduz || modo !== 'um') { mostrar(chave, false); return; }
    var tras = TEMAS.indexOf(temaDe(chave)) < TEMAS.indexOf(temaDe(atual)), deTema = temaDe(atual);
    if (livroFechado) { mostrarFechado(chave, false, null); transicao = setTimeout(function () { transicao = null; abrirLivro(paraOnde, false); }, 120); return; }
    posicionarNaJanela(deOnde); deOnde.classList.toggle('tras', tras); deOnde.classList.add('fechando');
    transicao = setTimeout(function () {
      limparAnimacao(deOnde); mostrarFechado(chave, tras, deTema);
      transicao = setTimeout(function () { transicao = null; abrirLivro(paraOnde, tras); }, 950);
    }, 820);
  }
  comparador.addEventListener('click', function (ev) {
    var capa = ev.target.closest('.caderno.fechado > .capa-caderno, .caderno.fechado .abrir-livro');
    if (capa) { var sec = capa.closest('.caderno'); if (!transicao) { abrirLivro(sec, livroTras); } }
  });
  function mostrarPlacar() {
    vendoPlacar = true; aplicarVista(); placar(); rolarAte(placarTela);
    var h2 = $('placar-titulo'); h2.setAttribute('tabindex', '-1'); h2.focus({ preventScroll: true });
    try { document.dispatchEvent(new CustomEvent('mmv:placar-aberto')); } catch (e) {}
  }
  comparador.addEventListener('click', function (ev) { var b = ev.target.closest('[data-ir]'); if (!b) { return; } var alvo = b.getAttribute('data-ir'); if (alvo === 'placar') { mostrarPlacar(); } else { ir(alvo); } });
  $('voltar').addEventListener('click', function () { vendoPlacar = false; aplicarVista(); var sec = secaoDe(atual); if (sec) { rolarAte(sec); } });
  $('ir-placar').addEventListener('click', mostrarPlacar);
  $('modo').addEventListener('click', function () { modo = modo === 'um' ? 'todos' : 'um'; vendoPlacar = false; aplicarVista(); var sec = secaoDe(atual); if (sec) { rolarAte(sec); } });
  /* o convite da capa («Começar pela …») abre o primeiro caderno com a capa */
  todos('a[href="#envelope"]').forEach(function (a) { a.addEventListener('click', function (ev) { ev.preventDefault(); ir(COM_TRECHOS[0].chave, true); }); });

  /* ---------- o menu «⋯» ---------- */
  var cardapioFundo = $('cardapio-fundo');
  function fecharMenu() { menu.hidden = true; cardapioFundo.hidden = true; menuBotao.setAttribute('aria-expanded', 'false'); }
  function abrirMenu() { menu.hidden = false; cardapioFundo.hidden = false; menuBotao.setAttribute('aria-expanded', 'true'); var primeiro = menu.querySelector('.cardapio-cabeca ~ button:not([hidden])') || $('menu-fechar'); primeiro.focus(); }
  menuBotao.addEventListener('click', function () { if (menu.hidden) { abrirMenu(); } else { fecharMenu(); menuBotao.focus(); } });
  $('menu-fechar').addEventListener('click', function () { fecharMenu(); menuBotao.focus(); });
  cardapioFundo.addEventListener('click', function () { fecharMenu(); menuBotao.focus(); });
  document.addEventListener('click', function (ev) { if (!menu.hidden && !menu.contains(ev.target) && !menuBotao.contains(ev.target) && ev.target !== cardapioFundo) { fecharMenu(); } });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { if (!menu.hidden) { fecharMenu(); menuBotao.focus(); } if (!dicaIa.hidden) { fecharDicaIa(); } } });
  $('luz-menu').addEventListener('click', function () { try { document.dispatchEvent(new CustomEvent('mmv:luz-alternar')); } catch (e) {} fecharMenu(); });
  /* «como funciona»: o texto que antes era o aviso */
  $('como').addEventListener('click', function () { var aberto = this.getAttribute('aria-expanded') === 'true'; this.setAttribute('aria-expanded', aberto ? 'false' : 'true'); $('explica').hidden = aberto; fecharMenu(); if (!aberto) { $('explica-fechar').focus(); } });
  $('explica-fechar').addEventListener('click', function () { $('explica').hidden = true; $('como').setAttribute('aria-expanded', 'false'); menuBotao.focus(); });
  /* o material do envelope, por teste: kraft ou pedra */
  function escreverEnvelope() { var pedra = document.documentElement.getAttribute('data-envelope') === 'pedra'; var b = $('envelope-modo'); b.textContent = pedra ? 'Envelope em kraft' : 'Envelope em pedra'; b.appendChild(el('small', '', 'teste')); }
  $('envelope-modo').addEventListener('click', function () {
    var pedra = document.documentElement.getAttribute('data-envelope') === 'pedra';
    if (pedra) { document.documentElement.removeAttribute('data-envelope'); } else { document.documentElement.setAttribute('data-envelope', 'pedra'); }
    try { localStorage.setItem(CHAVE_ENVELOPE, pedra ? 'kraft' : 'pedra'); } catch (e) {}
    escreverEnvelope(); fecharMenu();
  });
  escreverEnvelope();

  /* ---------- a dica do indicador de IA ---------- */
  var quemAbriuDica = null;
  function abrirDicaIa(b) {
    var quando = b.getAttribute('data-buscado');
    $('dica-ia-quando').textContent = 'Buscado por IA' + (quando ? ' em ' + dataExtenso(quando) : '') + ', não conferido por uma pessoa.';
    dicaIa.hidden = false; quemAbriuDica = b; $('dica-ia-fechar').focus();
  }
  function fecharDicaIa() { dicaIa.hidden = true; if (quemAbriuDica) { quemAbriuDica.focus(); } quemAbriuDica = null; }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('button.ponto.ia, .caderno-ia');
    if (b) { ev.preventDefault(); if (!dicaIa.hidden && quemAbriuDica === b) { fecharDicaIa(); } else { abrirDicaIa(b); } return; }
    if (!dicaIa.hidden && !dicaIa.contains(ev.target)) { fecharDicaIa(); }
  });
  $('dica-ia-fechar').addEventListener('click', fecharDicaIa);

  /* ---------- nomes: anônimos até a pessoa pedir ---------- */
  function escrever() {
    todos('.trecho').forEach(function (art) {
      var c = art.getAttribute('data-candidato');
      art.querySelector('.quem-curto').textContent = nomeCurto(c);
      var af = art.querySelector('.afirmacao'); af.textContent = preencher(af.getAttribute('data-modelo'), c);
      todos('.fonte a', art).forEach(function (a) { a.textContent = (!revelado && a.getAttribute('data-anonimo')) ? a.getAttribute('data-anonimo') : preencher(a.getAttribute('data-modelo'), c); });
    });
    todos('.lado-nome').forEach(function (ln) { ln.querySelector('.quem-cabeca').textContent = nomeCurto(ln.getAttribute('data-candidato')); });
    todos('.escolha .quem-curto').forEach(function (q) { q.textContent = nomeCurto(q.getAttribute('data-candidato')); });
    todos('.resumo-texto').forEach(function (s) { s.textContent = resumoTexto(temaDe(s.closest('.caderno').getAttribute('data-tema')), s.getAttribute('data-candidato')); });
    todos('.resumo-lado').forEach(function (l) { l.setAttribute('aria-label', 'Resumo numérico de ' + nomeCurto(l.getAttribute('data-candidato'))); });
    ['revelar', 'revelar-fim'].forEach(function (id) { var b = $(id); b.textContent = revelado ? 'Ocultar de novo' : 'Ver quem é quem'; if (id === 'revelar' && !revelado) { b.appendChild(el('small', '', 'nomes e fotos')); } b.setAttribute('aria-pressed', revelado ? 'true' : 'false'); });
    placar(); pintarRetratos();
  }

  /* ---------- o placar da pessoa: só na tela «Meu placar»; conta pares ---------- */
  function contar(tema) {
    var ps = paresMarcaveis(tema), n = { total: ps.length, igual: 0, nenhuma: 0, sem: 0 }; n[esquerda] = 0; n[direita] = 0;
    ps.forEach(function (p) { var m = marcas[p.id]; if (m === esquerda || m === direita || m === 'igual' || m === 'nenhuma') { n[m]++; } else { n.sem++; } });
    n.marcados = n.total - n.sem; return n;
  }
  function placar() {
    var caixa = $('placar'); caixa.textContent = '';
    var ordem = invertido ? [direita, esquerda] : [esquerda, direita];
    var n = contar();
    ordem.forEach(function (c) {
      var lado = el('div', 'placar-lado');
      lado.appendChild(retrato(c, true));
      lado.appendChild(el('h3', '', nomeCurto(c)));
      var sd = el('div', 'saldo'); sd.appendChild(texto('pesou mais em ')); sd.appendChild(el('b', '', String(n[c]))); sd.appendChild(texto(' de ' + n.total + ' pares')); lado.appendChild(sd);
      var barra = el('div', 'barra-placar'); barra.setAttribute('role', 'img'); barra.setAttribute('aria-label', nomeCurto(c) + ' pesou mais em ' + n[c] + ' de ' + n.total + ' pares');
      var i = el('i', 'favor'); i.style.width = (n.total ? 100 * n[c] / n.total : 0).toFixed(1) + '%'; barra.appendChild(i);
      lado.appendChild(barra);
      caixa.appendChild(lado);
    });
    var meio = el('div', 'placar-meio');
    [['igual', n.igual], ['nenhuma', n.nenhuma], ['sem marca', n.sem]].forEach(function (p) { var s = el('span'); s.appendChild(el('b', '', String(p[1]))); s.appendChild(texto(' ' + p[0])); meio.appendChild(s); });
    caixa.appendChild(meio);
    var tabela = $('por-caderno'); tabela.textContent = '';
    var cab = el('tr'); cab.appendChild(el('th', '', 'Por caderno')); ordem.forEach(function (c) { cab.appendChild(el('th', 'num', nomeCurto(c))); }); cab.appendChild(el('th', 'num', 'Igual')); cab.appendChild(el('th', 'num', 'Nenhuma')); var thead = el('thead'); thead.appendChild(cab); tabela.appendChild(thead);
    var corpo = el('tbody');
    COM_TRECHOS.forEach(function (tema) {
      var nt = contar(tema.chave); var tr = el('tr'); var td = el('td'); td.style.setProperty('--cor-caderno', tema.cor); td.appendChild(icone(tema.icone)); td.appendChild(texto(tema.titulo)); tr.appendChild(td);
      ordem.forEach(function (c) { tr.appendChild(el('td', 'num', nt.marcados ? String(nt[c]) : '—')); });
      tr.appendChild(el('td', 'num', nt.marcados ? String(nt.igual) : '—')); tr.appendChild(el('td', 'num', nt.marcados ? String(nt.nenhuma) : '—'));
      corpo.appendChild(tr);
    });
    tabela.appendChild(corpo);
    var m = n.marcados, total = n.total;
    $('placar-nota').textContent = (m === 0 ? 'Você ainda não marcou nenhum par. ' : 'Você marcou ' + m + ' de ' + total + ' pares' + (total - m ? '; ' + (total - m) + ' sem marca' : '') + '. ') + 'Cada par é um trecho de cada candidatura, lado a lado; a pergunta é qual pesa mais para você.' + (SEM_TRECHOS.length ? ' Em preparo, sem trechos ainda: ' + SEM_TRECHOS.map(function (t) { return t.titulo; }).join(', ') + '.' : '');
    ['zerar', 'zerar-fim', 'ir-placar'].forEach(function (id) { $(id).hidden = m === 0; });
    $('ir-placar-nota').textContent = m + ' de ' + total + ' pares';
    todos('button', pontos).forEach(function (b) { b.classList.toggle('feito', completo(temaDe(b.getAttribute('data-tema')))); });
    pintarRetratos();
  }
  comparador.addEventListener('change', function (ev) {
    var alvo = ev.target; if (!alvo || !alvo.name || alvo.name.indexOf('p-') !== 0) { return; }
    var antes = totalMarcas(); marcas[alvo.name.slice(2)] = alvo.value; guardar(); placar();
    if (antes === 0) { try { document.dispatchEvent(new CustomEvent('mmv:primeira-marca')); } catch (e) {} }
  });

  /* ---------- confirmação antes do que desfaz ou expõe: apagar, revelar e abrir fonte às cegas ---------- */
  var confirma = $('confirma'), confirmaTexto = $('confirma-texto'), confirmaSim = $('confirma-sim'), aoConfirmar = null, quemPediu = null;
  function pedirConfirmacao(txt, rotuloSim, acao, origem) {
    confirmaTexto.textContent = txt; confirmaSim.textContent = rotuloSim; aoConfirmar = acao; quemPediu = origem;
    confirma.hidden = false; fecharMenu(); confirmaSim.focus();
  }
  function fecharConfirmacao() { confirma.hidden = true; aoConfirmar = null; if (quemPediu) { quemPediu.focus(); } quemPediu = null; }
  confirmaSim.addEventListener('click', function () { var f = aoConfirmar; fecharConfirmacao(); if (f) { f(); } });
  $('confirma-nao').addEventListener('click', fecharConfirmacao);
  confirma.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { fecharConfirmacao(); } });
  function zerar() { marcas = {}; guardar(); todos('.escolha input', comparador).forEach(function (i) { i.checked = false; }); placar(); }
  ['zerar', 'zerar-fim'].forEach(function (id) {
    $(id).addEventListener('click', function () {
      var n = totalMarcas();
      pedirConfirmacao(n === 1 ? 'Apagar a sua marcação? Ela não volta.' : 'Apagar as suas ' + n + ' marcações? Elas não voltam.', 'Sim, apagar', zerar, this);
    });
  });
  ['revelar', 'revelar-fim'].forEach(function (id) {
    $(id).addEventListener('click', function () {
      if (revelado) { revelado = false; escrever(); return; }
      pedirConfirmacao('Ver os nomes e as fotos? Depois disso, a comparação deixa de ser às cegas; dá para ocultar de novo.', 'Ver quem é quem', function () { revelado = true; escrever(); }, this);
    });
  });
  $('inverter').addEventListener('click', function () { invertido = !invertido; comparador.classList.toggle('invertido', invertido); escrever(); fecharMenu(); });
  /* a fonte, às cegas, entrega quem é quem: a barreira avisa antes de abrir */
  comparador.addEventListener('click', function (ev) {
    var a = ev.target.closest('.fonte a'); if (!a || revelado) { return; }
    ev.preventDefault(); var url = a.href;
    pedirConfirmacao('Abrir a fonte mostra de quem é este trecho, e a leitura deixa de ser às cegas. Dá para marcar o par primeiro e abrir depois.', 'Abrir mesmo assim', function () { window.open(url, '_blank', 'noopener'); }, a);
  });

  /* ---------- os contadores filtram os trechos do caderno; o mesmo filtro vale para os dois lados ---------- */
  function aplicarFiltro(chave) {
    var sec = secaoDe(chave), tag = filtros[chave] || null;
    todos('.conta', sec).forEach(function (b) { b.setAttribute('aria-pressed', tag && b.getAttribute('data-tag') === tag ? 'true' : 'false'); });
    todos('.par', sec).forEach(function (par) {
      var lista = todos('.trecho', par), algum = false;
      lista.forEach(function (t) { var entra = !tag || (' ' + t.getAttribute('data-tags') + ' ').indexOf(' ' + tag + ' ') >= 0; t.classList.toggle('fora', !entra); if (entra) { algum = true; } });
      par.hidden = !!tag && !algum;
    });
    esconderRegua();
  }
  comparador.addEventListener('click', function (ev) {
    var b = ev.target.closest('.conta'); if (!b) { return; }
    var chave = b.getAttribute('data-tema'), tag = b.getAttribute('data-tag');
    filtros[chave] = filtros[chave] === tag ? null : tag; aplicarFiltro(chave);
  });
  /* a alça «Filtrar» abre a régua presa do caderno (a flutuante só aponta para ela) */
  function alternarFiltro(chave, abrir) {
    var rp = $('regua-presa-' + chave); if (!rp) { return; }
    var fb = rp.querySelector('.regua-filtro'), miolo = rp.querySelector('.regua-miolo');
    var aberto = abrir === undefined ? miolo.hidden : abrir;
    miolo.hidden = !aberto; fb.setAttribute('aria-expanded', aberto ? 'true' : 'false'); filtroAberto[chave] = aberto;
    reguaFiltro.setAttribute('aria-expanded', aberto ? 'true' : 'false');
  }
  comparador.addEventListener('click', function (ev) {
    var b = ev.target.closest('.regua-presa .regua-filtro'); if (!b) { return; }
    alternarFiltro(b.getAttribute('data-tema'));
  });
  reguaFiltro.addEventListener('click', function (ev) {
    ev.stopPropagation(); var par = comparador.querySelector('.par.ativo'); if (!par) { return; }
    var chave = par.closest('.caderno').getAttribute('data-tema'); alternarFiltro(chave);
    var rp = $('regua-presa-' + chave); if (rp && filtroAberto[chave]) { rolarAte(rp); }
  });
  comparador.addEventListener('click', function (ev) {
    var b = ev.target.closest('.trecho .mais'); if (!b) { return; }
    var aberto = b.getAttribute('aria-expanded') === 'true'; b.setAttribute('aria-expanded', aberto ? 'false' : 'true');
    $(b.getAttribute('aria-controls')).hidden = aberto;
    var par = b.closest('.par'); if (par && par.classList.contains('ativo') && regua.classList.contains('visivel')) { mostrarRegua(par); }
  });

  /* ---------- a régua: régua paralela de prancheta, só no mouse e no teclado; no toque, fica o realce do par ---------- */
  function realcar(par) { todos('.par.ativo', comparador).forEach(function (p) { if (p !== par) { p.classList.remove('ativo'); } }); par.classList.add('ativo'); }
  function mostrarRegua(par) {
    if (transicao || comparador.querySelector('.abrindo-livro, .fechando')) { return; } /* a régua não entra enquanto o livro abre ou fecha */
    realcar(par);
    var r = par.getBoundingClientRect(), c = comparador.getBoundingClientRect();
    regua.style.top = (r.top - c.top - 6) + 'px'; regua.style.height = (r.height + 12) + 'px';
    regua.style.left = (-c.left) + 'px'; regua.style.width = document.documentElement.clientWidth + 'px';
    var chave = par.closest('.caderno').getAttribute('data-tema');
    reguaFiltro.hidden = !$('regua-presa-' + chave); reguaFiltro.setAttribute('aria-expanded', filtroAberto[chave] ? 'true' : 'false');
    reguaFiltro.style.right = (c.left + 14) + 'px';
    regua.classList.add('visivel');
  }
  function esconderRegua() { regua.classList.remove('visivel'); reguaFiltro.hidden = true; todos('.par.ativo', comparador).forEach(function (p) { p.classList.remove('ativo'); }); }
  comparador.addEventListener('pointerover', function (ev) { if (ev.pointerType === 'touch') { return; } if (regua.contains(ev.target)) { return; } var par = ev.target.closest('.par'); if (par) { mostrarRegua(par); } });
  comparador.addEventListener('pointerdown', function (ev) { if (ev.pointerType !== 'touch') { return; } var par = ev.target.closest('.par'); if (par) { regua.classList.remove('visivel'); reguaFiltro.hidden = true; realcar(par); } });
  comparador.addEventListener('pointerleave', function (ev) { if (ev.pointerType === 'touch') { return; } esconderRegua(); });
  /* o foco vindo de um toque (a linha marcada ganha foco) não abre a régua: só o teclado e o mouse abrem */
  var ultimoPonteiro = 'teclado';
  comparador.addEventListener('pointerdown', function (ev) { ultimoPonteiro = ev.pointerType || 'mouse'; }, true);
  document.addEventListener('keydown', function () { ultimoPonteiro = 'teclado'; }, true);
  comparador.addEventListener('focusin', function (ev) { var par = ev.target.closest('.par'); if (!par) { return; } if (ultimoPonteiro === 'touch') { regua.classList.remove('visivel'); realcar(par); } else { mostrarRegua(par); } });
  comparador.addEventListener('focusout', function (ev) { if (!ev.relatedTarget || (!ev.relatedTarget.closest('.par') && !regua.contains(ev.relatedTarget))) { esconderRegua(); } });
  window.addEventListener('resize', function () { var ativo = comparador.querySelector('.par.ativo'); if (ativo && regua.classList.contains('visivel')) { mostrarRegua(ativo); } });

  escrever(); aplicarVista();
})();
