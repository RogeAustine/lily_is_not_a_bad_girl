document.addEventListener('DOMContentLoaded', function() {
    const ROWS = 15;
    const COLS = 15;
    const ELEMENT_TYPES = 6;
    const GAME_TIME = 5 * 60; 
    let gameBoard = [];
    let selectedCell = null;
    let isSwapping = false;
    let isProcessing = false;
    let score = 0;
    let moves = 0;
    let timeLeft = GAME_TIME;
    let gameTimer = null;
    let gameActive = false;
    const gameBoardElement = document.getElementById('gameBoard');
    const scoreElement = document.getElementById('score');
    const timerElement = document.getElementById('timer');
    const movesElement = document.getElementById('moves');
    const restartBtn = document.getElementById('restartBtn');
    const helpBtn = document.getElementById('helpBtn');
    const helpDialog = document.getElementById('helpDialog');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    
    function initGame() {
        clearInterval(gameTimer);
        score = 0;
        moves = 0;
        timeLeft = GAME_TIME;
        gameActive = true;
        updateUI();
        createBoard();
        
        removeInitialMatches();
        startTimer();
        if (!localStorage.getItem('gameHelpShown')) {
            showHelp();
            localStorage.setItem('gameHelpShown', 'true');
        }
    }
    function createBoard() {
        gameBoard = [];
        gameBoardElement.innerHTML = '';
        for (let row = 0; row < ROWS; row++) {
            gameBoard[row] = [];
            for (let col = 0; col < COLS; col++) {
                const elementType = Math.floor(Math.random() * ELEMENT_TYPES);
                gameBoard[row][col] = elementType;
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                const img = document.createElement('img');
                img.className = 'element-img';
                img.src = `images/${elementType}.png`;
                img.alt = `元素 ${elementType + 1}`;
                img.onerror = function() {
                    this.style.display = 'none';
                    cell.innerHTML = `<div style="width: 80%; height: 80%; background-color: ${getColorByType(elementType)}; border-radius: 5px;"></div>`;
                };
                
                cell.appendChild(img);
                cell.addEventListener('click', () => handleCellClick(row, col));
                cell.addEventListener('mousedown', (e) => handleCellMouseDown(e, row, col));
                
                gameBoardElement.appendChild(cell);
            }
        }
    }
    function getColorByType(type) {
        const colors = [
            '#e74c3c', // 红色
            '#3498db', // 蓝色
            '#2ecc71', // 绿色
            '#f1c40f', // 黄色
            '#9b59b6', // 紫色
            '#e67e22'  // 橙色
        ];
        return colors[type] || '#ecf0f1';
    }
    function removeInitialMatches() {
        let hasMatches = true;
        while (hasMatches) {
            hasMatches = false;
            const matches = findAllMatches();
            
            if (matches.length > 0) {
                hasMatches = true;
                matches.forEach(match => {
                    match.forEach(({row, col}) => {
                        gameBoard[row][col] = Math.floor(Math.random() * ELEMENT_TYPES);
                    });
                });
                updateBoardVisuals();
            }
        }
    }
    function handleCellClick(row, col) {
        if (!gameActive || isSwapping || isProcessing) return;
        
        const cell = getCellElement(row, col);
        
        if (!selectedCell) {
            selectedCell = { row, col };
            cell.classList.add('selected');
        } else {
            const prevCell = getCellElement(selectedCell.row, selectedCell.col);
            prevCell.classList.remove('selected');
            if (areAdjacent(selectedCell.row, selectedCell.col, row, col)) {
                swapElements(selectedCell.row, selectedCell.col, row, col, true);
            }
            selectedCell = null;
        }
    }
    function handleCellMouseDown(e, row, col) {
        if (!gameActive || isSwapping || isProcessing) return;
        
        e.preventDefault();
        selectedCell = { row, col };
        const cell = getCellElement(row, col);
        cell.classList.add('selected');
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    function handleMouseMove(e) {
        if (!selectedCell || isSwapping || isProcessing) return;
        
        const cell = getCellElement(selectedCell.row, selectedCell.col);
        const rect = cell.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        let targetRow = selectedCell.row;
        let targetCol = selectedCell.col;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 30 && selectedCell.col < COLS - 1) {
                targetCol = selectedCell.col + 1;
            } else if (deltaX < -30 && selectedCell.col > 0) {
                targetCol = selectedCell.col - 1;
            }
        } else {
            if (deltaY > 30 && selectedCell.row < ROWS - 1) {
                targetRow = selectedCell.row + 1;
            } else if (deltaY < -30 && selectedCell.row > 0) {
                targetRow = selectedCell.row - 1;
            }
        }
        if ((targetRow !== selectedCell.row || targetCol !== selectedCell.col) && 
            areAdjacent(selectedCell.row, selectedCell.col, targetRow, targetCol)) {
            
            const prevCell = getCellElement(selectedCell.row, selectedCell.col);
            prevCell.classList.remove('selected');
            
            swapElements(selectedCell.row, selectedCell.col, targetRow, targetCol, true);
            selectedCell = null;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
    }
    function handleMouseUp() {
        if (selectedCell) {
            const cell = getCellElement(selectedCell.row, selectedCell.col);
            cell.classList.remove('selected');
            selectedCell = null;
        }
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
    function areAdjacent(row1, col1, row2, col2) {
        const rowDiff = Math.abs(row1 - row2);
        const colDiff = Math.abs(col1 - col2);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    function swapElements(row1, col1, row2, col2, checkMatches = true) {
        if (isSwapping || !gameActive) return;
        
        isSwapping = true;
        const temp = gameBoard[row1][col1];
        gameBoard[row1][col1] = gameBoard[row2][col2];
        gameBoard[row2][col2] = temp;
        updateBoardVisuals();
        moves++;
        movesElement.textContent = moves;
        if (checkMatches) {
            setTimeout(() => {
                const matches = findAllMatches();
                
                if (matches.length > 0) {
                    processMatches(matches);
                } else {
                    const temp = gameBoard[row1][col1];
                    gameBoard[row1][col1] = gameBoard[row2][col2];
                    gameBoard[row2][col2] = temp;
                    
                    updateBoardVisuals();
                    isSwapping = false;
                }
            }, 300);
        } else {
            isSwapping = false;
        }
    }
    function findAllMatches() {
        const matches = [];
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS - 2; col++) {
                const type = gameBoard[row][col];
                if (type === null) continue;
                
                if (gameBoard[row][col + 1] === type && gameBoard[row][col + 2] === type) {
                    let matchLength = 3;
                    while (col + matchLength < COLS && gameBoard[row][col + matchLength] === type) {
                        matchLength++;
                    }
                    
                    const match = [];
                    for (let i = 0; i < matchLength; i++) {
                        match.push({ row, col: col + i });
                    }
                    
                    matches.push(match);
                    col += matchLength - 1;
                }
            }
        }
        for (let col = 0; col < COLS; col++) {
            for (let row = 0; row < ROWS - 2; row++) {
                const type = gameBoard[row][col];
                if (type === null) continue;
                
                if (gameBoard[row + 1][col] === type && gameBoard[row + 2][col] === type) {
                    let matchLength = 3;
                    while (row + matchLength < ROWS && gameBoard[row + matchLength][col] === type) {
                        matchLength++;
                    }
                    
                    const match = [];
                    for (let i = 0; i < matchLength; i++) {
                        match.push({ row: row + i, col });
                    }
                    
                    matches.push(match);
                    row += matchLength - 1;
                }
            }
        }
        
        return matches;
    }
    function processMatches(matches) {
        if (matches.length === 0 || !gameActive) {
            isSwapping = false;
            isProcessing = false;
            return;
        }
        
        isProcessing = true;
        let matchScore = 0;
        matches.forEach(match => {
            matchScore += 10 + (match.length - 3) * 5;
        });
        
        score += matchScore;
        updateUI();
        const cellsToRemove = [];
        matches.forEach(match => {
            match.forEach(({row, col}) => {
                cellsToRemove.push({row, col});
                const cell = getCellElement(row, col);
                cell.classList.add('removing');
            });
        });
        setTimeout(() => {
            cellsToRemove.forEach(({row, col}) => {
                gameBoard[row][col] = null;
            });
            
            updateBoardVisuals();
            
            setTimeout(() => {
                applyGravity();
                
                setTimeout(() => {
                    fillEmptyCells();
                    
                    setTimeout(() => {
                        const newMatches = findAllMatches();
                        
                        if (newMatches.length > 0) {
                            processMatches(newMatches);
                        } else {
                            isSwapping = false;
                            isProcessing = false;
                        }
                    }, 300);
                }, 300);
            }, 300);
        }, 500);
    }
    
    function applyGravity() {
        for (let col = 0; col < COLS; col++) {
            let emptySpaces = 0;
            for (let row = ROWS - 1; row >= 0; row--) {
                if (gameBoard[row][col] === null) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    gameBoard[row + emptySpaces][col] = gameBoard[row][col];
                    gameBoard[row][col] = null;
                    const cell = getCellElement(row + emptySpaces, col);
                    if (cell) {
                        cell.classList.add('falling');
                        setTimeout(() => {
                            cell.classList.remove('falling');
                        }, 300);
                    }
                }
            }
        }
        
        updateBoardVisuals();
    }
    function fillEmptyCells() {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (gameBoard[row][col] === null) {
                    gameBoard[row][col] = Math.floor(Math.random() * ELEMENT_TYPES);
                    
                    // 添加上方生成动画
                    const cell = getCellElement(row, col);
                    if (cell) {
                        cell.classList.add('falling');
                        setTimeout(() => {
                            cell.classList.remove('falling');
                        }, 300);
                    }
                }
            }
        }
        
        updateBoardVisuals();
    }
    function updateBoardVisuals() {
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const cell = getCellElement(row, col);
                const elementType = gameBoard[row][col];
                
                cell.innerHTML = '';
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (elementType === null) {
                    continue;
                }
                
                img.className = 'element-img';
                img.src = `images/${elementType}.png`;
                img.alt = `元素 ${elementType + 1}`;
                img.onerror = function() {
                    this.style.display = 'none';
                    cell.innerHTML = `<div style="width: 80%; height: 80%; background-color: ${getColorByType(elementType)}; border-radius: 5px;"></div>`;
                };
                
                cell.appendChild(img);
            }
        }
    }
    
    function getCellElement(row, col) {
        const index = row * COLS + col;
        return gameBoardElement.children[index];
    }
    
    function startTimer() {
        updateTimerDisplay();
        gameTimer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        if (timeLeft <= 30) {
            timerElement.classList.add('game-over');
        } else {
            timerElement.classList.remove('game-over');
        }
    }
    function updateUI() {
        scoreElement.textContent = score;
        movesElement.textContent = moves;
    }
    function endGame() {
        gameActive = false;
        clearInterval(gameTimer);
        setTimeout(() => {
            alert(`游戏结束！\n\n最终得分: ${score}\n总步数: ${moves}\n\n点击"重新开始"按钮开始新游戏`);
        }, 500);
    }
    function showHelp() {
        helpDialog.style.display = 'flex';
    }
    function hideHelp() {
        helpDialog.style.display = 'none';
    }
    restartBtn.addEventListener('click', () => {
        if (confirm("确定要重新开始游戏吗？当前分数将丢失。")) {
            initGame();
        }
    });
    
    helpBtn.addEventListener('click', showHelp);
    closeHelpBtn.addEventListener('click', hideHelp);
    
    helpDialog.addEventListener('click', (e) => {
        if (e.target === helpDialog) {
            hideHelp();
        }
    });
    
    initGame();
});