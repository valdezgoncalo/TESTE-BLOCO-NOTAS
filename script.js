// ========== DATABASE ==========
let db = {
    games: [],
    currentGame: null,
    profile: {
        photo: null,
        teamName: '',
        coachName: ''
    },
    athletes: [],
    theme: 'dark'
};

// ========== MODALS STATE ==========
let currentNoteCategory = null;
let currentNoteSubcategory = null;
let noteImageData = null;
let currentAthleteId = null;

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initEventListeners();
    applyTheme();
    updateUI();
});

// ========== LOAD/SAVE DATA ==========
function loadData() {
    const saved = localStorage.getItem('tacticalHub_v2');
    if (saved) {
        db = JSON.parse(saved);
    }
}

function saveData() {
    localStorage.setItem('tacticalHub_v2', JSON.stringify(db));
}

// ========== EVENT LISTENERS ==========
function initEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Accent color
    document.getElementById('accentColor').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--primary-color', e.target.value);
    });
    
    // Backup
    document.getElementById('backupBtn').addEventListener('click', exportBackup);
    
    // New game
    document.getElementById('newGameBtn').addEventListener('click', () => {
        openModal('newGameModal');
    });
    
    document.getElementById('createGameBtn').addEventListener('click', createNewGame);
    document.getElementById('cancelGameBtn').addEventListener('click', () => {
        closeModal('newGameModal');
    });
    
    // Game select
    document.getElementById('gameSelect').addEventListener('change', (e) => {
        loadGame(e.target.value);
    });
    
    // Delete game
    document.getElementById('deleteGameBtn').addEventListener('click', deleteCurrentGame);
    
    // Export PDF
    document.getElementById('exportPdfBtn').addEventListener('click', exportPDF);
    
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Profile
    document.getElementById('profileUpload').addEventListener('change', handleProfileUpload);
    document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
    
    // Athletes
    document.getElementById('addAthleteBtn').addEventListener('click', () => {
        openModal('athleteModal');
    });

    document.getElementById('athleteSearch').addEventListener('input', renderAthletes);
    
    document.getElementById('saveAthleteBtn').addEventListener('click', saveAthlete);
    document.getElementById('cancelAthleteBtn').addEventListener('click', () => {
        closeModal('athleteModal');
    });
    
    // Add note buttons
    document.querySelectorAll('.add-note-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentNoteCategory = btn.dataset.category;
            currentNoteSubcategory = btn.dataset.subcategory;
            openNoteModal();
        });
    });
    
    // Note modal
    document.getElementById('saveNoteBtn').addEventListener('click', saveNote);
    document.getElementById('cancelNoteBtn').addEventListener('click', () => {
        closeModal('noteModal');
    });
    
    // Note image upload
    document.getElementById('noteImage').addEventListener('change', handleNoteImageUpload);

    // Athlete note modal
    document.getElementById('saveAthleteNoteBtn').addEventListener('click', saveAthleteNote);
    document.getElementById('cancelAthleteNoteBtn').addEventListener('click', () => {
        closeModal('athleteNoteModal');
    });
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            closeModal(e.target.closest('.modal').id);
        });
    });
    
    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// ========== THEME ==========
function toggleTheme() {
    db.theme = db.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveData();
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', db.theme);
}

// ========== GAMES ==========
function createNewGame() {
    const name = document.getElementById('newGameName').value.trim();
    const date = document.getElementById('newGameDate').value;
    
    if (!name) {
        alert('Por favor, insira o nome do jogo!');
        return;
    }
    
    const game = {
        id: Date.now(),
        name,
        date: date || new Date().toISOString().split('T')[0],
        notes: [],
        profile: {
            teamName: '',
            coachName: '',
            opponentName: '',
            competitionName: '',
            gameLocation: '',
            formation: '',
            gameName: name,
            gameDate: date,
            gameNotes: ''
        }
    };
    
    db.games.push(game);
    db.currentGame = game.id;
    saveData();
    updateGamesList();
    loadGame(game.id);
    closeModal('newGameModal');
    
    // Reset form
    document.getElementById('newGameName').value = '';
    document.getElementById('newGameDate').value = '';
}

