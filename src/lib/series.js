const MS_DIA = 86400000;
const paraDia = (iso) => {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return Date.UTC(ano, mes - 1, dia) / MS_DIA;
};
const valorPadrao = (item) => Number(item.valor) || 0;

/** Soma os valores em `n` fatias iguais do período inicio..fim (para os mini-gráficos de barras). */
export function serieEmFatias(lista, dataDe, inicio, fim, n = 6, valorDe = valorPadrao) {
  const serie = Array(n).fill(0);
  const comeco = paraDia(inicio);
  const total = paraDia(fim) - comeco + 1;
  lista.forEach((item) => {
    const iso = dataDe(item);
    if (!iso) return;
    const posicao = paraDia(iso) - comeco;
    if (posicao < 0 || posicao >= total) return;
    serie[Math.min(n - 1, Math.floor((posicao / total) * n))] += valorDe(item);
  });
  return serie;
}

/** Total acumulado dia a dia dentro de um mês com `dias` dias. */
export function acumuladoPorDia(lista, dataDe, dias, valorDe = valorPadrao) {
  const porDia = Array(dias).fill(0);
  lista.forEach((item) => {
    const iso = dataDe(item);
    if (!iso) return;
    const dia = Number(iso.slice(8, 10));
    if (dia >= 1 && dia <= dias) porDia[dia - 1] += valorDe(item);
  });
  let acumulado = 0;
  return porDia.map((valor) => (acumulado += valor));
}

/** Curva suave que nunca "passa" dos pontos (interpolação monotônica). `pontos`: [[x, y], ...] */
export function curvaSuave(pontos) {
  const n = pontos.length;
  if (n === 0) return '';
  if (n === 1) return `M${pontos[0][0]},${pontos[0][1]}`;
  const x = pontos.map((p) => p[0]);
  const y = pontos.map((p) => p[1]);
  const dx = [];
  const m = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = x[i + 1] - x[i];
    m[i] = (y[i + 1] - y[i]) / dx[i];
  }
  const t = Array(n).fill(0);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i += 1) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i += 1) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
    } else {
      const a = t[i] / m[i];
      const b = t[i + 1] / m[i];
      const s = a * a + b * b;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        t[i] = tau * a * m[i];
        t[i + 1] = tau * b * m[i];
      }
    }
  }
  let d = `M${x[0]},${y[0]}`;
  for (let i = 0; i < n - 1; i += 1) {
    const c1x = x[i] + dx[i] / 3;
    const c1y = y[i] + (t[i] * dx[i]) / 3;
    const c2x = x[i + 1] - dx[i] / 3;
    const c2y = y[i + 1] - (t[i + 1] * dx[i]) / 3;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${x[i + 1]},${y[i + 1]}`;
  }
  return d;
}
