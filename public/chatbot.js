const intents = {
  'ok': ["ok", "Está bem", "interessante", "serio", "que bom", "óptimo", "beleza", "show"],
  'sim': ["sim", "preciso", "necessito"],
  'agredecimento': ["obrigado", "obg", "valeu", "tá numa", "tranquilo", "ajuda", "obrigado pela resposta"],
  'saudacao': ["oi", "olá", "bom dia", "boa tarde", "boa noite", "e aí", "ola"],
  'criador': ["criou", "te fez", "criado por", "seu dono", "criador", "tu es", "tu", "sobre"],
  'horario': ['horário', 'funciona', 'abre', 'fecha', 'atendimento'],
  'especialidade': ['especialidade', 'médico', 'tem', 'oferece'],
  'consulta': ['marcar', 'consulta', 'agendar'],
  'localizacao': ['onde estao localizados', 'onde fica', 'encontrar', "como faco para chegar até voces", "central", "endereco", "como faço", "chegar", "trajecto", "localizacao", "clinica"]
};

// Estado do agendamento
let agendamentoEmAndamento = false;
let etapaAgendamento = 0;
let dadosAgendamento = {};

function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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
  const texto = normalizarTexto(pergunta);
  const chat = document.getElementById('chat');

  chat.innerHTML += `<p><strong>Você:</strong> ${pergunta}</p>`;

  // Verifica cancelamento em qualquer momento
  if (["cancelar", "desistir", "parar", "sair", "nao quero"].some(p => texto.includes(p))) {
    if (agendamentoEmAndamento) {
      agendamentoEmAndamento = false;
      etapaAgendamento = 0;
      dadosAgendamento = {};
      chat.innerHTML += `<p><strong>Bot:</strong> Tudo bem, o agendamento foi cancelado.</p>`;
    } else {
      chat.innerHTML += `<p><strong>Bot:</strong> Nenhum processo de agendamento está em andamento.</p>`;
    }
    input.value = '';
    return;
  }

  // Fluxo de agendamento
  if (agendamentoEmAndamento) {
    etapaAgendamento++;
    switch (etapaAgendamento) {
      case 1:
        dadosAgendamento.nome = pergunta;
        chat.innerHTML += `<p><strong>Bot:</strong> Qual o seu e-mail?</p>`;
        break;
      case 2:
        dadosAgendamento.email = pergunta;
        chat.innerHTML += `<p><strong>Bot:</strong> Qual a data e hora da consulta? (ex: 2025-06-20 14:00)</p>`;
        break;
      case 3:
        dadosAgendamento.data = pergunta;
        chat.innerHTML += `<p><strong>Bot:</strong> Qual o motivo da consulta?</p>`;
        break;
      case 4:
        dadosAgendamento.motivo = pergunta;

        fetch('api/agendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosAgendamento)
        })
        .then(res => res.json())
        .then(json => {
          chat.innerHTML += `<p><strong>Bot:</strong> ${json.msg}</p>`;
        })
        .catch(err => {
          chat.innerHTML += `<p><strong>Bot:</strong> Ocorreu um erro ao tentar agendar.</p>`;
        });

        agendamentoEmAndamento = false;
        etapaAgendamento = 0;
        dadosAgendamento = {};
        break;
    }

    input.value = '';
    return;
  }

  // Caso não seja agendamento
  fetch('/api/faqs')
    .then(res => res.json())
    .then(faqs => {
      const intencao = identificarIntencao(pergunta);
      let resposta = 'Desculpe, não entendi sua pergunta. Faça somente perguntas sobre a clínica.';

      if (intencao === 'consulta') {
        agendamentoEmAndamento = true;
        etapaAgendamento = 0;
        dadosAgendamento = {};
        chat.innerHTML += `<p><strong>Bot:</strong> Claro! Vamos agendar sua consulta. Qual o seu nome completo?</p>`;
        input.value = '';
        return;
      }

      if (intencao) {
        const faqRelacionada = faqs.find(faq => normalizarTexto(faq.intencao) === intencao);
        if (faqRelacionada) {
          resposta = faqRelacionada.resposta;
        }
      }

      chat.innerHTML += `<p><strong>Bot:</strong> ${resposta}</p>`;
      input.value = '';
    });
}
