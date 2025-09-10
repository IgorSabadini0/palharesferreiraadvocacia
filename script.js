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

  // NOVO: Seleciona a imagem do logo que será alterada.
  const logoImg = document.querySelector(".logo");

  /**
   * NOVO: Esta é a nossa função de documentação.
   * Ela verifica se a classe 'dark' está presente no elemento <html> (root).
   * Se estiver, usa o logo para o modo escuro. Caso contrário, usa o logo padrão.
   */
  function updateLogo() {
    // Garante que o código não quebre se o elemento do logo não for encontrado.
    if (!logoImg) return;

    const isDark = root.classList.contains("dark");
    logoImg.src = isDark ? 'assets/logo.svg' : 'assets/logodark.svg';
  }

  // A lógica original para definir o tema no carregamento da página.
  if (saved) {
    root.classList.toggle("dark", saved === "dark");
  } else {
    root.classList.toggle("dark", prefersDark);
  }

  // NOVO: Chamamos a função aqui para que o logo correto seja exibido assim que a página carregar.
  updateLogo();

  const themeCheckbox = document.querySelector(".theme-switch__checkbox");
  if (themeCheckbox) {
    themeCheckbox.checked = root.classList.contains("dark");
    themeCheckbox.addEventListener("change", (e) => {
      const isDark = e.target.checked;
      root.classList.toggle("dark", isDark);
      localStorage.setItem("theme", isDark ? "dark" : "light");

      // NOVO: Também chamamos a função aqui, para que o logo mude sempre que o tema for alternado.
      updateLogo();
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
async function loadPosts() {
  try {
    const res = await fetch("data/posts.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Falha ao carregar posts.json");
    const posts = await res.json();
    const list = document.getElementById("posts");
    const empty = document.getElementById("no-posts");

    if (!Array.isArray(posts) || posts.length === 0) {
      empty.hidden = false;
      return;
    }
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
        <div class="post-meta">🗓️ <span>${dateStr}</span></div>
        <h3><a href="${navigationUrl}" rel="noopener">${p.title}</a></h3>
        <p>${p.excerpt || ""}</p>
      `;
      list.appendChild(card);
    });
  } catch (e) {
    console.warn(e);
    const empty = document.getElementById("no-posts");
    if (empty) empty.hidden = false;
  }
}
loadPosts();

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