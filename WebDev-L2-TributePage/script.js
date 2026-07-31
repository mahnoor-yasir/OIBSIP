/* ============================================================
   Dr. A. Q. Khan — Tribute · script.js
   Animations, interactions, and micro-utilities.
   ============================================================ */

/* ---------- Loader ---------- */
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  setTimeout(() => loader.classList.add("hidden"), 600);
  initParticles();
  startTyping();
  initCounters();
});

/* ---------- Year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Custom cursor ---------- */
const cursor = document.getElementById("cursor");
const cursorDot = document.getElementById("cursorDot");
let cx = 0, cy = 0, tx = 0, ty = 0;
window.addEventListener("mousemove", (e) => {
  tx = e.clientX; ty = e.clientY;
  cursorDot.style.left = tx + "px";
  cursorDot.style.top = ty + "px";
});
function animateCursor() {
  cx += (tx - cx) * 0.18;
  cy += (ty - cy) * 0.18;
  cursor.style.left = cx + "px";
  cursor.style.top = cy + "px";
  requestAnimationFrame(animateCursor);
}
animateCursor();
document.querySelectorAll("a, button, .g-item, input, textarea").forEach((el) => {
  el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
  el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
});

/* ---------- Reading progress ---------- */
const progress = document.getElementById("progressBar");
window.addEventListener("scroll", () => {
  const h = document.documentElement;
  const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
  progress.style.width = pct + "%";

  // Nav shadow
  document.querySelector(".nav").classList.toggle("scrolled", h.scrollTop > 20);

  // Back to top
  document.getElementById("backTop").classList.toggle("show", h.scrollTop > 500);

  // Active nav link
  const sections = document.querySelectorAll("section[id]");
  let current = "";
  sections.forEach((s) => {
    if (s.getBoundingClientRect().top <= 140) current = s.id;
  });
  document.querySelectorAll(".nav-links a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === "#" + current);
  });
});

/* ---------- Back to top ---------- */
document.getElementById("backTop").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ---------- Nav toggle ---------- */
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open);
});
navLinks.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => navLinks.classList.remove("open"));
});

/* ---------- Theme switcher ---------- */
const savedTheme = localStorage.getItem("aqk-theme") || "rose";
document.body.setAttribute("data-theme", savedTheme);
document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
  if (btn.dataset.themeBtn === savedTheme) btn.classList.add("active");
  btn.addEventListener("click", () => {
    const t = btn.dataset.themeBtn;
    document.body.setAttribute("data-theme", t);
    localStorage.setItem("aqk-theme", t);
    document.querySelectorAll("[data-theme-btn]").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

/* ---------- Reveal on scroll ---------- */
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        const d = parseInt(e.target.dataset.delay || 0, 10);
        setTimeout(() => e.target.classList.add("in"), d);
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

/* ---------- Particles ---------- */
function initParticles() {
  const wrap = document.getElementById("particles");
  const n = window.innerWidth < 700 ? 14 : 28;
  for (let i = 0; i < n; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = 4 + Math.random() * 10;
    p.style.width = p.style.height = size + "px";
    p.style.left = Math.random() * 100 + "vw";
    p.style.animationDuration = 12 + Math.random() * 18 + "s";
    p.style.animationDelay = -Math.random() * 20 + "s";
    wrap.appendChild(p);
  }
}

/* ---------- Typing animation ---------- */
function startTyping() {
  const el = document.getElementById("typed");
  const lines = [
    "Metallurgist. Educator. Patriot.",
    "Architect of Pakistan's nuclear program.",
    "Builder of laboratories and generations.",
    "A life devoted to science and self-reliance.",
  ];
  let li = 0, ci = 0, deleting = false;
  function tick() {
    const cur = lines[li];
    if (!deleting) {
      el.textContent = cur.slice(0, ++ci);
      if (ci === cur.length) { deleting = true; return setTimeout(tick, 1800); }
    } else {
      el.textContent = cur.slice(0, --ci);
      if (ci === 0) { deleting = false; li = (li + 1) % lines.length; }
    }
    setTimeout(tick, deleting ? 30 : 55);
  }
  tick();
}

/* ---------- Counters ---------- */
function initCounters() {
  const nums = document.querySelectorAll(".stat-num");
  const seen = new WeakSet();
  const ob = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting || seen.has(e.target)) return;
      seen.add(e.target);
      const target = parseInt(e.target.dataset.count, 10);
      const dur = 1600;
      const start = performance.now();
      function step(now) {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        e.target.textContent = Math.floor(target * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  nums.forEach((n) => ob.observe(n));
}

/* ---------- Quote carousel ---------- */
const quotes = document.querySelectorAll(".quote");
const qDots = document.getElementById("qDots");
let qIndex = 0;
quotes.forEach((_, i) => {
  const d = document.createElement("span");
  if (i === 0) d.classList.add("active");
  d.addEventListener("click", () => setQuote(i));
  qDots.appendChild(d);
});
function setQuote(i) {
  qIndex = (i + quotes.length) % quotes.length;
  quotes.forEach((q, k) => q.classList.toggle("active", k === qIndex));
  qDots.querySelectorAll("span").forEach((d, k) => d.classList.toggle("active", k === qIndex));
}
document.getElementById("qPrev").addEventListener("click", () => setQuote(qIndex - 1));
document.getElementById("qNext").addEventListener("click", () => setQuote(qIndex + 1));
setInterval(() => setQuote(qIndex + 1), 7000);

document.getElementById("qFav").addEventListener("click", () => {
  const text = quotes[qIndex].querySelector("p").textContent;
  localStorage.setItem("aqk-fav-quote", text);
  document.getElementById("qFavMsg").textContent = "Saved to your favorites ✧";
  setTimeout(() => (document.getElementById("qFavMsg").textContent = ""), 2200);
});

/* ---------- Timeline search ---------- */
const searchInput = document.getElementById("timelineSearch");
searchInput.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  document.querySelectorAll(".tl-item").forEach((li) => {
    const tags = (li.dataset.tags || "") + " " + li.textContent.toLowerCase();
    li.classList.toggle("hidden", q && !tags.includes(q));
  });
});

/* ---------- Gallery lightbox ---------- */
const gItems = document.querySelectorAll(".g-item");
const lb = document.getElementById("lightbox");
const lbImg = document.getElementById("lbImg");
const lbCap = document.getElementById("lbCaption");
let lbIndex = 0;
const gData = Array.from(gItems).map((el) => ({
  src: el.dataset.src, caption: el.dataset.caption,
}));
function openLB(i) {
  lbIndex = i;
  lbImg.src = gData[i].src;
  lbImg.alt = gData[i].caption;
  lbCap.textContent = gData[i].caption;
  lb.classList.add("open");
  lb.setAttribute("aria-hidden", "false");
}
function closeLB() { lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true"); }
gItems.forEach((el, i) => el.addEventListener("click", () => openLB(i)));
document.getElementById("lbClose").addEventListener("click", closeLB);
document.getElementById("lbPrev").addEventListener("click", () => openLB((lbIndex - 1 + gData.length) % gData.length));
document.getElementById("lbNext").addEventListener("click", () => openLB((lbIndex + 1) % gData.length));
document.addEventListener("keydown", (e) => {
  if (!lb.classList.contains("open")) return;
  if (e.key === "Escape") closeLB();
  if (e.key === "ArrowLeft") openLB((lbIndex - 1 + gData.length) % gData.length);
  if (e.key === "ArrowRight") openLB((lbIndex + 1) % gData.length);
});
lb.addEventListener("click", (e) => { if (e.target === lb) closeLB(); });

/* ---------- Ripple ---------- */
document.querySelectorAll(".ripple").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty("--x", e.clientX - r.left + "px");
    btn.style.setProperty("--y", e.clientY - r.top + "px");
    btn.classList.remove("active"); void btn.offsetWidth; btn.classList.add("active");
  });
});

