// Importando os hooks useState e useEffect
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "@/components/HomeContent/HomeContent.module.css";
import Loading from "../Loading";
// Importando a biblioteca Axios
import axios from "axios";
import { cidades, categorias } from "@/data/lugares";
import { destinosExcluidos } from "@/data/destinosExcluidos";

const API_URL = "https://pt.wikipedia.org/w/api.php";
const cache = new Map();

function normalizar(texto) {
  return (texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function identificarCategoria(titulo, descricao = "") {
  const texto = normalizar(`${titulo} ${descricao}`);
  if (/praia|balneario|enseada/.test(texto)) return "Praias";
  if (/parque|ilha|lagoa|cachoeira|duna|montanha|morro|trilha|reserva|natureza/.test(texto)) return "Natureza";
  return "Passeios";
}

// Remove páginas que não representam atrações e imagens genéricas ou sem relação aparente.
const termosNaoTuristicos = /\b(futebol|jogador|politico|eleicao|partido|album|cantor|banda|filme|serie de televisao|telenovela|episodio|universidade|escola|hospital|empresa|prefeito|deputado|municipio|distrito administrativo|biografia|temporada|campeonato|competicao|lista de|desambiguacao)\b/;
const termosTuristicos = /\b(praia|ilha|parque|cachoeira|catarata|lagoa|lago|rio|morro|montanha|serra|trilha|duna|reserva|mirante|jardim|museu|teatro|igreja|catedral|forte|fortaleza|palacio|monumento|centro historico|bairro historico|ponte|farol|gruta|caverna|aquario|zoologico|atracao|turistico|turistica|patrimonio|praca|mercado|teleferico|bondinho|estacao|santuario|templo|arquipelago|pico|pedra|passeio|orla|enseada|balneario|parque nacional|parque estadual)\b/;
const imagensGenericas = /(?:no[_ -]?image|placeholder|default|question[_ -]?mark|wiki[_ -]?logo|wikimedia[_ -]?logo|commons[_ -]?logo|coat[_ -]?of[_ -]?arms|brasao|bandeira|flag[_ -]?of|mapa[_ -]?de|location[_ -]?map|locator[_ -]?map|map[_ -]?of|icon|pictogram|symbol|escudo)/i;

function destinoComImagemRelevante(pagina) {
  const imagem = pagina.thumbnail?.source;
  if (!imagem || !/^https:\/\//i.test(imagem)) return false;
  let arquivo;
  try {
    arquivo = decodeURIComponent(new URL(imagem).pathname.split("/").pop() || "");
  } catch {
    return false;
  }
  if (imagensGenericas.test(arquivo)) return false;

  const titulo = normalizar(pagina.title);
  const descricao = normalizar(pagina.description || "");
  const texto = `${titulo} ${descricao}`;
  if (termosNaoTuristicos.test(texto)) return false;
  // Para evitar cards aleatórios, só aceitamos artigos com indícios de atração turística.
  if (!termosTuristicos.test(texto)) return false;
  return true;
}

// A própria API devolve a lista de artigos: nenhum destino é cadastrado manualmente.
async function consultarCidade(cidade) {
  const pesquisas = [
    `praias em ${cidade.nome}`,
    `pontos turísticos de ${cidade.nome}`,
    `parques e atrações de ${cidade.nome}`,
  ];

  const respostas = await Promise.all(pesquisas.map((pesquisa) =>
    axios.get(API_URL, { params: {
      action: "query", format: "json", origin: "*", generator: "search",
      gsrsearch: pesquisa, gsrnamespace: 0, gsrlimit: 20,
      prop: "pageimages|description", piprop: "thumbnail", pithumbsize: 500,
    } })
  ));

  const encontrados = new Map();
  for (const resposta of respostas) {
    const paginas = Object.values(resposta.data?.query?.pages || {});
    for (const pagina of paginas) {
      if (!pagina.pageid || pagina.missing !== undefined || !destinoComImagemRelevante(pagina)) continue;
      const titulo = normalizar(pagina.title);
      if (titulo === normalizar(cidade.nome) || titulo === "brasil" ||
          titulo.startsWith("lista de") || titulo.startsWith("turismo em") ||
          titulo.startsWith("categoria:")) continue;
      if (!encontrados.has(pagina.pageid)) {
        encontrados.set(pagina.pageid, {
          id: pagina.pageid,
          nome: pagina.title,
          descricao: pagina.description || "",
          imagem: pagina.thumbnail?.source || "",
          categoria: identificarCategoria(pagina.title, pagina.description),
        });
      }
    }
  }
  return [...encontrados.values()];
}

function buscarCidade(cidade) {
  if (!cache.has(cidade.slug)) {
    cache.set(cidade.slug, consultarCidade(cidade).catch((erro) => {
      cache.delete(cidade.slug);
      throw erro;
    }));
  }
  return cache.get(cidade.slug);
}

const HomeContent = () => {
  const [lugares, setLugares] = useState([]);
  // Estado para controlar o gif de carregamento
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [slugCidade, setSlugCidade] = useState(cidades[0].slug);
  const [categoria, setCategoria] = useState("Todos");
  const [pesquisa, setPesquisa] = useState("");

  const cidadeAtual = cidades.find((item) => item.slug === slugCidade);

  // useEffect
  // Aqui é feita a busca dos lugares da cidade selecionada na API
  useEffect(() => {
    let ativo = true;

    const fetchLugares = async () => {
      setLoading(true);
      setErro("");
      setLugares([]);

      try {
        const resultados = await buscarCidade(cidadeAtual);
        if (!ativo) return;
        setLugares(resultados);
        if (resultados.length === 0) {
          setErro("Nenhum destino com imagem adequada foi encontrado para esta cidade.");
        }
      } catch (erro) {
        if (ativo) setErro("Não foi possível consultar a Wikipédia. Tente novamente mais tarde.");
      } finally {
        if (ativo) setLoading(false);
      }
    };

    // Invocando a função dentro do useEffect
    fetchLugares();

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugCidade]);

  const termo = normalizar(pesquisa);

  const lugaresFiltrados = lugares.filter(
    (lugar) =>
      (categoria === "Todos" || lugar.categoria === categoria) &&
      normalizar(lugar.nome).includes(termo) &&
      !destinosExcluidos.some((nome) => normalizar(nome) === normalizar(lugar.nome))
  );

  return (
    <>
      <div className={styles.homeContent} id="destinos">
        <div className={styles.bannerDestinos}>
          <div className={styles.bannerOverlay}>
            <div className={styles.bannerConteudo}>
              <span className={styles.bannerEtiqueta}>EXPLORE O BRASIL</span>
              <h1>Descubra lugares incríveis</h1>
              <p>Explore novos destinos, conheça paisagens inesquecíveis e planeje sua próxima aventura.</p>
              <a href="#catalogo" className={styles.bannerBotao}>Explorar destinos</a>
            </div>
          </div>
        </div>
        <div className={styles.catalogo} id="catalogo">
        {/* TITLE */}
        <div className={styles.title}>
          <h1>Encontre seu próximo destino</h1>
          <p>
            Praias, passeios e lugares incríveis para conhecer em diferentes
            cidades brasileiras.
          </p>
        </div>

        {/* FILTROS */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            {cidades.map((item) => (
              <button
                key={item.slug}
                className={slugCidade === item.slug ? styles.active : ""}
                onClick={() => {
                  setCategoria("Todos");
                  setPesquisa("");
                  setSlugCidade(item.slug);
                }}
              >
                {item.nome}
              </button>
            ))}
          </div>

          <div className={styles.filterGroup}>
            {categorias.map((item) => (
              <button
                key={item}
                className={categoria === item ? styles.active : ""}
                onClick={() => setCategoria(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={pesquisa}
            onChange={(event) => setPesquisa(event.target.value)}
            placeholder="Pesquisar destino..."
          />
        </div>

        <p className={styles.count}>
          {cidadeAtual.nome}: {lugaresFiltrados.length} destinos
        </p>

        {erro && <p className={styles.error}>{erro}</p>}

        {/* Mostra o gif de carregamento enquanto não chegam os primeiros itens */}
        <Loading loading={loading} />

        {/* LISTA DE DESTINOS (cards clicáveis) */}
        <div className={styles.cards}>
          {lugaresFiltrados.map((lugar) => (
            <Link
              key={lugar.id}
              href={`/destino/${lugar.id}`}
              className={styles.card}
            >
              <div className={styles.cardImg}>
                <img src={lugar.imagem} alt={lugar.nome} loading="lazy" />
              </div>
              <div className={styles.cardInfo}>
                <h3>{lugar.nome}</h3>
                {lugar.descricao && <p>{lugar.descricao}</p>}
                <span className={styles.tag}>{lugar.categoria}</span>
                <span className={styles.more}>Ver detalhes →</span>
              </div>
            </Link>
          ))}
        </div>

        {!loading && !erro && lugaresFiltrados.length === 0 && (
          <p className={styles.empty}>
            Nenhum destino com imagem encontrado. Tente outra categoria ou pesquisa.
          </p>
        )}
      </div>
      </div>
    </>
  );
};

export default HomeContent;
