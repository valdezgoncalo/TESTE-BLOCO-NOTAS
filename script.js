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

// ========== TIMER ==========
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;

// ========== MODALS STATE ==========
let currentNoteCategory = null;
let currentNoteSubcategory = null;
let selectedNoteTag = 'neutral';
let noteImageData = null;

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
    
    // Timer controls
    document.getElementById('startTimer').addEventListener('click', startTimer);
    document.getElementById('pauseTimer').addEventListener('click', pauseTimer);
    document.getElementById('resetTimer').addEventListener('click', resetTimer);
    
    // Insert minute
    document.getElementById('insertMinuteBtn').addEventListener('click', () => {
        const minute = prompt('Digite o minuto:', getCurrentMinute());
        if (minute) {
            timerSeconds = parseInt(minute) * 60;
            updateTimerDisplay();
        }
    });
    
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
    
    document.getElementById('saveAthleteBtn').addEventListener('click', saveAthlete);
    document.getElementById('cancelAthleteBtn').addEventListener('click', () => {
        closeModal('athleteModal');
    });
    
    document.getElementById('athletePhoto').addEventListener('change', handleAthletePhotoUpload);
    
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
    
    // Tag selector
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedNoteTag = btn.dataset.tag;
        });
    });
    
    // Note image upload
    document.getElementById('noteImage').addEventListener('change', handleNoteImageUpload);
    
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

// ========== TIMER ==========
function startTimer() {
    if (!timerRunning) {
        timerRunning = true;
        timerInterval = setInterval(() => {
            timerSeconds++;
            updateTimerDisplay();
        }, 1000);
    }
}

function pauseTimer() {
    timerRunning = false;
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetTimer() {
    pauseTimer();
    timerSeconds = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;
    document.getElementById('timerDisplay').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getCurrentMinute() {
    return Math.floor(timerSeconds / 60);
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
    document.getElementById('gameName').value = game.profile.gameName || '';
    document.getElementById('gameDate').value = game.profile.gameDate || '';
    document.getElementById('gameNotes').value = game.profile.gameNotes || '';
    
    // Update game select
    document.getElementById('gameSelect').value = gameId;
    
    renderAllNotes();
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
    document.getElementById('gameName').value = '';
    document.getElementById('gameDate').value = '';
    document.getElementById('gameNotes').value = '';
    document.querySelectorAll('.notes-list').forEach(list => list.innerHTML = '');
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
        gameName: document.getElementById('gameName').value,
        gameDate: document.getElementById('gameDate').value,
        gameNotes: document.getElementById('gameNotes').value
    };
    
    saveData();
    alert('✅ Perfil guardado!');
}

// ========== ATHLETES ==========
function handleAthletePhotoUpload(e) {
    // Preview handled in saveAthlete
}

function saveAthlete() {
    const name = document.getElementById('athleteName').value.trim();
    const number = document.getElementById('athleteNumber').value;
    const position = document.getElementById('athletePosition').value;
    const photoFile = document.getElementById('athletePhoto').files[0];
    
    if (!name) {
        alert('Por favor, insira o nome da atleta!');
        return;
    }
    
    const saveAthleteData = (photo) => {
        const athlete = {
            id: Date.now(),
            name,
            number: number || '',
            position: position || '',
            photo: photo || null
        };
        
        db.athletes.push(athlete);
        saveData();
        renderAthletes();
        closeModal('athleteModal');
        
        // Reset form
        document.getElementById('athleteName').value = '';
        document.getElementById('athleteNumber').value = '';
        document.getElementById('athletePosition').value = '';
        document.getElementById('athletePhoto').value = '';
    };
    
    if (photoFile) {
        const reader = new FileReader();
        reader.onload = (e) => saveAthleteData(e.target.result);
        reader.readAsDataURL(photoFile);
    } else {
        saveAthleteData(null);
    }
}

function renderAthletes() {
    const container = document.getElementById('athletesList');
    container.innerHTML = '';
    
    if (db.athletes.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:40px;">Nenhuma atleta registada</p>';
        return;
    }
    
    db.athletes.forEach(athlete => {
        const card = document.createElement('div');
        card.className = 'athlete-card';
        
        const img = document.createElement('img');
        img.src = athlete.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(athlete.name)}&background=00ff88&color=000&size=128`;
        img.alt = athlete.name;
        
        card.innerHTML = `
            <img src="${img.src}" alt="${athlete.name}">
            <h3>${athlete.name}</h3>
            ${athlete.number ? `<div class="athlete-number">#${athlete.number}</div>` : ''}
            <div class="athlete-position">${athlete.position || 'Posição não definida'}</div>
        `;
        
        container.appendChild(card);
    });
}

// ========== NOTES ==========
function openNoteModal() {
    if (!db.currentGame) {
        alert('Por favor, crie ou selecione um jogo primeiro!');
        return;
    }
    
    document.getElementById('noteMinute').value = getCurrentMinute() + "'";
    document.getElementById('noteText').value = '';
    document.getElementById('noteVideoLink').value = '';
    document.getElementById('mediaPreview').innerHTML = '';
    noteImageData = null;
    
    // Reset tag selection
    document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector('.tag-btn.neutral').classList.add('selected');
    selectedNoteTag = 'neutral';
    
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
    
    if (!text && !noteImageData && !videoLink) {
        alert('Por favor, adicione pelo menos uma observação, imagem ou vídeo!');
        return;
    }
    
    const note = {
        id: Date.now(),
        category: currentNoteCategory,
        subcategory: currentNoteSubcategory,
        minute: getCurrentMinute(),
        tag: selectedNoteTag,
        text: text,
        image: noteImageData,
        videoLink: videoLink,
        timestamp: new Date().toISOString()
    };
    
    if (!game.notes) game.notes = [];
    game.notes.push(note);
    
    saveData();
    renderNotes(currentNoteCategory, currentNoteSubcategory);
    closeModal('noteModal');
}

function deleteNote(noteId) {
    if (!confirm('Apagar esta nota?')) return;
    
    const game = getCurrentGame();
    if (!game) return;
    
    game.notes = game.notes.filter(n => n.id !== noteId);
    saveData();
    renderAllNotes();
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
        noteEl.className = `note-item ${note.tag}`;
        
        let tagLabel = '';
        if (note.tag === 'positive') tagLabel = '✅ Positivo';
        else if (note.tag === 'negative') tagLabel = '❌ Negativo';
        else tagLabel = 'ℹ️ Neutro';
        
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
                <span class="note-tag ${note.tag}">${tagLabel}</span>
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
    alert('📄 Funcionalidade de exportação PDF será implementada na próxima versão!\n\nPor agora, pode usar a impressão do navegador (Ctrl/Cmd + P) para guardar como PDF.');
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
}
