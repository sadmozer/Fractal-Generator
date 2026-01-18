// ============================================
// GESTIONE UI E CONTROLLI
// ============================================

// Configurazione griglia
const gridConfig = {
    rows: 3,
    cols: 3,
    cellSize: 16,
    minSize: 3,
    maxSize: 15
};

// Inizializza griglia con maniglie di ridimensionamento
function createGrid(rows, cols) {
    const drumMachine = document.getElementById("drumMachine");
    
    drumMachine.innerHTML = '';
    gridConfig.rows = rows;
    gridConfig.cols = cols;
    
    for (let i = 0; i < rows; i++) {
        const row = document.createElement("tr");
        for (let j = 0; j < cols; j++) {
            const cell = document.createElement("td");
            cell.dataset.row = i;
            cell.dataset.col = j;
            row.appendChild(cell);
        }
        drumMachine.appendChild(row);
    }
    
    // Aggiorna label
    updateGridSizeLabel(rows, cols);
}

function updateGridSizeLabel(rows, cols) {
    const label = document.getElementById('gridSizeValue');
    if (label) {
        label.textContent = `${cols}x${rows}`;
    }
}

function initResizeHandles() {
    const container = document.querySelector('.grid-container');
    
    // Crea maniglie solo se non esistono già
    if (container.querySelector('.resize-handle')) {
        return;
    }
    
    // Maniglia destra
    const rightHandle = document.createElement('div');
    rightHandle.className = 'resize-handle resize-handle-right';
    
    // Maniglia inferiore
    const bottomHandle = document.createElement('div');
    bottomHandle.className = 'resize-handle resize-handle-bottom';
    
    // Maniglia angolo
    const cornerHandle = document.createElement('div');
    cornerHandle.className = 'resize-handle resize-handle-corner';
    
    container.appendChild(rightHandle);
    container.appendChild(bottomHandle);
    container.appendChild(cornerHandle);
    
    // Setup drag per maniglia destra (aumenta colonne)
    setupResizeDrag(rightHandle, 'horizontal');
    setupResizeDrag(bottomHandle, 'vertical');
    setupResizeDrag(cornerHandle, 'both');
}

function setupResizeDrag(handle, direction) {
    let isDragging = false;
    let startRows = gridConfig.rows;
    let startCols = gridConfig.cols;
    let startPos = { x: 0, y: 0 };
    
    handle.addEventListener('mousedown', (e) => {
        isDragging = true;
        startRows = gridConfig.rows;
        startCols = gridConfig.cols;
        startPos = { x: e.clientX, y: e.clientY };
        handle.classList.add('dragging');
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const cellSize = 17; // 16px + 1px border
        let newRows = startRows;
        let newCols = startCols;
        
        if (direction === 'horizontal' || direction === 'both') {
            const deltaX = e.clientX - startPos.x;
            const cellsChange = Math.round(deltaX / cellSize);
            newCols = startCols + cellsChange;
        }
        
        if (direction === 'vertical' || direction === 'both') {
            const deltaY = e.clientY - startPos.y;
            const cellsChange = Math.round(deltaY / cellSize);
            newRows = startRows + cellsChange;
        }
        
        // Limita dimensioni
        newRows = Math.max(gridConfig.minSize, Math.min(gridConfig.maxSize, newRows));
        newCols = Math.max(gridConfig.minSize, Math.min(gridConfig.maxSize, newCols));
        
        // Aggiorna solo se cambiato
        if (newRows !== gridConfig.rows || newCols !== gridConfig.cols) {
            createGrid(newRows, newCols);
            FractalEngine.clearPattern();
            FractalEngine.initGridListeners();
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            handle.classList.remove('dragging');
        }
    });
}

// ============================================
// PRESET PATTERNS
// ============================================

