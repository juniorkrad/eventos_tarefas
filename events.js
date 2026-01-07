// ATENÇÃO: Mudamos de 'let' para 'window.' para garantir que o calendar.js enxergue os dados
window.globalEventsData = {};
window.globalCategories = []; 

document.addEventListener("DOMContentLoaded", () => {
    carregarEventosDoStorage();
    injetarModalHTML();
    
    // Preenche o dropdown de categorias e a sidebar logo ao iniciar
    atualizarSelectCategorias();
    if (window.renderizarSidebar) window.renderizarSidebar();

    configurarModalListeners();
});

// --- HELPER: Gerar Opções de Horário ---
function gerarOpcoesHorario() {
    let opcoes = '';
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const horaFormatada = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            opcoes += `<option value="${horaFormatada}">${horaFormatada}</option>`;
        }
    }
    return opcoes;
}

// --- HELPER: Formatar Data BR ---
function formatarDataBr(dataISO) {
    if (!dataISO) return '';
    const [y, m, d] = dataISO.split('-');
    return `${d}/${m}/${y}`;
}

// --- GERENCIAMENTO DE DADOS ---

function carregarEventosDoStorage() {
    // 1. Carregar Eventos
    const savedEvents = localStorage.getItem('agenda-2026-data');
    if (savedEvents) {
        window.globalEventsData = JSON.parse(savedEvents);
    }

    // 2. Carregar Categorias
    const savedCats = localStorage.getItem('agenda-2026-categories');
    if (savedCats) {
        window.globalCategories = JSON.parse(savedCats);
    } else {
        // Categorias Padrão
        window.globalCategories = [
            { id: 'plantao', nome: 'Plantão', cor: '#d93025' },
            { id: 'folga', nome: 'Folga', cor: '#188038' },
            { id: 'medico', nome: 'Consulta Médica', cor: '#f9ab00' },
            { id: 'feriado', nome: 'Feriado', cor: '#9334e6' },
            { id: 'default', nome: 'Padrão', cor: '#1a73e8' }
        ];
    }
}

function salvarEventosNoStorage() {
    localStorage.setItem('agenda-2026-data', JSON.stringify(window.globalEventsData));
}

function salvarCategoriasNoStorage() {
    localStorage.setItem('agenda-2026-categories', JSON.stringify(window.globalCategories));
}

window.obterCorCategoria = function(idCategoria) {
    const cat = window.globalCategories.find(c => c.id === idCategoria);
    return cat ? cat.cor : '#1a73e8'; 
};

// --- MODAL E INTERFACE ---

