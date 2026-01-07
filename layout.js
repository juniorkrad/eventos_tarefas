document.addEventListener("DOMContentLoaded", () => {
    carregarLayout();
    
    // Tenta renderizar a sidebar logo de cara
    if (window.renderizarSidebar) window.renderizarSidebar();
});

function carregarLayout() {
    const header = document.getElementById('main-header');
    const footer = document.getElementById('main-footer');
    const sidebar = document.getElementById('main-sidebar');

    // --- 1. CABEÇALHO ---
    if (header) {
        header.innerHTML = `
            <div class="app-header">
                <div class="header-left" style="display: flex; align-items: center; gap: 15px;">
                    <button id="menu-toggle" style="background:none; border:none; cursor:pointer;">
                        <span class="material-icons" style="color:#5f6368; font-size: 24px;">menu</span>
                    </button>

                    <a href="index.html" class="logo" style="text-decoration: none; color: inherit; cursor: pointer;">
                        <span class="material-icons" style="color:#1a73e8;">event</span>
                        Minha Agenda 2026
                    </a>
                </div>
                <nav>
                    <span style="font-size: 0.9rem;">Olá, Usuário</span>
                </nav>
            </div>
        `;
    }

    // --- 2. SIDEBAR (Estrutura Base) ---
    if (sidebar) {
        sidebar.innerHTML = `
            <div class="sidebar-wrapper">
                <div class="sidebar-section">
                    <button id="btn-create-category" class="btn-create-event">
                        <span class="material-icons" style="color: #ea4335;">add</span> <span style="font-weight:bold;">Criar</span>
                    </button>
                </div>
                
                <div class="sidebar-section">
                    <h4>Minhas Agendas</h4>
                    <ul id="sidebar-agendas-list" class="agenda-list">
                        <li style="color:#999; font-size:0.8rem;">Carregando...</li>
                    </ul>
                </div>

                <div class="sidebar-section">
                    <h4>Outros</h4>
                    <ul class="agenda-list">
                        <li>
                            <input type="checkbox" id="chk-feriados" disabled checked>
                            <label for="chk-feriados">Feriados (Em breve)</label>
                        </li>
                    </ul>
                </div>
            </div>
        `;

        // Lógica do Menu Retrátil
        const btnToggle = document.getElementById('menu-toggle');
        if (btnToggle) {
            btnToggle.addEventListener('click', () => {
                document.body.classList.toggle('sidebar-collapsed');
            });
        }

        // Lógica do Botão CRIAR (Abre modal de categoria vazio)
        const btnCreate = document.getElementById('btn-create-category');
        if (btnCreate) {
            btnCreate.addEventListener('click', () => {
                if (window.abrirModalCategoria) {
                    window.abrirModalCategoria(); // Sem ID = Criar Novo
                } else {
                    console.warn("Função abrirModalCategoria ainda não existe no events.js");
                }
            });
        }
    }

    // --- 3. RODAPÉ ---
    if (footer) {
        footer.innerHTML = `
            <div class="app-footer">
                &copy; 2026 Projeto Agenda - Desenvolvido com HTML, CSS e JS.
            </div>
        `;
    }
}

// --- FUNÇÃO GLOBAL PARA ATUALIZAR A LISTA DA SIDEBAR ---
window.renderizarSidebar = function() {
    const listaContainer = document.getElementById('sidebar-agendas-list');
    if (!listaContainer) return;

    // Se globalCategories ainda não existe, usa um padrão ou espera
    const categorias = window.globalCategories || [];

    listaContainer.innerHTML = ''; // Limpa a lista atual

    categorias.forEach(cat => {
        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.style.justifyContent = 'space-between'; // Separa texto do botão editar
        li.style.marginBottom = '8px';
        li.className = 'category-item-li'; // Classe para CSS futuro se precisar

        // --- LADO ESQUERDO (Checkbox + Bolinha + Nome) ---
        const leftDiv = document.createElement('div');
        leftDiv.style.display = 'flex';
        leftDiv.style.alignItems = 'center';
        leftDiv.style.gap = '10px';

        // Checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.style.accentColor = cat.cor;

        // Bolinha de Cor
        const colorDot = document.createElement('span');
        colorDot.style.width = '12px';
        colorDot.style.height = '12px';
        colorDot.style.borderRadius = '50%';
        colorDot.style.backgroundColor = cat.cor;
        colorDot.style.display = 'inline-block';

        // Nome da Categoria
        const label = document.createElement('span');
        label.innerText = cat.nome;
        label.style.fontSize = '0.9rem';

        leftDiv.appendChild(checkbox);
        leftDiv.appendChild(colorDot);
        leftDiv.appendChild(label);

        // --- LADO DIREITO (Botão Editar) ---
        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn-edit-category'; // Vamos estilizar no CSS
        btnEdit.innerHTML = '<span class="material-icons" style="font-size: 16px;">edit</span>';
        
        // Estilos inline básicos para garantir funcionamento imediato
        btnEdit.style.background = 'none';
        btnEdit.style.border = 'none';
        btnEdit.style.cursor = 'pointer';
        btnEdit.style.color = '#5f6368';
        btnEdit.style.padding = '4px';
        btnEdit.style.display = 'flex';
        btnEdit.title = "Editar Categoria";

        // Evento de Editar
        btnEdit.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita clicar no li se houver
            if (window.abrirModalCategoria) {
                window.abrirModalCategoria(cat.id); // Passa o ID para editar
            }
        });

        // Montagem do Item
        li.appendChild(leftDiv);
        li.appendChild(btnEdit);

        listaContainer.appendChild(li);
    });
};