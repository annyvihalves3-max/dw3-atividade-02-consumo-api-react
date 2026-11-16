import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import styles from "@/components/DetailsContent/DetailsContent.module.css";
import Loading from "../Loading";

const API_URL = "https://pt.wikipedia.org/w/api.php";

// Seções do final do artigo que não interessam na página de detalhes
const SECOES_IGNORADAS = [
  "ver também",
  "referências",
  "notas",
  "ligações externas",
  "bibliografia",
  "galeria",
];

// Transforma o texto do artigo em blocos (títulos e parágrafos),
// limitando o tamanho para a página não ficar enorme
function montarBlocos(texto, limite = 3500) {
  const blocos = [];
  let total = 0;

  for (const linha of (texto || "").split("\n")) {
    const conteudo = linha.trim();
    if (!conteudo) continue;

    const titulo = conteudo.match(/^={2,}\s*(.+?)\s*={2,}$/);

    if (titulo) {
      if (SECOES_IGNORADAS.includes(titulo[1].toLowerCase())) break;
      blocos.push({ tipo: "titulo", texto: titulo[1] });
      continue;
    }

    if (total >= limite) break;

    blocos.push({ tipo: "paragrafo", texto: conteudo });
    total += conteudo.length;
  }

  // Remove um título que ficou sem parágrafo depois dele
  while (blocos.length && blocos[blocos.length - 1].tipo === "titulo") {
    blocos.pop();
  }

  return blocos;
}

const DetailsContent = ({ id }) => {
  const [destino, setDestino] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  // Busca os dados completos do item na API usando o identificador (pageid)
  useEffect(() => {
    if (!id) return;

    let ativo = true;

    const fetchDestino = async () => {
      try {
        setLoading(true);
        setErro("");

        const response = await axios.get(API_URL, {
          params: {
            action: "query",
            format: "json",
            origin: "*",
            pageids: id,
            prop: "extracts|pageimages|coordinates|info|description",
            explaintext: 1,
            piprop: "original|thumbnail",
            pithumbsize: 800,
            inprop: "url",
          },
        });

        const pagina = response.data?.query?.pages?.[id];

        if (!pagina || pagina.missing !== undefined) {
          throw new Error("Página não encontrada");
        }

        if (ativo) setDestino(pagina);
      } catch {
        if (ativo) setErro("Destino não encontrado.");
      } finally {
        if (ativo) setLoading(false);
      }
    };

    fetchDestino();

    return () => {
      ativo = false;
    };
  }, [id]);

  const foto = destino?.original?.source || destino?.thumbnail?.source;
  const coord = destino?.coordinates?.[0];
  const blocos = montarBlocos(destino?.extract);

  return (
    <div className={styles.details}>
      {/* Botão para voltar ao catálogo */}
      <Link href="/" className={styles.back}>
        ← Voltar para o catálogo
      </Link>

      <Loading loading={loading} />

      {erro && <p className={styles.error}>{erro}</p>}

      {destino && !loading && (
        <>
          <div className={styles.header}>
            {destino.description && (
              <span className={styles.tag}>{destino.description}</span>
            )}
            <h1>{destino.title}</h1>
          </div>

          {foto && (
            <div className={styles.photo}>
              <img src={foto} alt={destino.title} />
            </div>
          )}

          <div className={styles.grid}>
            <div className={styles.about}>
              <h2>Sobre o local</h2>

              {blocos.length > 0 ? (
                blocos.map((bloco, index) =>
                  bloco.tipo === "titulo" ? (
                    <h3 key={index}>{bloco.texto}</h3>
                  ) : (
                    <p key={index}>{bloco.texto}</p>
                  )
                )
              ) : (
                <p>Não há uma descrição disponível para este lugar.</p>
              )}

              {destino.fullurl && (
                <a
                  href={destino.fullurl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  Ler artigo completo na Wikipédia →
                </a>
              )}
            </div>

            <div className={styles.location}>
              <h2>Onde fica?</h2>

              {coord ? (
                <>
                  <iframe
                    title="Localização do lugar"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${coord.lon - 0.01}%2C${coord.lat - 0.006}%2C${coord.lon + 0.01}%2C${coord.lat + 0.006}&layer=mapnik&marker=${coord.lat}%2C${coord.lon}`}
                  />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.btnMap}
                  >
                    Ver rota no Google Maps
                  </a>
                </>
              ) : (
                <p>Localização não disponível para este lugar.</p>
              )}
            </div>
          </div>

          <p className={styles.source}>
            Fonte: Wikipédia. Textos e imagens podem ter licenças diferentes; consulte os créditos no artigo original.
          </p>
        </>
      )}
    </div>
  );
};

export default DetailsContent;
