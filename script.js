// Configurações rápidas — personalize aqui e não no HTML
// Preencha com seus dados reais:
const CONFIG = {
  whatsappNumber: "+5519997028850", // formato completo com DDI/DD — ex.: +5511999999999
  whatsappMsg: "Olá! Gostaria de agendar uma consulta com o Dr. José",
  instagramUser: "palharesferreiraadvocacia",
  email: "joseolimpio.ferreira@gmail.com",
  address: "Rua Marciliano, 871, Centro, Mogi Mirim - SP",
  // COMO OBTER O LINK DO GOOGLE MAPS (EMBED):
  // 1) Abra o Google Maps e pesquise seu endereço.
  // 2) Clique em 'Compartilhar' > 'Incorporar um mapa' > 'Copiar HTML'.
  // 3) Do HTML copiado, extraia o valor de src do <iframe> e cole abaixo:
  googleMapsEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3687.849234214532!2d-46.96632902541866!3d-22.43469972116847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94c8f8344e07d79b%3A0x49b69251e1362390!2sR.%20Marciliano%2C%20871%20-%20Centro%2C%20Mogi%20Mirim%20-%20SP%2C%2013800-012!5e0!3m2!1spt-BR!2sbr!4v1756147958305!5m2!1spt-BR!2sbr" // cole o parâmetro completo após ?pb=
};

// -------------------------------------------------------
// Modo escuro/claro com persistência
(function initTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Seleciona as imagens dos logos que serão alteradas
  const logoImg = document.querySelector(".logo");
  const ringLogoImg = document.querySelector(".ring-logo");

  /**
   * Função para atualizar os logos baseado no tema atual.
   * Modo escuro: usa logo.svg
   * Modo claro: usa logodark.svg
   */
  function updateLogos() {
    const isDark = root.classList.contains("dark");

    // Atualiza logo do header
    if (logoImg) {
      logoImg.src = isDark ? 'assets/logo.svg' : 'assets/logodark.svg';
    }

    // Atualiza logo do ring
    if (ringLogoImg) {
      ringLogoImg.src = isDark ? 'assets/logo.svg' : 'assets/logodark.svg';
    }
  }

  // A lógica original para definir o tema no carregamento da página.
  if (saved) {
    root.classList.toggle("dark", saved === "dark");
  } else {
    root.classList.toggle("dark", prefersDark);
  }

  // Chama a função para que os logos corretos sejam exibidos assim que a página carregar.
  updateLogos();

  const themeCheckbox = document.querySelector(".theme-switch__checkbox");
  if (themeCheckbox) {
    themeCheckbox.checked = root.classList.contains("dark");
    themeCheckbox.addEventListener("change", (e) => {
      const isDark = e.target.checked;
      root.classList.toggle("dark", isDark);
      localStorage.setItem("theme", isDark ? "dark" : "light");

      // Chama a função para que os logos mudem sempre que o tema for alternado.
      updateLogos();
    });
  }
})();

// -------------------------------------------------------
// Preenche links dinâmicos de contato
(function initContacts() {
  // WhatsApp links
  const waBase = "https://wa.me/";
  const num = CONFIG.whatsappNumber.replace(/\D/g, "");
  const text = encodeURIComponent(CONFIG.whatsappMsg);
  const waLink = `${waBase}${num}?text=${text}`;

  const whatsEls = ["ctaWhats", "areasWhats", "fabWhats", "contactWhats"]
    .map(id => document.getElementById(id))
    .filter(Boolean);
  whatsEls.forEach(a => a.href = waLink);

  // Instagram links
  const instaUrl = `https://www.instagram.com/${CONFIG.instagramUser}/`;
  const instaEls = ["fabInsta", "contactInsta"]
    .map(id => document.getElementById(id))
    .filter(Boolean);
  instaEls.forEach(a => a.href = instaUrl);

  // E-mail (fab usa mailto no HTML); atualiza contato
  const emailEl = document.getElementById("contactEmail");
  if (emailEl) { emailEl.href = `mailto:${CONFIG.email}`; emailEl.textContent = CONFIG.email; }

  // Endereço
  const addrEl = document.getElementById("contactAddress");
  if (addrEl) { addrEl.textContent = CONFIG.address; }

  // Google Maps iframe
  const map = document.getElementById("mapFrame");
  if (map && CONFIG.googleMapsEmbedUrl && CONFIG.googleMapsEmbedUrl.includes("https://www.google.com/maps/embed")) {
    map.src = CONFIG.googleMapsEmbedUrl;
    map.loading = "lazy";
    map.referrerPolicy = "no-referrer-when-downgrade";
  }
})();

// -------------------------------------------------------
// Carrega posts do blog a partir de posts.json
let allPosts = []; // Armazena todos os posts para pesquisa
let postsContent = {}; // Cache do conteúdo completo dos posts

async function loadPosts() {
  try {
    const res = await fetch("data/posts.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao carregar posts.json");
    const posts = await res.json();
    allPosts = posts; // Armazena posts para pesquisa

    // Carrega conteúdo completo dos posts em background
    loadPostsContent(posts);

    renderPosts(posts);
  } catch (e) {
    console.warn(e);
    const empty = document.getElementById("no-posts");
    if (empty) empty.hidden = false;
  }
}

