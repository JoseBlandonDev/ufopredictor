const stageCopy = {
  "24":
    "El modelo abre con ventaja ligera para Alemania por ELO y rendimiento reciente, pero mantiene riesgo alto por sede y volatilidad de torneo.",
  "6":
    "Las cuotas se mueven hacia Alemania y el modelo detecta una diferencia de 5.4 puntos frente al mercado. La confianza sube, pero no llega a recomendacion fuerte.",
  "60":
    "La alineacion confirma dos titulares ofensivos de Mexico. El empate gana peso y el riesgo sube: buen ejemplo de porque el Golden Hour importa.",
  ko:
    "Prediccion congelada antes del inicio. Desde aqui el resultado posterior alimenta el historial publico y no se edita la prediccion original.",
};

const buttons = document.querySelectorAll(".time-chip");
const copy = document.querySelector("#timeline-copy");

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    buttons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    copy.textContent = stageCopy[button.dataset.stage];
  });
});