function injetarModalHTML() {
    const opcoesHorario = gerarOpcoesHorario();

    // 1. Modal CRIAÇÃO DE EVENTO
    const modalCriacaoHTML = `
        <div id="event-modal-overlay" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-date-title">Novo Evento</h3>
                </div>
                <div class="modal-body">
                    <label style="display:block; margin-bottom:5px; font-weight:500;">Descrição</label>
                    <input type="text" id="event-input" placeholder="Ex: Plantão, Reunião..." autocomplete="off">

                    <div style="margin: 15px 0; display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" id="event-all-day" style="width:auto; margin:0;">
                        <label for="event-all-day" style="cursor:pointer; font-size:0.95rem;">Evento o dia todo (sem horário)</label>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="font-size:0.85rem; font-weight:bold; color:#5f6368;">Início</label>
                            <input type="date" id="event-start-date" style="margin-bottom:5px;">
                            <select id="event-start-time" style="width:100%; padding:10px; border:1px solid #dadce0; border-radius:4px; background:white;">${opcoesHorario}</select>
                        </div>
                        <div>
                            <label style="font-size:0.85rem; font-weight:bold; color:#5f6368;">Fim</label>
                            <input type="date" id="event-end-date" style="margin-bottom:5px;">
                            <select id="event-end-time" style="width:100%; padding:10px; border:1px solid #dadce0; border-radius:4px; background:white;">${opcoesHorario}</select>
                        </div>
                    </div>
                    
                    <label style="display:block; margin-bottom:5px; font-weight:500;">Categoria</label>
                    <select id="event-category" style="width:100%; padding:10px; border:1px solid #dadce0; border-radius:4px; background:white;"></select>
                    <input type="hidden" id="clicked-date-key">
                </div>
                <div class="modal-footer">
                    <button id="btn-cancelar-modal" class="btn-cancel">Cancelar</button>
                    <button id="btn-salvar-modal" class="btn-save">Salvar</button>
                </div>
            </div>
        </div>
    `;

    // 2. Modal DETALHES DO EVENTO
    const modalDetalhesHTML = `
        <div id="event-details-overlay" class="modal-overlay">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="details-title" style="color: #3c4043;">Detalhes do Evento</h3>
                </div>
                <div class="modal-body" style="padding: 10px 0;">
                    <h2 id="details-desc" style="color: #1a73e8; margin-bottom: 15px;"></h2>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <p><strong>Início:</strong> <span id="details-start"></span></p>
                        <p style="margin-top:5px;"><strong>Fim:</strong> <span id="details-end"></span></p>
                        <p style="margin-top:5px;"><strong>Categoria:</strong> <span id="details-category" style="text-transform:capitalize;"></span></p>
                    </div>
                    <input type="hidden" id="details-id">
                </div>
                <div class="modal-footer" style="justify-content: space-between;">
                    <button id="btn-delete-event" class="btn-delete">
                        <span class="material-icons" style="font-size: 16px; vertical-align: text-bottom;">delete</span> Excluir
                    </button>
                    <button id="btn-close-details" class="btn-cancel">Fechar</button>
                </div>
            </div>
        </div>
    `;

    // 3. Modal CATEGORIA (Com botão Excluir)
    const modalCategoriaHTML = `
        <div id="category-modal-overlay" class="modal-overlay">
            <div class="modal-content" style="max-width: 350px;">
                <div class="modal-header">
                    <h3 id="cat-modal-title">Nova Categoria</h3>
                </div>
                <div class="modal-body">
                    <label style="display:block; margin-bottom:5px; font-weight:500;">Nome da Agenda</label>
                    <input type="text" id="cat-name-input" placeholder="Ex: Academia, Estudos..." autocomplete="off">
                    
                    <label style="display:block; margin-bottom:5px; margin-top:15px; font-weight:500;">Cor da Etiqueta</label>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="color" id="cat-color-input" value="#1a73e8" style="width:50px; height:40px; padding:0; border:none; cursor:pointer;">
                        <span style="font-size:0.85rem; color:#666;">Clique para escolher</span>
                    </div>

                    <input type="hidden" id="cat-id-input">
                </div>
                
                <div class="modal-footer" style="justify-content: space-between;">
                    <button id="btn-delete-cat" class="btn-delete" style="display:none;" title="Excluir Categoria">
                        <span class="material-icons" style="font-size: 18px;">delete</span>
                    </button>
                    
                    <div style="display:flex; gap:10px; margin-left: auto;">
                        <button id="btn-cancel-cat" class="btn-cancel">Cancelar</button>
                        <button id="btn-save-cat" class="btn-save">Criar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalCriacaoHTML + modalDetalhesHTML + modalCategoriaHTML);
}

function atualizarSelectCategorias() {
    const select = document.getElementById('event-category');
    if (!select) return;
    select.innerHTML = ''; 
    window.globalCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.innerText = cat.nome;
        select.appendChild(option);
    });
}

function configurarModalListeners() {
    // Eventos
    document.getElementById('btn-cancelar-modal').addEventListener('click', fecharModalCriacao);
    document.getElementById('btn-salvar-modal').addEventListener('click', salvarEvento);
    document.getElementById('event-modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'event-modal-overlay') fecharModalCriacao();
    });

    // Detalhes
    document.getElementById('btn-close-details').addEventListener('click', fecharModalDetalhes);
    document.getElementById('btn-delete-event').addEventListener('click', excluirEventoAtual);
    document.getElementById('event-details-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'event-details-overlay') fecharModalDetalhes();
    });

    // Categoria
    document.getElementById('btn-cancel-cat').addEventListener('click', fecharModalCategoria);
    document.getElementById('btn-save-cat').addEventListener('click', salvarNovaCategoria);
    document.getElementById('btn-delete-cat').addEventListener('click', excluirCategoriaAtual); // Listener para excluir categoria
    document.getElementById('category-modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'category-modal-overlay') fecharModalCategoria();
    });

    // Checkbox UI
    const chkAllDay = document.getElementById('event-all-day');
    const startSelect = document.getElementById('event-start-time');
    const endSelect = document.getElementById('event-end-time');
    chkAllDay.addEventListener('change', (e) => {
        if (e.target.checked) {
            startSelect.disabled = true; endSelect.disabled = true;
            startSelect.style.opacity = "0.5"; endSelect.style.opacity = "0.5";
        } else {
            startSelect.disabled = false; endSelect.disabled = false;
            startSelect.style.opacity = "1"; endSelect.style.opacity = "1";
        }
    });
}

// --- ABERTURA DE MODAIS ---

window.abrirModalEvento = function(day, month, year) {
    const modal = document.getElementById('event-modal-overlay');
    const formattedDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    document.getElementById('modal-date-title').innerText = `Novo Evento`;
    document.getElementById('clicked-date-key').value = formattedDate;
    document.getElementById('event-input').value = "";
    document.getElementById('event-all-day').checked = false;
    document.getElementById('event-start-date').value = formattedDate;
    document.getElementById('event-end-date').value = formattedDate;

    const startSelect = document.getElementById('event-start-time');
    const endSelect = document.getElementById('event-end-time');
    startSelect.value = "08:00"; endSelect.value = "09:00";
    startSelect.disabled = false; endSelect.disabled = false;
    startSelect.style.opacity = "1"; endSelect.style.opacity = "1";

    atualizarSelectCategorias();
    document.getElementById('event-input').focus();
    modal.classList.add('open');
};

window.abrirModalDetalhes = function(eventoId) {
    let eventoEncontrado = null;
    Object.values(window.globalEventsData).forEach(lista => {
        const found = lista.find(ev => ev.id === eventoId);
        if (found) eventoEncontrado = found;
    });

    if (!eventoEncontrado) return;
    const modal = document.getElementById('event-details-overlay');
    
    document.getElementById('details-desc').innerText = eventoEncontrado.titulo;
    const catObj = window.globalCategories.find(c => c.id === eventoEncontrado.categoria);
    document.getElementById('details-category').innerText = catObj ? catObj.nome : "(Categoria Removida)";
    document.getElementById('details-id').value = eventoEncontrado.id;

    const dataInicioBR = formatarDataBr(eventoEncontrado.inicio);
    const dataFimBR = formatarDataBr(eventoEncontrado.fim);
    
    if (eventoEncontrado.diaTodo) {
        document.getElementById('details-start').innerText = `${dataInicioBR} (Dia Todo)`;
        document.getElementById('details-end').innerText = `${dataFimBR} (Dia Todo)`;
    } else {
        document.getElementById('details-start').innerText = `${dataInicioBR} às ${eventoEncontrado.horaInicio}`;
        document.getElementById('details-end').innerText = `${dataFimBR} às ${eventoEncontrado.horaFim}`;
    }
    modal.classList.add('open');
}

// Abrir Modal de Categoria (Criação ou Edição)
window.abrirModalCategoria = function(idCategoria) {
    const modal = document.getElementById('category-modal-overlay');
    const nameInput = document.getElementById('cat-name-input');
    const colorInput = document.getElementById('cat-color-input');
    const idInput = document.getElementById('cat-id-input');
    const title = document.getElementById('cat-modal-title');
    const btnDelete = document.getElementById('btn-delete-cat'); // Botão de excluir

    if (idCategoria) {
        // MODO EDIÇÃO
        const cat = window.globalCategories.find(c => c.id === idCategoria);
        if (cat) {
            nameInput.value = cat.nome;
            colorInput.value = cat.cor;
            idInput.value = cat.id;
            title.innerText = "Editar Categoria";
            document.getElementById('btn-save-cat').innerText = "Salvar";
            
            // MOSTRA O BOTÃO EXCLUIR
            btnDelete.style.display = "flex"; 
        }
    } else {
        // MODO CRIAÇÃO
        nameInput.value = "";
        colorInput.value = "#1a73e8";
        idInput.value = "";
        title.innerText = "Nova Categoria";
        document.getElementById('btn-save-cat').innerText = "Criar";
        
        // ESCONDE O BOTÃO EXCLUIR
        btnDelete.style.display = "none";
    }
    modal.classList.add('open');
}

// --- FECHAMENTO ---
function fecharModalCriacao() { document.getElementById('event-modal-overlay').classList.remove('open'); }
function fecharModalDetalhes() { document.getElementById('event-details-overlay').classList.remove('open'); }
function fecharModalCategoria() { document.getElementById('category-modal-overlay').classList.remove('open'); }

// --- SALVAR EVENTO ---
function salvarEvento() {
    const desc = document.getElementById('event-input').value.trim();
    const categoria = document.getElementById('event-category').value;
    const allDay = document.getElementById('event-all-day').checked;
    const startDate = document.getElementById('event-start-date').value;
    const startTime = document.getElementById('event-start-time').value;
    const endDate = document.getElementById('event-end-date').value;
    const endTime = document.getElementById('event-end-time').value;

    if (!desc) { alert("Digite a descrição."); return; }
    if (!startDate || !endDate) { alert("Datas obrigatórias."); return; }
    if (endDate < startDate) { alert("Data fim menor que início."); return; }

    const novoEvento = {
        id: Date.now(),
        titulo: desc,
        categoria: categoria,
        diaTodo: allDay,
        inicio: startDate,
        fim: endDate,
        horaInicio: allDay ? null : startTime,
        horaFim: allDay ? null : endTime
    };

    const [y, m, d] = startDate.split('-');
    const storageKey = `${parseInt(y)}-${parseInt(m)-1}-${parseInt(d)}`;

    if (!window.globalEventsData[storageKey]) window.globalEventsData[storageKey] = [];
    window.globalEventsData[storageKey].push(novoEvento);

    salvarEventosNoStorage();
    fecharModalCriacao();
    document.dispatchEvent(new Event('calendar-refresh-needed'));
}

// --- SALVAR CATEGORIA ---
function salvarNovaCategoria() {
    const nome = document.getElementById('cat-name-input').value.trim();
    const cor = document.getElementById('cat-color-input').value;
    const idExistente = document.getElementById('cat-id-input').value;

    if (!nome) { alert("Dê um nome para a categoria."); return; }

    if (idExistente) {
        const catIndex = window.globalCategories.findIndex(c => c.id === idExistente);
        if (catIndex > -1) {
            window.globalCategories[catIndex].nome = nome;
            window.globalCategories[catIndex].cor = cor;
        }
    } else {
        const novaCat = {
            id: 'cat_' + Date.now(),
            nome: nome,
            cor: cor
        };
        window.globalCategories.push(novaCat);
    }

    salvarCategoriasNoStorage();
    if (window.renderizarSidebar) window.renderizarSidebar();
    atualizarSelectCategorias();
    fecharModalCategoria();
    document.dispatchEvent(new Event('calendar-refresh-needed'));
}

// --- EXCLUIR EVENTO ---
function excluirEventoAtual() {
    const idParaExcluir = parseInt(document.getElementById('details-id').value);
    if (confirm("Tem certeza que deseja excluir este evento?")) {
        let eventoDeletado = false;
        Object.keys(window.globalEventsData).forEach(key => {
            const tamanhoOriginal = window.globalEventsData[key].length;
            window.globalEventsData[key] = window.globalEventsData[key].filter(ev => ev.id !== idParaExcluir);
            if (window.globalEventsData[key].length < tamanhoOriginal) eventoDeletado = true;
        });

        if (eventoDeletado) {
            salvarEventosNoStorage();
            fecharModalDetalhes();
            document.dispatchEvent(new Event('calendar-refresh-needed'));
        }
    }
}

// --- EXCLUIR CATEGORIA (NOVO) ---
function excluirCategoriaAtual() {
    const idParaExcluir = document.getElementById('cat-id-input').value;
    
    if (!idParaExcluir) return;

    if (confirm("Tem certeza que deseja excluir esta categoria? Os eventos antigos permanecerão, mas perderão a cor.")) {
        // Remove da lista global
        window.globalCategories = window.globalCategories.filter(c => c.id !== idParaExcluir);
        
        salvarCategoriasNoStorage();
        if (window.renderizarSidebar) window.renderizarSidebar();
        atualizarSelectCategorias();
        fecharModalCategoria();
        
        // Atualiza o calendário para remover a cor dos eventos dessa categoria
        document.dispatchEvent(new Event('calendar-refresh-needed'));
    }
}