// Carrega o conteúdo completo de cada post
async function loadPostsContent(posts) {
  // Carrega posts em paralelo para melhor performance
  const promises = posts.map(async (post) => {
    try {
      const slug = new URLSearchParams(post.url.split('?')[1]).get('slug');
      const postUrl = slug ? `posts/${slug}.html` : post.url;

      const response = await fetch(postUrl, { cache: "no-store" });
      if (response.ok) {
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Tenta diferentes seletores para encontrar o conteúdo principal
        const contentSelectors = [
          '.post-content',
          '.content',
          'main article',
          'article',
          'main',
          '.post-body',
          '.entry-content'
        ];

        let contentElement = null;
        for (const selector of contentSelectors) {
          contentElement = doc.querySelector(selector);
          if (contentElement) break;
        }

        // Se não encontrou, usa o body mas remove header, nav, footer
        if (!contentElement) {
          contentElement = doc.body;
          if (contentElement) {
            // Remove elementos que não são conteúdo principal
            const elementsToRemove = contentElement.querySelectorAll('header, nav, footer, .header, .nav, .footer, script, style');
            elementsToRemove.forEach(el => el.remove());
          }
        }

        const textContent = contentElement ? contentElement.textContent || contentElement.innerText : '';

        // Remove espaços extras, quebras de linha e caracteres especiais
        const cleanContent = textContent
          .replace(/\s+/g, ' ')
          .replace(/[^\w\sáàâãéèêíìîóòôõúùûçÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ]/gi, ' ')
          .trim();

        postsContent[post.url] = cleanContent;

        // Atualiza o placeholder da pesquisa para indicar que o conteúdo foi carregado
        updateSearchPlaceholder();
      }
    } catch (e) {
      console.warn(`Erro ao carregar conteúdo do post ${post.url}:`, e);
      postsContent[post.url] = post.excerpt || '';
    }
  });

  await Promise.all(promises);
}

// Atualiza o placeholder da pesquisa
function updateSearchPlaceholder() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput && Object.keys(postsContent).length === allPosts.length) {
    searchInput.placeholder = "Pesquisar por título, conteúdo ou palavras-chave...";
  }
}

function renderPosts(posts) {
  const list = document.getElementById("posts");
  const empty = document.getElementById("no-posts");

  // Limpa posts existentes
  list.innerHTML = "";

  if (!Array.isArray(posts) || posts.length === 0) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  // Ordena por data desc
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  posts.forEach(p => {
    const card = document.createElement("article");
    card.className = "post-card";
    const date = new Date(p.date);
    const dateStr = date.toLocaleDateString("pt-BR", { year: "numeric", month: "short", day: "2-digit" });

    // Extrai o slug da URL para criar o link de navegação
    const slug = new URLSearchParams(p.url.split('?')[1]).get('slug');
    const navigationUrl = slug ? `post.html?slug=${slug}` : p.url;

    card.innerHTML = `
      <div class="post-meta"><img class="calendar" src="https://i.ibb.co/pBC2YxZL/image-ij7-GEZhfmz-LNl-Lg-DJVhk-ST8-FIm5r-JV.png" alt="image-ij7-GEZhfmz-LNl-Lg-DJVhk-ST8-FIm5r-JV" border="0" <span>${dateStr}</span></div>
      <h3><a href="${navigationUrl}" rel="noopener">${p.title}</a></h3>
      <p>${p.excerpt || ""}</p>
    `;
    list.appendChild(card);
  });
}

// Inicializa a pesquisa
function initSearch() {
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearch");

  if (!searchInput || !clearBtn) return;

  // Função de pesquisa
  function searchPosts(query) {
    if (!query.trim()) {
      renderPosts(allPosts);
      clearBtn.classList.remove("visible");
      return;
    }

    clearBtn.classList.add("visible");

    const filteredPosts = allPosts.filter(post => {
      // Busca no título e excerpt primeiro
      const titleExcerpt = `${post.title} ${post.excerpt || ""}`.toLowerCase();

      // Se encontrou no título/excerpt, retorna true
      if (titleExcerpt.includes(query.toLowerCase())) {
        return true;
      }

      // Busca no conteúdo completo se disponível
      const fullContent = postsContent[post.url];
      if (fullContent) {
        return fullContent.toLowerCase().includes(query.toLowerCase());
      }

      return false;
    });

    renderPosts(filteredPosts);
  }

  // Event listeners
  searchInput.addEventListener("input", (e) => {
    searchPosts(e.target.value);
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    searchPosts("");
  });

  // Limpa pesquisa ao pressionar Escape
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      searchPosts("");
    }
  });
}

// Carrega posts e inicializa pesquisa
loadPosts().then(() => {
  initSearch();

  // Adiciona indicador de carregamento
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.placeholder = "Carregando conteúdo para pesquisa...";
  }
});

// -------------------------------------------------------
// Animação de revelar ao rolar
(function revealOnScroll() {
  const items = document.querySelectorAll(".reveal");
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // aplica um pequeno atraso baseado no índice para efeito cascata
        const index = [...items].indexOf(entry.target);
        entry.target.style.transitionDelay = `${Math.min(index * 80, 480)}ms`;
        entry.target.classList.add("revealed");
        obs.unobserve(entry.target);
      }
    })
  }, { threshold: .15 });
  items.forEach(el => obs.observe(el));
})();

// -------------------------------------------------------
// Ano no rodapé
document.getElementById("year").textContent = new Date().getFullYear();