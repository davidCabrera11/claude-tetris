'use strict';

// ---- Skins ----
// Cada skin define palette(theme) (array indexado como COLORS, índice 0 = null,
// 8 entradas incl. Tuerca) y drawBlock(context, x, y, color, size, alpha).
// COLORS / COLORS_LIGHT / themeColors / theme / setTheme viven en game.js: sólo se
// usan al dibujar o al llamar a setSkin, nunca al cargar este script.

const SKIN_KEY = 'tetris-skin';

function roundRectPath(context, x, y, w, h, r) {
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
}

const NEON_COLORS = [null, '#00f0ff', '#ffee00', '#d500f9', '#39ff14', '#ff1744', '#448aff', '#ff9100', '#ff4081'];
const PASTEL_DARK = [null, '#a8e6ef', '#fff1b8', '#d9b8e6', '#b8e6c1', '#f5b8b8', '#b8d4f5', '#fad4a8', '#f8c8dc'];
const PASTEL_LIGHT = [null, '#7fd3df', '#f5d86e', '#c298d6', '#94d4a0', '#ee9a9a', '#94b9ec', '#f5bc7c', '#f3a6c4'];

const SKINS = {
  retro: {
    label: 'Retro',
    palette: t => (t === 'light' ? COLORS_LIGHT : COLORS),
    drawBlock(context, x, y, color, size, alpha) {
      context.globalAlpha = alpha;
      context.fillStyle = color;
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      context.fillStyle = themeColors.highlight;
      context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      context.globalAlpha = 1;
    },
  },

  neon: {
    label: 'Neon',
    palette: () => NEON_COLORS,
    drawBlock(context, x, y, color, size, alpha) {
      const px = x * size + 3, py = y * size + 3, s = size - 6;
      context.save();
      context.globalAlpha = alpha * 0.3;
      context.fillStyle = color;
      context.fillRect(px, py, s, s);
      context.globalAlpha = alpha;
      context.shadowColor = color;
      context.shadowBlur = alpha < 1 ? 6 : 14;
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.strokeRect(px, py, s, s);
      context.restore(); // restaura shadowBlur/shadowColor/alpha: nada se filtra a otros bloques
    },
  },

  pastel: {
    label: 'Pastel',
    palette: t => (t === 'light' ? PASTEL_LIGHT : PASTEL_DARK),
    drawBlock(context, x, y, color, size, alpha) {
      const px = x * size + 1.5, py = y * size + 1.5, s = size - 3;
      context.globalAlpha = alpha;
      context.fillStyle = color;
      roundRectPath(context, px, py, s, s, size * 0.3);
      context.fill();
      context.fillStyle = 'rgba(255,255,255,0.4)';
      roundRectPath(context, px + s * 0.18, py + s * 0.14, s * 0.64, s * 0.2, s * 0.1);
      context.fill();
      context.globalAlpha = 1;
    },
  },

  pixel: {
    label: 'Pixel art',
    palette: t => (t === 'light' ? COLORS_LIGHT : COLORS),
    drawBlock(context, x, y, color, size, alpha) {
      const bx = x * size, by = y * size;
      const n = 6;                    // textura de 6x6 "píxeles"
      const p = Math.max(1, (size - 2) / n);
      context.globalAlpha = alpha;
      context.fillStyle = color;
      context.fillRect(bx + 1, by + 1, size - 2, size - 2);
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          let shade = null;
          if (r === 0 || c === 0) shade = 'rgba(255,255,255,0.35)';       // bisel claro
          else if (r === n - 1 || c === n - 1) shade = 'rgba(0,0,0,0.3)'; // bisel oscuro
          else if ((r + c) % 2 === 0) shade = 'rgba(0,0,0,0.12)';         // tramado
          if (!shade) continue;
          context.fillStyle = shade;
          context.fillRect(bx + 1 + c * p, by + 1 + r * p, p, p);
        }
      }
      context.globalAlpha = 1;
    },
  },
};

let skin = 'retro';

function setSkin(name, persist = true) {
  skin = Object.prototype.hasOwnProperty.call(SKINS, name) ? name : 'retro';
  document.documentElement.dataset.skin = skin;
  const select = document.getElementById('skin-select');
  if (select) select.value = skin;
  if (persist) {
    try { localStorage.setItem(SKIN_KEY, skin); } catch (e) { /* ignorar */ }
  }
  // setTheme relee las variables CSS (--grid, --block-highlight) que el skin puede
  // sobrescribir y redibuja (también en pausa / game over).
  setTheme(theme, false);
}

function initSkinSelect() {
  const select = document.getElementById('skin-select');
  if (select) {
    select.addEventListener('change', () => {
      setSkin(select.value);
      select.blur(); // evita que Space/flechas cambien el select durante el juego
    });
  }
  let saved = null;
  try { saved = localStorage.getItem(SKIN_KEY); } catch (e) { /* ignorar */ }
  setSkin(saved, false);
}
