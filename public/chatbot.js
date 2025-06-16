const intents = {
  'ok': ["ok", "Está bem", "interessante", "serio", "que bom", "óptimo", "beleza", "show"],
  'sim': ["sim", "preciso", "necessito"],
  'nao': ["nao", "deixa", "esquece", "não quero", "não preciso", "não necessito", "não quero mais", "nada", "esqueca"],
  'agredecimento': ["obrigado", "obg", "valeu", "tá numa", "tranquilo", "ajuda", "obrigado pela resposta"],
  'saudacao': ["estas bom", "oi", "olá", "bom dia", "boa tarde", "boa noite", "e aí", "ola", "oi tudo bem", "olá tudo bem", "bom dia tudo bem", "boa tarde tudo bem", "boa noite tudo bem"],
  'criador': ["criou", "criado por", "seu dono", "criador"],
  'horario': ['horário', 'funciona', 'abre', 'fecha', 'atendimento'],
  'especialidade': ['especialidade', 'médico', 'tem', 'oferece'],
  'consulta': ['marcar', 'consulta', 'agendar'],
  'localizacao': ['onde estao localizados', 'onde fica', 'encontrar', "como faco para chegar até voces", "central", "endereco", "como faço", "chegar", "trajecto", "localizacao", "clinica"]
};

// Estado
let agendamentoEmAndamento = false;
let etapaAgendamento = 0;
let dadosAgendamento = {};

function normalizarTexto(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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

function adicionarMensagem(origem, texto) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");

  const isUser = origem === "Você";
  const avatar = isUser
    ? `<img src="https://ui-avatars.com/api/?name=Você&background=1E40AF&color=fff&size=32" class="rounded-full w-8 h-8"/>`
    : `<img src="https://ui-avatars.com/api/?name=Bot&background=4B5563&color=fff&size=32" class="rounded-full w-8 h-8"/>`;

  div.className = `flex ${isUser ? "justify-end" : "justify-start"} items-start space-x-2 animate-fade-in`;

  div.innerHTML = isUser
    ? `
      <div class="max-w-md bg-blue-600 text-white px-4 py-2 rounded-xl shadow">${formatarTexto(texto)}</div>
      ${avatar}
    `
    : `
      ${avatar}
      <div class="max-w-md bg-gray-700 text-white px-4 py-2 rounded-xl shadow">${formatarTexto(texto)}</div>
    `;

  chat.appendChild(div);
  scrollChatToBottom();
}


function scrollChatToBottom() {
  const chat = document.getElementById("chat");
  chat.scrollTop = chat.scrollHeight;
}

function mostrarDigitando() {
  removerDigitando();
  const chat = document.getElementById("chat");
  const typing = document.createElement("div");
  typing.id = "digitando";
  typing.className = "text-left animate-fade-in";
  typing.innerHTML = `
    <div class="inline-block bg-gray-100 text-gray-600 px-4 py-2 rounded-xl rounded-bl-none italic shadow">
      Assistente está digitando...
    </div>
  `;
  chat.appendChild(typing);
  scrollChatToBottom();
}

function removerDigitando() {
  const typing = document.getElementById("digitando");
  if (typing) typing.remove();
}

function mostrarAlerta(tipo, mensagem) {
  const cor = tipo === "erro" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800";
  const div = document.createElement("div");
  div.className = `text-sm px-4 py-2 rounded-md mt-2 ${cor}`;
  div.innerText = mensagem;
  document.getElementById("chat").appendChild(div);
  scrollChatToBottom();
}

function atualizarProgresso(etapa) {
  const progresso = document.getElementById("progressBar");
  if (!progresso) return;
  const porcentagem = (etapa / 4) * 100;
  progresso.style.width = `${porcentagem}%`;
}

function cancelarAgendamento() {
  agendamentoEmAndamento = false;
  etapaAgendamento = 0;
  dadosAgendamento = {};
  document.getElementById('cancelarBtn').style.display = 'none';
  adicionarMensagem("Bot", "Tudo bem, o agendamento foi cancelado.");
  atualizarProgresso(0);
}

function enviarPergunta() {
  const input = document.getElementById('userInput');
  const pergunta = input.value.trim();
  const texto = normalizarTexto(pergunta);

  if (!pergunta) return;

  adicionarMensagem("Você", pergunta);
  input.value = '';

  if (["cancelar", "desistir", "parar", "sair", "nao quero", "esquece", "deixa", "esqueca"].some(p => texto.includes(p))) {
    cancelarAgendamento();
    return;
  }

  // Fluxo de agendamento
  if (agendamentoEmAndamento) {
    etapaAgendamento++;
    atualizarProgresso(etapaAgendamento);

    switch (etapaAgendamento) {
      case 1:
        dadosAgendamento.nome = pergunta;
        adicionarMensagem("Bot", "Qual o seu e-mail?");
        break;

      case 2:
        if (!/\S+@\S+\.\S+/.test(pergunta)) {
          adicionarMensagem("Bot", "Por favor, insira um e-mail válido.");
          etapaAgendamento--; // Repetir esta etapa
          return;
        }
        dadosAgendamento.email = pergunta;
        adicionarMensagem("Bot", "Qual a data e hora da consulta? (ex: 2025-06-20 14:00)");
        break;

      case 3:
        dadosAgendamento.data = pergunta;
        adicionarMensagem("Bot", "Qual o motivo da consulta?");
        break;

      case 4:
        dadosAgendamento.motivo = pergunta;
        mostrarDigitando();

        fetch('/api/agendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dadosAgendamento)
        })
        .then(res => res.json())
        .then(json => {
          removerDigitando();
          adicionarMensagem("Bot", json.msg || "Consulta registrada com sucesso.");
          mostrarAlerta("sucesso", "Consulta registrada com sucesso.");
        })
        .catch(() => {
          removerDigitando();
          adicionarMensagem("Bot", "Ocorreu um erro ao tentar agendar.");
          mostrarAlerta("erro", "Erro ao agendar. Tente novamente.");
        });

        // Resetar estado
        agendamentoEmAndamento = false;
        etapaAgendamento = 0;
        dadosAgendamento = {};
        document.getElementById('cancelarBtn').style.display = 'none';
        atualizarProgresso(0);
        break;
    }

    return;
  }

  // Caso não esteja no fluxo de agendamento
  mostrarDigitando();

  fetch('/api/faqs')
  .then(res => res.json())
  .then(faqs => {
    // Simula tempo de "digitação"
    setTimeout(() => {
      removerDigitando();
      const intencao = identificarIntencao(pergunta);
      let resposta = 'Desculpe, não entendi sua pergunta. Faça somente perguntas sobre a clínica.';

      if (intencao === 'consulta') {
        agendamentoEmAndamento = true;
        etapaAgendamento = 0;
        dadosAgendamento = {};
        document.getElementById('cancelarBtn').style.display = 'inline';
        adicionarMensagem("Bot", "Claro! Vamos agendar sua consulta. Qual o seu nome completo?");
        return;
      }

      if (intencao) {
        const faqRelacionada = faqs.find(faq => normalizarTexto(faq.intencao) === intencao);
        if (faqRelacionada) {
          resposta = faqRelacionada.resposta;
        }
      }

      adicionarMensagem("Bot", resposta);
    }, 1500); // 800ms de atraso (ajustável)
  })

}
function formatarTexto(texto) {
  return texto
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')        // **negrito**
    .replace(/\*(.*?)\*/g, '<em>$1</em>')                     // *itálico*
    .replace(/`(.*?)`/g, '<code class="bg-gray-800 px-1 rounded">$1</code>') // `código`
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="underline text-blue-400">$1</a>');
}