const presets = {
    cross: () => {
        // Croce 3x3: linea verticale e orizzontale al centro
        return ['1,0', '1,1', '1,2', '0,1', '2,1'];
    },
    doublediagonal: () => {
        // X 3x3: entrambe le diagonali
        return ['0,0', '1,1', '2,2', '0,2', '2,0'];
    },
    'sierpinski-carpet': () => {
        // Sierpinski Carpet 3x3: tutto il perimetro (8 celle esterne)
        return ['0,0', '0,1', '0,2', '1,0', '1,2', '2,0', '2,1', '2,2'];
    },
    diagonal: () => {
        // Diagonale da basso sinistra ad alto destra
        return ['2,0', '1,1', '0,2'];
    },
    stairs: () => {
        // Scale 3x3
        return ['0,2', '1,1', '1,2', '2,0', '2,1', '2,2'];
    },
    taj: () => {
        return ['0,0', '0,2', '1,0', '1,1', '1,2', '2,0', '2,1', '2,2'];
    },
    tree: () => {
        return ['0,0', '0,1', '0,2', '1,1', '2,1'];
    }
};

// ============================================
// MOTORE FRATTALI
// ============================================

const FractalEngine = (function() {
    const CANVAS = document.getElementById('canvas');
    const CTX = CANVAS.getContext('2d');

    let isDrawing = true;
    let animationId = null;
    let currentDepth = 6;
    let currentSpeed = 'auto';
    let POINTS = [];
    const highlightedCells = new Set();
    
    let fillColorPoints = { r: 74, g: 158, b: 255 }; // Default blue
    let fillColorBackground = { r: 0, g: 0, b: 0 }; // Default black
    let MAX_X, MAX_Y, MIN_X, MIN_Y, RANGE_X, RANGE_Y;
    let offsetX, offsetY;
    let useCustomColors = false;

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    function luminance(r, g, b) {
        const a = [r, g, b].map(function(v) {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }
    
    function contrastRatio(color1, color2) {
        const lum1 = luminance(color1.r, color1.g, color1.b);
        const lum2 = luminance(color2.r, color2.g, color2.b);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }
    
    function randomColor() {
        return {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256)
        };
    }
    
    function generateContrastingColors() {
        let bgColor = randomColor();
        let patternColor;
        do {
            patternColor = randomColor();
        } while (contrastRatio(bgColor, patternColor) < 4.5);
        return { bgColor, patternColor };
    }
    
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    function updateColorPickers() {
        document.getElementById('bgColorPicker').value = rgbToHex(fillColorBackground.r, fillColorBackground.g, fillColorBackground.b);
        document.getElementById('patternColorPicker').value = rgbToHex(fillColorPoints.r, fillColorPoints.g, fillColorPoints.b);
    }

    // ============================================
    // CANVAS MANAGEMENT
    // ============================================

    function resizeCanvas() {
        const sidebar = document.getElementById('sidebar');
        const sidebarWidth = sidebar.classList.contains('hidden') ? 0 : 320;
        CANVAS.width = window.innerWidth - sidebarWidth;
        CANVAS.height = window.innerHeight;
    }

    function calculateOffsets() {
        offsetX = Math.floor(CANVAS.width / 2);
        offsetY = Math.floor(CANVAS.height / 2);
    }

    function initVariables() {
        // Genera nuovi colori solo se non si usano colori personalizzati
        if (!useCustomColors) {
            const { bgColor, patternColor } = generateContrastingColors();
            fillColorBackground = bgColor;
            fillColorPoints = patternColor;
            updateColorPickers();
        }
        
        POINTS = [...highlightedCells].map(o => {
            const [x, y] = o.split(",");
            return { x: parseInt(x), y: parseInt(y) };
        });
        
        if (POINTS.length === 0) return false;
        
        MAX_X = Math.max(...POINTS.map(o => o.x));
        MAX_Y = Math.max(...POINTS.map(o => o.y));
        MIN_X = Math.min(...POINTS.map(o => o.x));
        MIN_Y = Math.min(...POINTS.map(o => o.y));
        RANGE_X = MAX_X - MIN_X + 1;
        RANGE_Y = MAX_Y - MIN_Y + 1;
        return true;
    }

    // ============================================
    // FRACTAL GENERATION
    // ============================================

    function calculateAllPoints(depth) {
        const points = [];
        const stack = [{ x: 0, y: 0, d: depth }];
        
        while (stack.length > 0) {
            const { x: oldX, y: oldY, d } = stack.pop();
            
            if (d >= 1) {
                for (let i = POINTS.length - 1; i >= 0; i--) {
                    const newX = POINTS[i].x + oldX * RANGE_X;
                    const newY = POINTS[i].y + oldY * RANGE_Y;
                    
                    if (Math.abs(newX) <= CANVAS.width * 2 && 
                        Math.abs(newY) <= CANVAS.height * 2) {
                        
                        points.push({ x: newX, y: newY });
                        
                        if (d > 1) {
                            stack.push({ x: newX, y: newY, d: d - 1 });
                        }
                    }
                }
            }
        }
        
        return points;
    }

    function drawSymmetricPoint(x, y) {
        CTX.fillRect(x + offsetX, y + offsetY, 1, 1);
        CTX.fillRect(x + offsetX, -y + offsetY, 1, 1);
        CTX.fillRect(-x + offsetX, y + offsetY, 1, 1);
        CTX.fillRect(-x + offsetX, -y + offsetY, 1, 1);
    }

    function animateFractal(depth, speed) {
        if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        const allPoints = calculateAllPoints(depth);
        if (allPoints.length === 0) return;

        const speeds = {
            'slow': 1,
            'medium': 10,
            'fast': 50,
            'ultra': 200,
            'auto': Math.max(1, Math.floor(allPoints.length / 200))
        };
        const pointsPerFrame = speeds[speed] || speeds.auto;
        
        let index = 0;
        
        function animate() {
            if (!isDrawing || index >= allPoints.length) {
                animationId = null;
                return;
            }
            
            CTX.fillStyle = `rgb(${fillColorPoints.r}, ${fillColorPoints.g}, ${fillColorPoints.b})`;
            
            const batch = Math.min(pointsPerFrame, allPoints.length - index);
            for (let i = 0; i < batch; i++) {
                const p = allPoints[index + i];
                drawSymmetricPoint(p.x, p.y);
            }
            
            index += batch;
            animationId = requestAnimationFrame(animate);
        }
        
        animationId = requestAnimationFrame(animate);
    }

    // ============================================
    // PUBLIC API
    // ============================================

    function redraw() {
        isDrawing = false;
        if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        if (!initVariables()) {
            CTX.fillStyle = '#000';
            CTX.fillRect(0, 0, CANVAS.width, CANVAS.height);
            return;
        }
        
        calculateOffsets();
        
        setTimeout(function() {
            CTX.fillStyle = `rgb(${fillColorBackground.r}, ${fillColorBackground.g}, ${fillColorBackground.b})`;
            CTX.fillRect(0, 0, CANVAS.width, CANVAS.height);
            
            isDrawing = true;
            animateFractal(currentDepth, currentSpeed);
        }, 20);
    }

    function initGridListeners() {
        document.querySelectorAll('#drumMachine td').forEach(cell => {
            const newCell = cell.cloneNode(true);
            cell.parentNode.replaceChild(newCell, cell);
        });
        
        document.querySelectorAll('#drumMachine td').forEach(cell => {
            cell.addEventListener('click', function() {
                this.classList.toggle('activated');
                const row = this.dataset.row;
                const col = this.dataset.col;
                
                if (this.classList.contains('activated')) {
                    highlightedCells.add(col + "," + row);
                } else {
                    highlightedCells.delete(col + "," + row);
                }
                
                redraw();
            });
        });
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    resizeCanvas();
    calculateOffsets();
    CTX.fillStyle = '#000';
    CTX.fillRect(0, 0, CANVAS.width, CANVAS.height);
    updateColorPickers();

    window.addEventListener('resize', function() {
        resizeCanvas();
        calculateOffsets();
        
        if (highlightedCells.size > 0) {
            isDrawing = false;
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
            
            CTX.fillStyle = `rgb(${fillColorBackground.r}, ${fillColorBackground.g}, ${fillColorBackground.b})`;
            CTX.fillRect(0, 0, CANVAS.width, CANVAS.height);
            
            isDrawing = true;
            const sidebar = document.getElementById('sidebar');
            const resizeSpeed = sidebar.classList.contains('hidden') ? 'ultra' : 'fast';
            animateFractal(currentDepth, resizeSpeed);
        }
    });

    window.addEventListener('patternChanged', () => {
        highlightedCells.clear();
        document.querySelectorAll('#drumMachine td.activated').forEach(cell => {
            const row = cell.dataset.row;
            const col = cell.dataset.col;
            highlightedCells.add(col + "," + row);
        });
        redraw();
    });

    // Return public API
    return {
        redraw: redraw,
        initGridListeners: initGridListeners,
        setDepth: (depth) => { currentDepth = depth; },
        setSpeed: (speed) => { currentSpeed = speed; },
        hasPattern: () => highlightedCells.size > 0,
        clearPattern: () => highlightedCells.clear(),
        setBackgroundColor: (hex) => {
            const rgb = hexToRgb(hex);
            if (rgb) {
                fillColorBackground = rgb;
                useCustomColors = true;
            }
        },
        setPatternColor: (hex) => {
            const rgb = hexToRgb(hex);
            if (rgb) {
                fillColorPoints = rgb;
                useCustomColors = true;
            }
        },
        generateRandomColors: () => {
            useCustomColors = false;
            const { bgColor, patternColor } = generateContrastingColors();
            fillColorBackground = bgColor;
            fillColorPoints = patternColor;
            updateColorPickers();
        }
    };
})();

// ============================================
// CUSTOM PATTERNS MANAGEMENT
// ============================================

const CustomPatterns = {
    patterns: [],
    
    save() {
        const activeCells = [];
        document.querySelectorAll('#drumMachine td.activated').forEach(cell => {
            activeCells.push(`${cell.dataset.row},${cell.dataset.col}`);
        });
        
        if (activeCells.length === 0) {
            alert('No pattern to save! Please select some cells first.');
            return;
        }
        
        const pattern = {
            id: Date.now(),
            cells: activeCells,
            rows: gridConfig.rows,
            cols: gridConfig.cols
        };
        
        this.patterns.push(pattern);
        this.render();
        this.saveToStorage();
    },
    
    delete(id) {
        this.patterns = this.patterns.filter(p => p.id !== id);
        this.render();
        this.saveToStorage();
    },
    
    apply(id) {
        const pattern = this.patterns.find(p => p.id === id);
        if (!pattern) return;
        
        // Ridimensiona griglia se necessario
        if (gridConfig.rows !== pattern.rows || gridConfig.cols !== pattern.cols) {
            createGrid(pattern.rows, pattern.cols);
            FractalEngine.clearPattern();
            FractalEngine.initGridListeners();
        }
        
        // Pulisci e applica pattern
        document.querySelectorAll('#drumMachine td').forEach(cell => {
            cell.classList.remove('activated');
        });
        
        pattern.cells.forEach(coord => {
            const [row, col] = coord.split(',');
            const cell = document.querySelector(`#drumMachine td[data-row="${row}"][data-col="${col}"]`);
            if (cell) cell.classList.add('activated');
        });
        
        window.dispatchEvent(new Event('patternChanged'));
    },
    
    render() {
        const container = document.getElementById('customPatternsContainer');
        const hint = document.getElementById('noCustomPatterns');
        
        if (this.patterns.length === 0) {
            hint.style.display = 'block';
            // Rimuovi tutti i bottoni custom
            container.querySelectorAll('.custom-pattern-btn').forEach(btn => btn.remove());
        } else {
            hint.style.display = 'none';
            
            // Rimuovi bottoni esistenti
            container.querySelectorAll('.custom-pattern-btn').forEach(btn => btn.remove());
            
            // Crea bottoni per ogni pattern
            this.patterns.forEach((pattern, index) => {
                const btn = document.createElement('button');
                btn.className = 'preset-btn custom-pattern-btn';
                btn.textContent = `Pattern ${index + 1} (${pattern.cols}x${pattern.rows})`;
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-pattern';
                deleteBtn.textContent = '✕';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.delete(pattern.id);
                };
                
                btn.appendChild(deleteBtn);
                btn.onclick = () => this.apply(pattern.id);
                
                container.appendChild(btn);
            });
        }
    },
    
    saveToStorage() {
        localStorage.setItem('fractalCustomPatterns', JSON.stringify(this.patterns));
    },
    
    loadFromStorage() {
        const saved = localStorage.getItem('fractalCustomPatterns');
        if (saved) {
            try {
                this.patterns = JSON.parse(saved);
                this.render();
            } catch (e) {
                console.error('Error loading custom patterns:', e);
            }
        }
    }
};

// Save pattern button
const savePatternBtn = document.getElementById('savePatternBtn');
if (savePatternBtn) {
    savePatternBtn.addEventListener('click', () => {
        CustomPatterns.save();
    });
}

// Load custom patterns on startup
CustomPatterns.loadFromStorage();

// ============================================
// EVENT LISTENERS UI
// ============================================

// Toggle sidebar
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
    document.body.classList.toggle('sidebar-visible');
    window.dispatchEvent(new Event('resize'));
});

