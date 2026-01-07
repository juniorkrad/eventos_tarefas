document.addEventListener("DOMContentLoaded", () => {
    iniciarCalendario();

    // Ouve o pedido do events.js para recarregar a tela quando salva algo novo
    document.addEventListener('calendar-refresh-needed', () => {
        iniciarCalendario();
    });
});

function iniciarCalendario() {
    const calendarGrid = document.getElementById('calendar-grid');
    if (calendarGrid) {
        const month = parseInt(calendarGrid.getAttribute('data-month'));
        const year = parseInt(calendarGrid.getAttribute('data-year'));
        renderCalendar(month, year, calendarGrid);
    }
}

function renderCalendar(month, year, container) {
    container.innerHTML = ""; // Limpa grid

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // 1. Coletar TODOS os eventos em uma lista única
    let todosEventos = [];
    if (window.globalEventsData) {
        Object.values(window.globalEventsData).forEach(listaEventos => {
            todosEventos.push(...listaEventos);
        });
    }

    // 2. Dias do Mês Anterior (Visual apenas)
    for (let i = firstDayIndex; i > 0; i--) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell', 'other-month');
        dayCell.innerHTML = `<span class="day-number">${daysInPrevMonth - i + 1}</span>`;
        container.appendChild(dayCell);
    }

    // 3. Dias do Mês Atual
    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell');
        
        // Cria a data ISO deste dia (YYYY-MM-DD)
        const diaFormatado = String(i).padStart(2, '0');
        const mesFormatado = String(month + 1).padStart(2, '0');
        const dataAtualISO = `${year}-${mesFormatado}-${diaFormatado}`;

        // Filtra eventos que acontecem neste dia
        const eventosDoDia = todosEventos.filter(evento => {
            if (typeof evento === 'string') return false; 
            if (!evento.inicio || !evento.fim) return false;
            return dataAtualISO >= evento.inicio && dataAtualISO <= evento.fim;
        });

        // Ordenar eventos por hora
        eventosDoDia.sort((a, b) => {
            if (a.horaInicio < b.horaInicio) return -1;
            if (a.horaInicio > b.horaInicio) return 1;
            return 0;
        });

        // --- CONSTRUÇÃO DO CONTEÚDO ---
        
        // 1. Adiciona o número do dia
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.innerText = i;
        dayCell.appendChild(dayNumber);

        // Verifica se é hoje
        const today = new Date();
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayCell.classList.add('today');
        }

        // 2. Renderiza cada evento
        eventosDoDia.forEach(evento => {
            // -- MUDANÇA: Lógica de Cor Dinâmica --
            let corFundo = '#1a73e8'; // Azul padrão
            
            // Tenta buscar a cor na lista global de categorias
            if (window.obterCorCategoria) {
                corFundo = window.obterCorCategoria(evento.categoria);
            }

            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-item'; // Mantemos a classe base para padding/radius
            
            // Aplica a cor escolhida diretamente no estilo
            eventDiv.style.backgroundColor = corFundo;
            eventDiv.style.color = '#ffffff'; // Texto branco para contraste
            eventDiv.style.textShadow = '0 1px 2px rgba(0,0,0,0.3)'; // Sombra para leitura
            
            // Conteúdo visual do evento
            let conteudoHTML = "";
            if (evento.diaTodo) {
                conteudoHTML = `<strong>${evento.titulo}</strong>`;
            } else {
                conteudoHTML = `<span style="font-size:0.7rem; opacity:0.9; margin-right:4px;">${evento.horaInicio}</span> ${evento.titulo}`;
            }
            eventDiv.innerHTML = conteudoHTML;

            // --- CLICK NO EVENTO (VER DETALHES / EXCLUIR) ---
            eventDiv.addEventListener('click', (e) => {
                e.stopPropagation(); // IMPEDE que o clique passe para o dia
                if (window.abrirModalDetalhes) {
                    window.abrirModalDetalhes(evento.id);
                }
            });

            dayCell.appendChild(eventDiv);
        });

        // --- CLICK NO DIA (CRIAR NOVO) ---
        dayCell.addEventListener('click', () => {
            if (window.abrirModalEvento) {
                window.abrirModalEvento(i, month, year);
            }
        });

        container.appendChild(dayCell);
    }

    // 4. Dias do Próximo mês
    const totalCells = firstDayIndex + daysInMonth;
    const remaining = 42 - totalCells;
    for (let i = 1; i <= remaining; i++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('day-cell', 'other-month');
        dayCell.innerHTML = `<span class="day-number">${i}</span>`;
        container.appendChild(dayCell);
    }
}