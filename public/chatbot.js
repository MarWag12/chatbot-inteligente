const intents = {
  'horario': ['horário', 'funciona', 'abre', 'fecha', 'atendimento'],
  'especialidade': ['especialidade', 'médico', 'tem', 'oferece'],
  'consulta': ['marcar', 'consulta', 'agendar']
};

function normalizarTexto(texto) {
  return texto
    .normalize("NFD") // separa acento da letra
    .replace(/[\u0300-\u036f]/g, "") // remove os acentos
    .toLowerCase(); // tudo minúsculo
}

function identificarIntencao(pergunta) {
  const texto = normalizarTexto(pergunta);
  for (let chave in intents) {
    for (let termo of intents[chave]) {
      if (texto.includes(normalizarTexto(termo))) {
        return chave;
      }
    }
  }
  return null;
}

function enviarPergunta() {
  const input = document.getElementById('userInput');
  const pergunta = input.value.trim();

  fetch('/api/faqs')
    .then(res => res.json())
    .then(faqs => {
      const intencao = identificarIntencao(pergunta);
      let resposta = 'Desculpe, não entendi sua pergunta.';

      if (intencao) {
        const faqRelacionada = faqs.find(faq => normalizarTexto(faq.intencao) === intencao);
        if (faqRelacionada) {
          resposta = faqRelacionada.resposta;
        }
      }

      document.getElementById('chat').innerHTML += `
        <p><strong>Você:</strong> ${pergunta}</p>
        <p><strong>Bot:</strong> ${resposta}</p>
      `;

      input.value = '';
    });
}