// Controllo slider profondità
document.getElementById('depthSlider').addEventListener('input', (e) => {
    document.getElementById('depthValue').textContent = e.target.value;
    FractalEngine.setDepth(parseInt(e.target.value));
    if (FractalEngine.hasPattern()) {
        FractalEngine.redraw();
    }
});

// Controllo velocità
document.getElementById('speedSelect').addEventListener('change', (e) => {
    FractalEngine.setSpeed(e.target.value);
});

// Pulsante pulisci
document.getElementById('clearBtn').addEventListener('click', () => {
    document.querySelectorAll('#drumMachine td').forEach(cell => {
        cell.classList.remove('activated');
    });
    FractalEngine.clearPattern();
    window.dispatchEvent(new Event('patternChanged'));
});

// Pattern casuale
document.getElementById('randomBtn').addEventListener('click', () => {
    let hasAtLeastOne = false;
    
    // Assicurati che almeno una cella sia attiva
    document.querySelectorAll('#drumMachine td').forEach(cell => {
        if (Math.random() > 0.7) {
            cell.classList.add('activated');
            hasAtLeastOne = true;
        } else {
            cell.classList.remove('activated');
        }
    });
    
    // Se nessuna cella è attiva, attivane una casuale
    if (!hasAtLeastOne) {
        const allCells = document.querySelectorAll('#drumMachine td');
        const randomCell = allCells[Math.floor(Math.random() * allCells.length)];
        randomCell.classList.add('activated');
    }
    
    window.dispatchEvent(new Event('patternChanged'));
});