function loadGame(gameId) {
    const game = db.games.find(g => g.id == gameId);
    if (!game) return;
    
    db.currentGame = gameId;
    saveData();
    
    // Load profile
    document.getElementById('teamName').value = game.profile.teamName || '';
    document.getElementById('coachName').value = game.profile.coachName || '';
    document.getElementById('opponentName').value = game.profile.opponentName || '';
    document.getElementById('competitionName').value = game.profile.competitionName || '';
    document.getElementById('gameLocation').value = game.profile.gameLocation || '';
    document.getElementById('formation').value = game.profile.formation || '';
    document.getElementById('gameName').value = game.profile.gameName || '';
    document.getElementById('gameDate').value = game.profile.gameDate || '';
    document.getElementById('gameNotes').value = game.profile.gameNotes || '';
    
    // Update game select
    document.getElementById('gameSelect').value = gameId;
    
    renderAllNotes();
    updateSummary();
}

function deleteCurrentGame() {
    if (!db.currentGame) {
        alert('Nenhum jogo selecionado!');
        return;
    }
    
    if (!confirm('Tem a certeza que deseja apagar este jogo?')) {
        return;
    }
    
    db.games = db.games.filter(g => g.id !== db.currentGame);
    db.currentGame = null;
    saveData();
    updateGamesList();
    clearCurrentGameUI();
}

function clearCurrentGameUI() {
    document.getElementById('teamName').value = '';
    document.getElementById('coachName').value = '';
    document.getElementById('opponentName').value = '';
    document.getElementById('competitionName').value = '';
    document.getElementById('gameLocation').value = '';
    document.getElementById('formation').value = '';
    document.getElementById('gameName').value = '';
    document.getElementById('gameDate').value = '';
    document.getElementById('gameNotes').value = '';
    document.querySelectorAll('.notes-list').forEach(list => list.innerHTML = '');
    updateSummary();
}

function updateGamesList() {
    const select = document.getElementById('gameSelect');
    select.innerHTML = '<option value="">Selecione um jogo...</option>';
    
    db.games.forEach(game => {
        const option = document.createElement('option');
        option.value = game.id;
        option.textContent = `${game.name} - ${game.date}`;
        select.appendChild(option);
    });
    
    if (db.currentGame) {
        select.value = db.currentGame;
    }
}

// ========== PROFILE ==========
function handleProfileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        db.profile.photo = event.target.result;
        document.getElementById('profileImg').src = event.target.result;
        saveData();
    };
    reader.readAsDataURL(file);
}

function saveProfile() {
    const game = getCurrentGame();
    if (!game) {
        alert('Nenhum jogo selecionado!');
        return;
    }
    
    game.profile = {
        teamName: document.getElementById('teamName').value,
        coachName: document.getElementById('coachName').value,
        opponentName: document.getElementById('opponentName').value,
        competitionName: document.getElementById('competitionName').value,
        gameLocation: document.getElementById('gameLocation').value,
        formation: document.getElementById('formation').value,
        gameName: document.getElementById('gameName').value,
        gameDate: document.getElementById('gameDate').value,
        gameNotes: document.getElementById('gameNotes').value
    };
    
    saveData();
    updateSummary();
    alert('✅ Perfil guardado!');
}

// ========== ATHLETES ==========
function saveAthlete() {
    const name = document.getElementById('athleteName').value.trim();
    const number = document.getElementById('athleteNumber').value;
    const position = document.getElementById('athletePosition').value.trim();
    
    if (!name) {
        alert('Por favor, insira o nome da atleta!');
        return;
    }
    
    const athlete = {
        id: Date.now(),
        name,
        number: number || '',
        position: position || '',
        notes: []
    };
    
    db.athletes.push(athlete);
    saveData();
    renderAthletes();
    closeModal('athleteModal');
    
    // Reset form
    document.getElementById('athleteName').value = '';
    document.getElementById('athleteNumber').value = '';
    document.getElementById('athletePosition').value = '';
}

