function qs(id) {
  return document.getElementById(id);
}

function escapeHTML(v) {
  const d = document.createElement("div");
  d.textContent = v == null ? "" : String(v);
  return d.innerHTML;
}

function moeda(v) {
  return new Intl.NumberFormat("pt-BR", {style:"currency", currency:"BRL"}).format(Number(v) || 0);
}

function dataBR(v) {
  if (!v) return "";
  const d = new Date(String(v) + "T00:00:00");
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString("pt-BR");
}

function dataHoje() {
  const d = new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}

function quantidade(v) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  }).format(Number(v) || 0);
}