// Color pickers
document.getElementById('bgColorPicker').addEventListener('change', (e) => {
    FractalEngine.setBackgroundColor(e.target.value);
    if (FractalEngine.hasPattern()) {
        FractalEngine.redraw();
    }
});

document.getElementById('patternColorPicker').addEventListener('change', (e) => {
    FractalEngine.setPatternColor(e.target.value);
    if (FractalEngine.hasPattern()) {
        FractalEngine.redraw();
    }
});

// Random colors button
document.getElementById('randomColorsBtn').addEventListener('click', () => {
    FractalEngine.generateRandomColors();
    if (FractalEngine.hasPattern()) {
        FractalEngine.redraw();
    }
});

// Event listeners per preset
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        
        // Cambia la griglia a 3x3
        if (gridConfig.rows !== 3 || gridConfig.cols !== 3) {
            createGrid(3, 3);
            FractalEngine.clearPattern();
            FractalEngine.initGridListeners();
        }
        
        // Pulisci griglia
        document.querySelectorAll('#drumMachine td').forEach(cell => {
            cell.classList.remove('activated');
        });
        
        // Applica preset
        const cells = presets[preset]();
        
        cells.forEach(coord => {
            const [row, col] = coord.split(',');
            const cell = document.querySelector(`#drumMachine td[data-row="${row}"][data-col="${col}"]`);
            if (cell) cell.classList.add('activated');
        });
        
        window.dispatchEvent(new Event('patternChanged'));
    });
});