function renderAthletes() {
    const container = document.getElementById('athletesList');
    container.innerHTML = '';

    const searchTerm = document.getElementById('athleteSearch').value.trim().toLowerCase();
    const athletes = db.athletes.filter(athlete =>
        athlete.name.toLowerCase().includes(searchTerm) ||
        (athlete.number && athlete.number.toString().includes(searchTerm)) ||
        (athlete.position && athlete.position.toLowerCase().includes(searchTerm))
    );
    
    if (db.athletes.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:40px;">Nenhuma atleta registada</p>';
        return;
    }

    if (athletes.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:40px;">Nenhuma atleta encontrada</p>';
        return;
    }
    
    athletes.forEach(athlete => {
        const card = document.createElement('div');
        card.className = 'athlete-card';
        
        const notesCount = athlete.notes ? athlete.notes.length : 0;

        card.innerHTML = `
            <div style="width:80px; height:80px; border-radius:50%; background:var(--primary-color); display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:900; color:#000; margin:0 auto 12px;">
                ${athlete.name.charAt(0).toUpperCase()}
            </div>
            <h3>${athlete.name}</h3>
            ${athlete.number ? `<div class="athlete-number">#${athlete.number}</div>` : ''}
            ${athlete.position ? `<div class="athlete-position">${athlete.position}</div>` : ''}
            <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px;">
                <button class="btn btn-secondary btn-small" onclick="openAthleteNoteModal(${athlete.id})">📝 Nova Nota</button>
                <button class="btn btn-secondary btn-small" onclick="exportAthleteNotes(${athlete.id})">📄 Exportar (${notesCount})</button>
                <button class="btn btn-danger btn-small" onclick="deleteAthlete(${athlete.id})">🗑️ Remover</button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function deleteAthlete(id) {
    if (!confirm('Remover esta atleta?')) return;
    
    db.athletes = db.athletes.filter(a => a.id !== id);
    saveData();
    renderAthletes();
}

function openAthleteNoteModal(athleteId) {
    currentAthleteId = athleteId;
    document.getElementById('athleteNoteMinute').value = '';
    document.getElementById('athleteNoteText').value = '';
    openModal('athleteNoteModal');
}

function saveAthleteNote() {
    if (!currentAthleteId) return;

    const athlete = db.athletes.find(a => a.id === currentAthleteId);
    if (!athlete) return;

    const text = document.getElementById('athleteNoteText').value.trim();
    const minute = parseInt(document.getElementById('athleteNoteMinute').value) || 0;

    if (!text) {
        alert('Por favor, escreva uma nota para a atleta!');
        return;
    }

    const note = {
        id: Date.now(),
        minute,
        text,
        timestamp: new Date().toISOString()
    };

    if (!athlete.notes) athlete.notes = [];
    athlete.notes.push(note);

    saveData();
    renderAthletes();
    closeModal('athleteNoteModal');
}

function exportAthleteNotes(athleteId) {
    const athlete = db.athletes.find(a => a.id === athleteId);
    if (!athlete) return;

    if (!athlete.notes || athlete.notes.length === 0) {
        alert('Esta atleta não tem notas para exportar.');
        return;
    }

    if (typeof window.jspdf === 'undefined') {
        alert('Erro: Biblioteca PDF não carregada. Por favor, recarregue a página.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    let yPos = 20;
    const pageHeight = 297;
    const margin = 20;

    const checkNewPage = (neededSpace = 20) => {
        if (yPos + neededSpace > pageHeight - margin) {
            pdf.addPage();
            yPos = 20;
            return true;
        }
        return false;
    };

    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 255, 136);
    pdf.text('NOTAS DA ATLETA', 105, yPos, { align: 'center' });

    yPos += 12;
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(athlete.name, 105, yPos, { align: 'center' });

    yPos += 6;
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    const meta = [
        athlete.position ? `Posição: ${athlete.position}` : null,
        athlete.number ? `Número: #${athlete.number}` : null
    ].filter(Boolean).join(' | ');
    if (meta) {
        pdf.text(meta, 105, yPos, { align: 'center' });
        yPos += 8;
    } else {
        yPos += 4;
    }

    pdf.setDrawColor(0, 255, 136);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, 210 - margin, yPos);
    yPos += 8;

    athlete.notes
        .slice()
        .sort((a, b) => a.minute - b.minute)
        .forEach((note) => {
            checkNewPage(20);
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${note.minute}'`, margin, yPos);

            pdf.setFont(undefined, 'normal');
            const lines = pdf.splitTextToSize(note.text, 170);
            yPos += 6;
            lines.forEach(line => {
                checkNewPage();
                pdf.text(line, margin, yPos);
                yPos += 5;
            });

            yPos += 3;
            pdf.setDrawColor(220, 220, 220);
            pdf.line(margin, yPos, 210 - margin, yPos);
            yPos += 6;
        });

    const fileName = `Notas_${athlete.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    alert('✅ PDF das notas da atleta gerado!');
}

// ========== NOTES ==========
function openNoteModal() {
    if (!db.currentGame) {
        alert('Por favor, crie ou selecione um jogo primeiro!');
        return;
    }
    
    document.getElementById('noteMinute').value = '';
    document.getElementById('noteText').value = '';
    document.getElementById('noteVideoLink').value = '';
    document.getElementById('mediaPreview').innerHTML = '';
    noteImageData = null;
    
    openModal('noteModal');
}

function handleNoteImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        noteImageData = event.target.result;
        
        const preview = document.getElementById('mediaPreview');
        preview.innerHTML = `
            <div class="media-preview-item">
                <img src="${noteImageData}" alt="Preview">
                <button class="media-preview-remove" onclick="removeNoteImage()">×</button>
            </div>
        `;
    };
    reader.readAsDataURL(file);
}

function removeNoteImage() {
    noteImageData = null;
    document.getElementById('mediaPreview').innerHTML = '';
    document.getElementById('noteImage').value = '';
}

function saveNote() {
    const game = getCurrentGame();
    if (!game) return;
    
    const text = document.getElementById('noteText').value.trim();
    const videoLink = document.getElementById('noteVideoLink').value.trim();
    const minute = parseInt(document.getElementById('noteMinute').value) || 0;
    
    if (!text && !noteImageData && !videoLink) {
        alert('Por favor, adicione pelo menos uma observação, imagem ou vídeo!');
        return;
    }
    
    const note = {
        id: Date.now(),
        category: currentNoteCategory,
        subcategory: currentNoteSubcategory,
        minute: minute,
        text: text,
        image: noteImageData,
        videoLink: videoLink,
        timestamp: new Date().toISOString()
    };
    
    if (!game.notes) game.notes = [];
    game.notes.push(note);
    
    saveData();
    renderNotes(currentNoteCategory, currentNoteSubcategory);
    updateSummary();
    closeModal('noteModal');
}

function deleteNote(noteId) {
    if (!confirm('Apagar esta nota?')) return;
    
    const game = getCurrentGame();
    if (!game) return;
    
    game.notes = game.notes.filter(n => n.id !== noteId);
    saveData();
    renderAllNotes();
    updateSummary();
}

function renderNotes(category, subcategory) {
    const game = getCurrentGame();
    if (!game) return;
    
    const container = document.querySelector(`[data-category="${category}"][data-subcategory="${subcategory}"]`);
    if (!container) return;
    
    const notes = game.notes.filter(n => n.category === category && n.subcategory === subcategory);
    
    container.innerHTML = '';
    
    if (notes.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px; font-size:13px;">Nenhuma nota adicionada</p>';
        return;
    }
    
    notes.forEach(note => {
        const noteEl = document.createElement('div');
        noteEl.className = 'note-item';
        
        let mediaHTML = '';
        if (note.image || note.videoLink) {
            mediaHTML = '<div class="note-media">';
            
            if (note.image) {
                mediaHTML += `<img src="${note.image}" alt="Anexo" onclick="window.open('${note.image}', '_blank')">`;
            }
            
            if (note.videoLink) {
                mediaHTML += `<a href="${note.videoLink}" target="_blank" class="note-video-link">🎬 Ver Vídeo</a>`;
            }
            
            mediaHTML += '</div>';
        }
        
        noteEl.innerHTML = `
            <div class="note-header">
                <span class="note-minute">${note.minute}'</span>
            </div>
            <div class="note-text">${note.text || '<em style="color:var(--text-secondary)">Sem texto</em>'}</div>
            ${mediaHTML}
            <button class="note-delete" onclick="deleteNote(${note.id})">×</button>
        `;
        
        container.appendChild(noteEl);
    });
}

function renderAllNotes() {
    const game = getCurrentGame();
    if (!game) return;
    
    document.querySelectorAll('.notes-list').forEach(container => {
        const category = container.dataset.category;
        const subcategory = container.dataset.subcategory;
        renderNotes(category, subcategory);
    });
}

function getCurrentGame() {
    return db.games.find(g => g.id === db.currentGame);
}

// ========== TABS ==========
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelector(`[data-content="${tabName}"]`).classList.add('active');
}

// ========== MODALS ==========
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ========== EXPORT ==========
function exportBackup() {
    const dataStr = JSON.stringify(db, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_tactical_hub_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

function exportPDF() {
    const game = getCurrentGame();
    
    if (!game) {
        alert('Por favor, selecione um jogo primeiro!');
        return;
    }
    
    if (!game.notes || game.notes.length === 0) {
        alert('Não há notas para exportar!');
        return;
    }
    
    // Verificar se jsPDF está disponível
    if (typeof window.jspdf === 'undefined') {
        alert('Erro: Biblioteca PDF não carregada. Por favor, recarregue a página.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    let yPos = 20;
    const pageHeight = 297;
    const margin = 20;
    const lineHeight = 7;
    
    // Função para adicionar nova página se necessário
    const checkNewPage = (neededSpace = 20) => {
        if (yPos + neededSpace > pageHeight - margin) {
            pdf.addPage();
            yPos = 20;
            return true;
        }
        return false;
    };
    
    // CABEÇALHO
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(0, 255, 136);
    pdf.text('⚽ ANÁLISE TÁTICA', 105, yPos, { align: 'center' });
    
    yPos += 12;
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(game.name || 'Jogo sem nome', 105, yPos, { align: 'center' });
    
    yPos += 8;
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(game.date || new Date().toLocaleDateString('pt-PT'), 105, yPos, { align: 'center' });
    
    // Linha separadora
    yPos += 8;
    pdf.setDrawColor(0, 255, 136);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPos, 210 - margin, yPos);
    
    yPos += 10;
    
    // INFORMAÇÕES DO PERFIL
    if (game.profile && (game.profile.teamName || game.profile.coachName || game.profile.opponentName || game.profile.competitionName || game.profile.gameLocation || game.profile.formation)) {
        checkNewPage();
        
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('INFORMAÇÕES', margin, yPos);
        yPos += 7;
        
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'normal');
        
        if (game.profile.teamName) {
            pdf.text(`Equipa: ${game.profile.teamName}`, margin, yPos);
            yPos += 6;
        }
        
        if (game.profile.coachName) {
            pdf.text(`Treinador: ${game.profile.coachName}`, margin, yPos);
            yPos += 6;
        }

        if (game.profile.opponentName) {
            pdf.text(`Adversário: ${game.profile.opponentName}`, margin, yPos);
            yPos += 6;
        }

        if (game.profile.competitionName) {
            pdf.text(`Competição: ${game.profile.competitionName}`, margin, yPos);
            yPos += 6;
        }

        if (game.profile.gameLocation) {
            pdf.text(`Local: ${game.profile.gameLocation}`, margin, yPos);
            yPos += 6;
        }

        if (game.profile.formation) {
            pdf.text(`Formação: ${game.profile.formation}`, margin, yPos);
            yPos += 6;
        }
        
        yPos += 5;
    }
    
    // ORGANIZAR NOTAS POR CATEGORIA
    const categories = {
        'org-def': '🛡️ ORGANIZAÇÃO DEFENSIVA',
        'trans-def': '⚡ TRANSIÇÃO DEFENSIVA',
        'org-of': '⚔️ ORGANIZAÇÃO OFENSIVA',
        'trans-of': '🚀 TRANSIÇÃO OFENSIVA',
        'bolas': '⚽ BOLAS PARADAS'
    };
    
    const subcategories = {
        'bloco-alto': 'Bloco Alto / Pressão',
        'bloco-medio': 'Bloco Médio / Baixo',
        'reacao-perda': 'Reação à Perda',
        'recuo-critico': 'Recuo Crítico',
        'construcao': 'Construção',
        'criacao': 'Criação',
        'transicao': 'Transição Ofensiva',
        'ofensivas': 'Ofensivas',
        'defensivas': 'Defensivas'
    };
    
    // Agrupar notas
    const notesByCategory = {};
    game.notes.forEach(note => {
        const key = `${note.category}-${note.subcategory}`;
        if (!notesByCategory[key]) {
            notesByCategory[key] = [];
        }
        notesByCategory[key].push(note);
    });
    
    // Renderizar notas por categoria
    Object.keys(notesByCategory).forEach(key => {
        const notes = notesByCategory[key];
        const [category, subcategory] = key.split('-').slice(0, 2);
        const fullSubcategory = key.split('-').slice(1).join('-');
        
        checkNewPage(30);
        
        // Título da categoria
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(0, 255, 136);
        pdf.text(categories[category] || category, margin, yPos);
        yPos += 7;
        
        // Subtítulo
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text(subcategories[fullSubcategory] || fullSubcategory, margin, yPos);
        yPos += 8;
        
        // Notas
        notes.sort((a, b) => a.minute - b.minute).forEach((note) => {
            checkNewPage(25);
            
            // Minuto
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${note.minute}'`, margin + 5, yPos);
            yPos += 6;
            
            // Texto da nota
            pdf.setTextColor(0, 0, 0);
            pdf.setFont(undefined, 'normal');
            
            if (note.text) {
                const textLines = pdf.splitTextToSize(note.text, 170);
                textLines.forEach(line => {
                    checkNewPage();
                    pdf.text(line, margin + 5, yPos);
                    yPos += 5;
                });
            }
            
            // Indicar anexos
            if (note.image) {
                pdf.setTextColor(100, 100, 100);
                pdf.setFontSize(9);
                pdf.text('📷 Imagem anexada', margin + 5, yPos);
                yPos += 5;
            }
            
            if (note.videoLink) {
                pdf.setTextColor(100, 100, 100);
                pdf.setFontSize(9);
                pdf.text(`🎬 Vídeo: ${note.videoLink.substring(0, 40)}...`, margin + 5, yPos);
                yPos += 5;
            }
            
            yPos += 3;
            
            // Linha separadora entre notas
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.1);
            pdf.line(margin, yPos, 210 - margin, yPos);
            yPos += 5;
        });
        
        yPos += 5;
    });
    
    // RODAPÉ (última página)
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.text(
            `Gerado em: ${new Date().toLocaleDateString('pt-PT')} - Página ${i}/${totalPages}`,
            105,
            pageHeight - 10,
            { align: 'center' }
        );
        pdf.text('Análise Tática Hub PRO v2.0', 105, pageHeight - 5, { align: 'center' });
    }
    
    // Salvar PDF
    const fileName = `Analise_${game.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    alert('✅ PDF gerado com sucesso!');
}

// ========== UPDATE UI ==========
function updateUI() {
    updateGamesList();
    renderAthletes();
    
    if (db.currentGame) {
        loadGame(db.currentGame);
    }
    
    if (db.profile.photo) {
        document.getElementById('profileImg').src = db.profile.photo;
    }

    updateSummary();
}

function updateSummary() {
    const game = getCurrentGame();
    const summaryTotal = document.getElementById('summaryTotal');
    const summaryGameName = document.getElementById('summaryGameName');

    if (!game) {
        summaryTotal.textContent = '0';
        summaryGameName.textContent = 'Selecione um jogo para ver o resumo.';
        return;
    }

    const notes = game.notes || [];

    summaryTotal.textContent = notes.length;
    summaryGameName.textContent = game.name ? `Resumo de ${game.name}` : 'Resumo do jogo selecionado';
}
