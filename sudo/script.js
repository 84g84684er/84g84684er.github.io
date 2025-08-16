document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('sudoku-board');
    const solveButton = document.getElementById('solve-button');
    const clearButton = document.getElementById('clear-button');
    const exampleButton = document.getElementById('example-button');
    const themeToggleButton = document.getElementById('theme-toggle');
    const statusMessageElement = document.getElementById('status-message');
    const N = 9;
    let cells = [];

    // 初始化主題
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleButton.textContent = '☀️';
    } else {
        themeToggleButton.textContent = '🌙';
    }

    themeToggleButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            themeToggleButton.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggleButton.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        }
    });

    // 點擊數獨板外區域時清除高亮（可選功能）
    document.addEventListener('click', (event) => {
        if (!boardElement.contains(event.target)) {
            clearHighlights();
        }
    });

    // 生成數獨網格
    function createBoard() {
        boardElement.innerHTML = ''; // 清空舊的
        cells = [];
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                const input = document.createElement('input');
                input.type = 'number';
                input.min = '1';
                input.max = '9';
                input.dataset.row = i;
                input.dataset.col = j;
                // *** 新增：添加 keydown 事件監聽器 ***
                input.addEventListener('keydown', handleKeyDown);
                input.addEventListener('input', handleInput);
                input.addEventListener('focus', handleFocus);
                boardElement.appendChild(input);
                cells.push(input);
            }
        }
    }

    // *** 新增：處理鍵盤事件以阻止無效字符 ***
    function handleKeyDown(event) {
        // 阻止 '0', '+', '-', '.', 'e' 等無效按鍵的輸入
        if (['+', '-', '.'].includes(event.key)) {
            event.preventDefault();
        }
    }

    function handleInput(event) {
        const input = event.target;
        const value = input.value;
        clearHighlights(); // 先清除舊的高亮

        if (value === '') {
            highlightRelatedCells(input);
            return;
        }

        // 這個檢查仍然有用，可以處理貼上無效內容的情況
        if (!/^[1-9]$/.test(value)) {
            input.value = ''; // 清除非法輸入
            return;
        }
        
        // 確保輸入後只有一個數字
        if (value.length > 1) {
            input.value = value[0];
        }

        highlightRelatedCells(input);
        highlightSameNumbers(input.value);
    }

    function handleFocus(event) {
        const input = event.target;
        clearHighlights();
        highlightRelatedCells(input);
        if (input.value !== '') {
            highlightSameNumbers(input.value);
        }
    }

    function clearHighlights() {
        cells.forEach(cell => {
            cell.classList.remove('highlight-related', 'highlight-same-number', 'highlight-error');
        });
    }

    function highlightRelatedCells(focusedInput) {
        const row = parseInt(focusedInput.dataset.row);
        const col = parseInt(focusedInput.dataset.col);

        cells.forEach(cell => {
            const r = parseInt(cell.dataset.row);
            const c = parseInt(cell.dataset.col);
            const boxRowStart = Math.floor(row / 3) * 3;
            const boxColStart = Math.floor(col / 3) * 3;

            if (r === row || c === col ||
                (r >= boxRowStart && r < boxRowStart + 3 && c >= boxColStart && c < boxColStart + 3)) {
                if (cell !== focusedInput) {
                    cell.classList.add('highlight-related');
                }
            }
        });
    }

    function highlightSameNumbers(number) {
        if (!number || !/^[1-9]$/.test(number)) return;
        cells.forEach(cell => {
            if (cell.value === number) {
                cell.classList.add('highlight-same-number');
            }
        });
    }

    // 從介面獲取數獨盤面
    function getCurrentBoard() {
        const board = [];
        for (let i = 0; i < N; i++) {
            board[i] = [];
            for (let j = 0; j < N; j++) {
                const cell = cells[i * N + j];
                board[i][j] = cell.value === '' ? 0 : parseInt(cell.value);
            }
        }
        return board;
    }

    // 將數獨盤面設定到介面
    function setBoardOnUI(board, isExample = false) {
        clearBoardUI(false); // 清除時保留 fixed class
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                const cell = cells[i * N + j];
                if (board[i][j] !== 0) {
                    cell.value = board[i][j];
                    if (isExample) {
                        cell.classList.add('fixed');
                        cell.readOnly = true;
                    }
                } else {
                    cell.value = '';
                    cell.classList.remove('fixed');
                    cell.readOnly = false;
                }
            }
        }
        statusMessageElement.textContent = '';
    }
    
    clearButton.addEventListener('click', () => clearBoardUI(true));
    
    function clearBoardUI(clearFixed = true) {
        cells.forEach(cell => {
            cell.value = '';
            cell.classList.remove('highlight-related', 'highlight-same-number', 'highlight-error');
            if (clearFixed) {
                cell.classList.remove('fixed');
                cell.readOnly = false;
            }
        });
        statusMessageElement.textContent = '盤面已清除。';
    }


    exampleButton.addEventListener('click', () => {
        const exampleBoard = [
            [5, 3, 0, 0, 7, 0, 0, 0, 0],
            [6, 0, 0, 1, 9, 5, 0, 0, 0],
            [0, 9, 8, 0, 0, 0, 0, 6, 0],
            [8, 0, 0, 0, 6, 0, 0, 0, 3],
            [4, 0, 0, 8, 0, 3, 0, 0, 1],
            [7, 0, 0, 0, 2, 0, 0, 0, 6],
            [0, 6, 0, 0, 0, 0, 2, 8, 0],
            [0, 0, 0, 4, 1, 9, 0, 0, 5],
            [0, 0, 0, 0, 8, 0, 0, 7, 9]
        ];
        setBoardOnUI(exampleBoard, true);
        statusMessageElement.textContent = '示例已載入。';
    });

    solveButton.addEventListener('click', () => {
        const board = getCurrentBoard();
        cells.forEach(cell => cell.classList.remove('highlight-error'));

        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                if (board[r][c] !== 0) {
                    const num = board[r][c];
                    board[r][c] = 0; 
                    if (!isValidPlacement(board, r, c, num)) {
                        cells[r * N + c].classList.add('highlight-error');
                        statusMessageElement.textContent = '初始盤面有衝突，無法解算。';
                        board[r][c] = num; 
                        return;
                    }
                    board[r][c] = num;
                }
            }
        }
        
        statusMessageElement.textContent = '正在解算...';
        setTimeout(() => {
            if (solveSudoku(board)) {
                setBoardOnUI(board);
                statusMessageElement.textContent = '數獨已解算！';
            } else {
                statusMessageElement.textContent = '此數獨無解或初始盤面錯誤。';
            }
        }, 10);
    });

    // --- 數獨解算邏輯 (回溯法) ---
    function solveSudoku(board) {
        const emptySpot = findEmptySpot(board);
        if (!emptySpot) {
            return true;
        }
        const [row, col] = emptySpot;

        for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(board, row, col, num)) {
                board[row][col] = num;
                if (solveSudoku(board)) {
                    return true;
                }
                board[row][col] = 0;
            }
        }
        return false;
    }

    function findEmptySpot(board) {
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (board[i][j] === 0) {
                    return [i, j];
                }
            }
        }
        return null;
    }

    function isValidPlacement(board, row, col, num) {
        // 檢查行
        for (let c = 0; c < N; c++) {
            if (board[row][c] === num) {
                return false;
            }
        }
        // 檢查列
        for (let r = 0; r < N; r++) {
            if (board[r][col] === num) {
                return false;
            }
        }
        // 檢查 3x3 子網格
        const boxRowStart = Math.floor(row / 3) * 3;
        const boxColStart = Math.floor(col / 3) * 3;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[boxRowStart + r][boxColStart + c] === num) {
                    return false;
                }
            }
        }
        return true;
    }

    // 初始化
    createBoard();
});