// ============================================
// AUTOPLAY FUNCTIONALITY
// ============================================

const AutoplayManager = {
    isPlaying: false,
    intervalId: null,
    currentPresetIndex: 0,
    currentCustomIndex: 0,
    presetKeys: Object.keys(presets),
    
    start() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        const btn = document.getElementById('autoplayBtn');
        btn.textContent = '⏸ Stop Autoplay';
        btn.classList.add('playing');
        
        const mode = document.getElementById('autoplayMode').value;
        const speedValue = parseFloat(document.getElementById('autoplaySpeed').value);
        
        this.playNext(mode);
        
        // Se l'intervallo è 0, usa setInterval con delay minimo
        const speed = speedValue === 0 ? 0 : speedValue * 1000;
        this.intervalId = setInterval(() => {
            this.playNext(mode);
        }, speed);
    },
    
    stop() {
        if (!this.isPlaying) return;
        
        this.isPlaying = false;
        const btn = document.getElementById('autoplayBtn');
        btn.textContent = '▶ Start Autoplay';
        btn.classList.remove('playing');
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },
    
    playNext(mode) {
        if (mode === 'random') {
            // Pattern casuale
            document.getElementById('randomBtn').click();
        } else if (mode === 'presets') {
            // Cicla preset
            const presetName = this.presetKeys[this.currentPresetIndex];
            const presetBtn = document.querySelector(`[data-preset="${presetName}"]`);
            if (presetBtn) {
                presetBtn.click();
            }
            this.currentPresetIndex = (this.currentPresetIndex + 1) % this.presetKeys.length;
        } else if (mode === 'custom') {
            // Cicla custom patterns
            if (CustomPatterns.patterns.length === 0) {
                // Se non ci sono pattern custom, usa random
                document.getElementById('randomBtn').click();
            } else {
                const pattern = CustomPatterns.patterns[this.currentCustomIndex];
                CustomPatterns.apply(pattern.id);
                this.currentCustomIndex = (this.currentCustomIndex + 1) % CustomPatterns.patterns.length;
            }
        }
    }
};