/* ---------- Contact form ---------- */
async function handleContact(ev) {
  ev.preventDefault();
  const formMsg = document.getElementById("formMsg");
  formMsg.textContent = "Sending message...";

  const data = new FormData(ev.target);

  try {
    const response = await fetch(ev.target.action, {
      method: 'POST',
      body: data,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      formMsg.textContent = "Thank you — your message has been noted. ✧";
      ev.target.reset();
    } else {
      formMsg.textContent = "Oops! There was a problem submitting your form.";
    }
  } catch (error) {
    formMsg.textContent = "Oops! There was a problem submitting your form.";
  }
  return false;
}

/* ---------- Share ---------- */
function shareLink(kind) {
  const url = encodeURIComponent(window.location.href);
  const text = encodeURIComponent("A tribute to Dr. Abdul Qadeer Khan");
  const map = {
    twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
    facebook: `https://facebook.com/sharer/sharer.php?u=${url}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
  };
  if (kind === "copy") {
    navigator.clipboard?.writeText(window.location.href);
    alert("Link copied to clipboard.");
    return;
  }
  window.open(map[kind], "_blank", "noopener");
}

/* ---------- Download biography (print-to-PDF) ---------- */
function downloadBio() {
  const bio = document.getElementById("biography").outerHTML;
  const w = window.open("", "_blank");
  w.document.write(`
    <html><head><title>Dr. A. Q. Khan — Biography</title>
    <style>
      body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; padding: 0 20px; color: #222; line-height: 1.7; }
      h2, h3 { font-family: 'Playfair Display', serif; }
      article { margin-bottom: 26px; padding-bottom: 20px; border-bottom: 1px solid #eee; }
    </style>
    </head><body>${bio}
    <script>window.onload = () => setTimeout(() => window.print(), 300);<\/script>
    </body></html>
  `);
  w.document.close();
}
window.handleContact = handleContact;
window.shareLink = shareLink;
window.downloadBio = downloadBio;

/* ---------- Parallax portrait ---------- */
const portrait = document.querySelector(".portrait-frame");
if (portrait) {
  window.addEventListener("mousemove", (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 8;
    const y = (e.clientY / window.innerHeight - 0.5) * 8;
    portrait.style.transform = `rotate(${-1.5 + x * 0.15}deg) translate(${x}px, ${y}px)`;
  });
}
