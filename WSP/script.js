// script.js (確保渲染邏輯正確)
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素 (無變動) ---
    const rowCountInput = document.getElementById('row-count');
    const btnGenerateRowSetup = document.getElementById('btn-generate-row-setup');
    const rowSetupContainer = document.getElementById('row-setup-container');
    const setupSection = document.getElementById('initial-state-setup');
    const setupGrid = document.getElementById('setup-grid');
    const btnSolve = document.getElementById('btn-solve');
    const solutionSection = document.getElementById('solution-output');
    const solverStatus = document.getElementById('solver-status');
    const gameBoard = document.getElementById('game-board');
    const stepInfo = document.getElementById('step-info');
    const stepDescription = document.getElementById('step-description');
    const btnPrevStep = document.getElementById('btn-prev-step');
    const btnNextStep = document.getElementById('btn-next-step');
    const btnToggleFullSolution = document.getElementById('btn-toggle-full-solution');
    const fullSolutionText = document.getElementById('full-solution-text');

    // --- 全域狀態 (無變動) ---
    let cupCount, cupCapacity;
    let cupsPerRow = [];
    let solutionPath = [];
    let allStates = [];
    let currentStep = 0;

    // --- 事件監聽與 UI 生成 (無變動) ---
    btnGenerateRowSetup.addEventListener('click', generateRowSetupUI);
    btnSolve.addEventListener('click', solvePuzzle);
    btnPrevStep.addEventListener('click', () => navigateStep(-1));
    btnNextStep.addEventListener('click', () => navigateStep(1));
    btnToggleFullSolution.addEventListener('click', toggleFullSolution);

    function generateRowSetupUI() {
        const rowCount = parseInt(rowCountInput.value);
        if (rowCount < 1) { alert('列數至少為 1。'); return; }
        rowSetupContainer.innerHTML = '';
        let content = `<h4>請設定每列的杯子數量及總容量：</h4>
                     <div class="control-group">
                       <label for="cup-capacity">每杯容量：</label>
                       <input type="number" id="cup-capacity" value="4" min="1">
                     </div>`;
        for (let i = 0; i < rowCount; i++) {
            content += `<div class="row-spec-group">
                          <label for="cups-in-row-${i}">第 ${i + 1} 列的杯子數：</label>
                          <input type="number" id="cups-in-row-${i}" class="cups-per-row-input" value="5" min="0">
                       </div>`;
        }
        content += `<button id="btn-generate-cup-setup">產生設定介面</button>`;
        rowSetupContainer.innerHTML = content;
        rowSetupContainer.style.display = 'block';
        document.getElementById('btn-generate-cup-setup').addEventListener('click', generateCupSetupUI);
    }

        function generateCupSetupUI() {
        cupsPerRow = Array.from(document.querySelectorAll('.cups-per-row-input')).map(input => parseInt(input.value) || 0);
        cupCount = cupsPerRow.reduce((sum, count) => sum + count, 0);
        cupCapacity = parseInt(document.getElementById('cup-capacity').value);
        if (cupCount < 2 || cupCapacity < 1) { alert('總杯子數量至少為 2，容量至少為 1。'); return; }
        
        setupGrid.innerHTML = '';
        let globalCupIndex = 0;

        cupsPerRow.forEach(numCupsInRow => {
            if (numCupsInRow === 0) return;
            const rowDiv = document.createElement('div');
            rowDiv.className = 'cup-row';

            for (let i = 0; i < numCupsInRow; i++) {
                // 1. 創建新的 wrapper
                const cupWrapper = document.createElement('div');
                cupWrapper.className = 'cup-wrapper';

                // 2. 創建標籤並添加到 wrapper
                const label = document.createElement('div');
                label.className = 'setup-cup-label';
                label.textContent = `杯子 ${globalCupIndex + 1}`;
                cupWrapper.appendChild(label);

                // 3. 創建杯子設定區域 (包含輸入框)
                const cupSetupDiv = document.createElement('div');
                cupSetupDiv.className = 'setup-cup';
                for (let j = 0; j < cupCapacity; j++) {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.min = '0';
                    cupSetupDiv.appendChild(input);
                }
                
                // 4. 將杯子設定區域添加到 wrapper，然後將 wrapper 添加到行
                cupWrapper.appendChild(cupSetupDiv);
                rowDiv.appendChild(cupWrapper);
                globalCupIndex++;
            }
            setupGrid.appendChild(rowDiv);
        });

        setupSection.style.display = 'block';
        solutionSection.style.display = 'none';
    }

    function getInitialStateFromUI() {
        const state = Array.from({ length: cupCount }, () => []);
        document.querySelectorAll('.setup-cup').forEach((cupDiv, cupIndex) => {
            const cupInputs = cupDiv.querySelectorAll('input');
            const tempCupValues = [];
            cupInputs.forEach(input => {
                const value = parseInt(input.value);
                if (!isNaN(value) && value > 0) tempCupValues.push(value);
            });
            state[cupIndex] = tempCupValues.reverse();
        });
        return state;
    }
    
    // --- 核心解算邏輯 (A*，無變動) ---
    function stateToString(state) { return state.map(cup => cup.join(',')).join('|'); }
    function calculateHeuristic(state) {
        let misplaced = 0;
        for (const cup of state) {
            if (cup.length === 0 || (cup.length === cupCapacity && cup.every(c => c === cup[0]))) continue;
            const targetColor = cup[0];
            for(let i = 0; i < cup.length; i++) { if(cup[i] !== targetColor) misplaced++; }
        }
        return misplaced;
    }
    function findSolution(initialState) {
        const priorityQueue = [{ state: initialState, path: [], states: [initialState], cost: calculateHeuristic(initialState) }];
        const visited = new Map();
        visited.set(stateToString(initialState), 0);
        const MAX_STATES_TO_CHECK = 500000;
        let checkedStates = 0;
        while (priorityQueue.length > 0) {
            priorityQueue.sort((a, b) => a.cost - b.cost);
            const { state, path, states } = priorityQueue.shift();
            const g_cost = path.length;
            if (isSolved(state)) return { path, states };
            checkedStates++;
            if (checkedStates > MAX_STATES_TO_CHECK) { console.warn("超限"); return null; }
            for (let i = 0; i < cupCount; i++) {
                for (let j = 0; j < cupCount; j++) {
                    if (i === j) continue;
                    if (canPour(state, i, j)) {
                        const newState = state.map(cup => [...cup]);
                        const pouredState = performPour(newState, i, j);
                        const newStateString = stateToString(pouredState);
                        const new_g_cost = g_cost + 1;
                        if (!visited.has(newStateString) || new_g_cost < visited.get(newStateString)) {
                            visited.set(newStateString, new_g_cost);
                            const h_cost = calculateHeuristic(pouredState);
                            const f_cost = new_g_cost + h_cost;
                            priorityQueue.push({ state: pouredState, path: [...path, [i, j]], states: [...states, pouredState], cost: f_cost });
                        }
                    }
                }
            }
        }
        return null;
    }
    function isSolved(state) { for (const cup of state) { if (cup.length > 0 && (cup.length < cupCapacity || !cup.every(c => c === cup[0]))) return false; } return true; }
    function canPour(state, fromIdx, toIdx) { const fromCup = state[fromIdx]; const toCup = state[toIdx]; if (fromCup.length === 0 || toCup.length === cupCapacity) return false; if (fromCup.length === cupCapacity && fromCup.every(c => c === fromCup[0])) return false; const topColorFrom = fromCup[fromCup.length - 1]; if (toCup.length > 0 && toCup[toCup.length - 1] !== topColorFrom) return false; return true; }
    function performPour(newState, fromIdx, toIdx) { const fromCup = newState[fromIdx]; const toCup = newState[toIdx]; const colorToMove = fromCup[fromCup.length - 1]; let moveCount = 0; for (let i = fromCup.length - 1; i >= 0; i--) { if (fromCup[i] === colorToMove) moveCount++; else break; } const availableSpace = cupCapacity - toCup.length; const numToMove = Math.min(moveCount, availableSpace); for (let i = 0; i < numToMove; i++) { toCup.push(fromCup.pop()); } return newState; }

    // --- UI 更新與顯示函式 ---
    function solvePuzzle() {
        const initialState = getInitialStateFromUI();
        solverStatus.textContent = '解算中，請稍候...';
        solverStatus.style.color = '#f0ad4e';
        solutionSection.style.display = 'block';
        gameBoard.innerHTML = ''; resetStepControls();
        setTimeout(() => {
            const startTime = performance.now();
            const result = findSolution(initialState);
            const endTime = performance.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);
            if (result) {
                solutionPath = result.path; allStates = result.states; currentStep = 0;
                solverStatus.textContent = `解算成功！共需 ${solutionPath.length} 步。(耗時 ${duration} 秒)`;
                solverStatus.style.color = '#5cb85c';
                updateDisplay(); updateFullSolutionText();
            } else {
                solverStatus.textContent = `找不到解法或運算超時。(已檢查 ${duration} 秒)`;
                solverStatus.style.color = '#d9534f';
                gameBoard.innerHTML = `<p>無法解算此謎題，請檢查初始設定是否有誤或過於複雜。</p>`;
            }
        }, 50);
    }
    
    /**
     * 【已校驗】此函式確保每個水單位都被渲染為獨立的 div
     */
     function renderState(state) {
        gameBoard.innerHTML = '';
        let globalCupIndex = 0;

        cupsPerRow.forEach(numCupsInRow => {
            if (numCupsInRow === 0) return;

            const rowDiv = document.createElement('div');
            rowDiv.className = 'cup-row';

            for (let i = 0; i < numCupsInRow; i++) {
                // 1. 創建 wrapper
                const cupWrapper = document.createElement('div');
                cupWrapper.className = 'cup-wrapper';

                // 2. 創建標籤並添加到 wrapper
                const label = document.createElement('div');
                label.className = 'cup-label';
                label.textContent = `杯子 ${globalCupIndex + 1}`;
                cupWrapper.appendChild(label);

                // 3. 創建杯子並填滿水
                const cupDiv = document.createElement('div');
                cupDiv.className = 'cup';

                const cupData = state[globalCupIndex];
                if (Array.isArray(cupData)) {
                    cupData.forEach(colorId => {
                        const waterBlock = document.createElement('div');
                        waterBlock.className = 'water-block';
                        waterBlock.style.backgroundColor = getColor(colorId);
                        waterBlock.textContent = colorId;
                        waterBlock.style.height = (100 / cupCapacity) + '%';
                        cupDiv.appendChild(waterBlock);
                    });
                }
                
                // 4. 將杯子添加到 wrapper，然後將 wrapper 添加到行
                cupWrapper.appendChild(cupDiv);
                rowDiv.appendChild(cupWrapper);
                globalCupIndex++;
            }
            gameBoard.appendChild(rowDiv);
        });
    }



    // 其他輔助 UI 函式 (無變動)
    function updateDisplay() { renderState(allStates[currentStep]); updateStepControls(); updateStepDescription(); }
    function updateStepControls() { const totalSteps = solutionPath.length; stepInfo.textContent = `步驟 ${currentStep} / ${totalSteps}`; btnPrevStep.disabled = currentStep === 0; btnNextStep.disabled = currentStep === totalSteps; }
    function resetStepControls() { stepInfo.textContent = `步驟 0 / 0`; btnPrevStep.disabled = true; btnNextStep.disabled = true; stepDescription.textContent = '請點擊「開始解算」'; }
    function updateStepDescription() { if (currentStep === 0) { stepDescription.textContent = '初始狀態。'; } else { const [from, to] = solutionPath[currentStep - 1]; stepDescription.textContent = `將 杯子 ${from + 1} 的水 倒入 杯子 ${to + 1}`; } if (currentStep === solutionPath.length && solutionPath.length > 0) { stepDescription.textContent += ' -> 已完成！'; } }
    function navigateStep(direction) { const newStep = currentStep + direction; if (newStep >= 0 && newStep < allStates.length) { currentStep = newStep; updateDisplay(); } }
    function updateFullSolutionText() { if (solutionPath.length === 0) { fullSolutionText.textContent = '沒有步驟。'; return; } fullSolutionText.textContent = solutionPath.map(([from, to], i) => `步驟 ${i + 1}: 將杯子 ${from + 1} 的水倒入杯子 ${to + 1}`).join('\n'); }
    function toggleFullSolution() { fullSolutionText.style.display = fullSolutionText.style.display === 'none' ? 'block' : 'none'; }
    function getColor(id) { const colors = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f1c40f', '#e67e22', '#1abc9c', '#d35400', '#c0392b', '#8e44ad', '#27ae60', '#f39c12']; return colors[(id - 1) % colors.length]; }
});