// Autoplay controls
document.getElementById('autoplayBtn').addEventListener('click', () => {
    if (AutoplayManager.isPlaying) {
        AutoplayManager.stop();
    } else {
        AutoplayManager.start();
    }
});

document.getElementById('autoplaySpeed').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    document.getElementById('autoplaySpeedValue').textContent = value;
    
    // Riavvia autoplay con nuova velocità se è attivo
    if (AutoplayManager.isPlaying) {
        const mode = document.getElementById('autoplayMode').value;
        
        clearInterval(AutoplayManager.intervalId);
        
        // Se l'intervallo è 0, genera immediatamente senza delay
        if (value === 0) {
            AutoplayManager.intervalId = setInterval(() => {
                AutoplayManager.playNext(mode);
            }, 0);
        } else {
            const speed = value * 1000;
            AutoplayManager.intervalId = setInterval(() => {
                AutoplayManager.playNext(mode);
            }, speed);
        }
    }
});

document.getElementById('autoplayMode').addEventListener('change', () => {
    AutoplayManager.currentPresetIndex = 0;
});

// ============================================
// START APPLICATION
// ============================================

createGrid(3, 3);
initResizeHandles();
FractalEngine.initGridListeners();

// Avvia autoplay automaticamente
setTimeout(() => {
    AutoplayManager.start();
}, 500);