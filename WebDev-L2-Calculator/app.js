/**
 * AstraCalc Pro - Suite Architecture Core Implementation
 * Designed under strict engineering modular protocols. Manual math expression parsers.
 */

(function () {
    'use strict';

    // Global Operational Application State Controller
    const AppState = {
        currentMode: 'standard',
        expression: '',
        result: '0',
        lastAnswer: '0',
        history: [],
        memory: 0,
        programmerBase: 10,
        programmerValue: 0
    };

    // DOM Element Node Registry Cache
    const DOM = {
        sidebar: document.getElementById('sidebar'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        viewTitle: document.getElementById('viewTitle'),
        historySidebar: document.getElementById('historySidebar'),
        historyToggleBtn: document.getElementById('historyToggleBtn'),
        historyItemsContainer: document.getElementById('historyItemsContainer'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn'),
        openSettingsBtn: document.getElementById('openSettingsBtn'),
        closeSettingsBtn: document.getElementById('closeSettingsBtn'),
        settingsModal: document.getElementById('settingsModal'),
        toastContainer: document.getElementById('toastContainer'),
        
        // Modules value entry points
        standardExpr: document.getElementById('standardExpr'),
        standardResult: document.getElementById('standardResult'),
        scientificExpr: document.getElementById('scientificExpr'),
        scientificResult: document.getElementById('scientificResult'),
        programmerDisplay: document.getElementById('programmerDisplay'),
        decReadout: document.getElementById('decReadout'),
        hexReadout: document.getElementById('hexReadout'),
        octReadout: document.getElementById('octReadout'),
        binReadout: document.getElementById('binReadout'),
        matrixAContainer: document.getElementById('matrixAContainer'),
        matrixBContainer: document.getElementById('matrixBContainer'),
        matrixResultView: document.getElementById('matrixResultView'),
        
        // Financial parameters
        emiPrincipal: document.getElementById('emiPrincipal'),
        emiRate: document.getElementById('emiRate'),
        emiTenure: document.getElementById('emiTenure'),
        calcEmiBtn: document.getElementById('calcEmiBtn'),
        emiOutput: document.getElementById('emiOutput'),
        taxAmount: document.getElementById('taxAmount'),
        taxRate: document.getElementById('taxRate'),
        taxAddBtn: document.getElementById('taxAddBtn'),
        taxRemoveBtn: document.getElementById('taxRemoveBtn'),
        taxOutput: document.getElementById('taxOutput')
    };

    // Core Init Framework Hook 
    window.addEventListener('DOMContentLoaded', () => {
        InitApplicationModules();
        RegisterEventHandlers();
        RenderMatrixGrids();
        PushNotificationToast('AstraCalc Engine Ready (Offline Production Mode)');
    });

    function InitApplicationModules() {
        // Apply default structural elements values safely
        document.body.setAttribute('data-theme', 'midnight');
        document.body.setAttribute('data-radius', 'medium');
        document.body.setAttribute('data-animation', 'normal');
    }

    function RegisterEventHandlers() {
        // Primary Workspace Modes Routing Link Switcher
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const button = e.currentTarget;
                document.querySelectorAll('.menu-item').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const targetMode = button.getAttribute('data-mode');
                SwitchCalculatorWorkspaceModule(targetMode);
                if(window.innerWidth <= 768) DOM.sidebar.classList.remove('mobile-open');
            });
        });

        // Mobile responsive layout triggers
        if(DOM.sidebarToggle) {
            DOM.sidebarToggle.addEventListener('click', () => {
                DOM.sidebar.classList.toggle('mobile-open');
            });
        }

        // Configuration Experience Personalization Modal Interactivity
        DOM.openSettingsBtn.addEventListener('click', () => DOM.settingsModal.classList.add('active'));
        DOM.closeSettingsBtn.addEventListener('click', () => DOM.settingsModal.classList.remove('active'));
        
        // Layout Customizers Custom Properties Swaps
        document.querySelectorAll('.swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
                e.currentTarget.classList.add('active');
                document.body.setAttribute('data-theme', e.currentTarget.getAttribute('data-swatch'));
            });
        });

        document.querySelectorAll('.accent-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                document.querySelectorAll('.accent-dot').forEach(d => d.classList.remove('active'));
                e.currentTarget.classList.add('active');
                document.body.setAttribute('data-accent', e.currentTarget.getAttribute('data-accent'));
            });
        });

        document.getElementById('settingRadius').addEventListener('change', (e) => {
            document.body.setAttribute('data-radius', e.target.value);
        });
        document.getElementById('settingFont').addEventListener('change', (e) => {
            document.body.setAttribute('data-font', e.target.value);
        });
        document.getElementById('settingAnimation').addEventListener('change', (e) => {
            document.body.setAttribute('data-animation', e.target.value);
        });

        // History Log Drawers Triggers Toggle Controls
        DOM.historyToggleBtn.addEventListener('click', () => {
            DOM.historySidebar.classList.toggle('collapsed');
        });
        DOM.clearHistoryBtn.addEventListener('click', () => {
            AppState.history = [];
            RefreshHistoryViewLog();
            PushNotificationToast('Calculation history cleared');
        });

        // Numerical And Operational Keypads Grids Intercept
        document.querySelectorAll('.standard-grid .btn-num, .standard-grid .btn-op').forEach(btn => {
            btn.addEventListener('click', (e) => HandleStandardInput(e.currentTarget));
        });
        document.querySelectorAll('.standard-grid .btn-func, .standard-grid .btn-action').forEach(btn => {
            btn.addEventListener('click', (e) => HandleStandardActions(e.currentTarget));
        });

        document.querySelectorAll('.scientific-grid .btn-num, .scientific-grid .btn-op, .scientific-grid .btn-sci').forEach(btn => {
            btn.addEventListener('click', (e) => HandleScientificInput(e.currentTarget));
        });
        document.querySelectorAll('.scientific-grid .btn-func, .scientific-grid .btn-action').forEach(btn => {
            btn.addEventListener('click', (e) => HandleScientificActions(e.currentTarget));
        });
        document.querySelectorAll('.memory-strip .mem-btn').forEach(btn => {
            btn.addEventListener('click', (e) => HandleMemoryOperations(e.currentTarget.getAttribute('data-mem')));
        });

        // Programmer Mode Matrix Input Setup Triggers
        document.querySelectorAll('.programmer-grid .btn-num, .programmer-grid .btn-alpha').forEach(btn => {
            btn.addEventListener('click', (e) => HandleProgrammerNumericalEntry(e.currentTarget));
        });
        document.querySelectorAll('.programmer-grid .btn-func, .programmer-grid .btn-op, .programmer-grid .btn-action').forEach(btn => {
            btn.addEventListener('click', (e) => HandleProgrammerOperationalAction(e.currentTarget));
        });
        document.querySelectorAll('.radix-row').forEach(row => {
            row.addEventListener('click', (e) => {
                document.querySelectorAll('.radix-row').forEach(r => r.classList.remove('active'));
                e.currentTarget.classList.add('active');
                AppState.programmerBase = parseInt(e.currentTarget.getAttribute('data-base'), 10);
                SyncProgrammerRadixDisplays();
            });
        });

        // Matrix Operational Control Row Actions Triggers
        document.querySelectorAll('[data-matrix-op]').forEach(btn => {
            btn.addEventListener('click', (e) => ExecuteMatrixOperation(e.currentTarget.getAttribute('data-matrix-op')));
        });

        // Financial Suites Controls Submits Triggers
        if (DOM.calcEmiBtn) DOM.calcEmiBtn.addEventListener('click', ComputeLoanEmiValue);
        if (DOM.taxAddBtn) DOM.taxAddBtn.addEventListener('click', () => HandleTaxCalculation(true));
        if (DOM.taxRemoveBtn) DOM.taxRemoveBtn.addEventListener('click', () => HandleTaxCalculation(false));

        // Global Physical Keyboard Intercept Hook Map
        document.addEventListener('keydown', (e) => {
            if (document.activeElement.tagName === 'INPUT') return; // Bypass if typing in forms
            
            if (AppState.currentMode === 'standard' || AppState.currentMode === 'scientific') {
                if (e.key >= '0' && e.key <= '9' || e.key === '.') {
                    AppendTokenToExpression(e.key);
                } else if (['+', '-', '*', '/'].includes(e.key)) {
                    AppendTokenToExpression(e.key);
                } else if (e.key === 'Enter' || e.key === '=') {
                    e.preventDefault();
                    ProcessActiveModuleEvaluation();
                } else if (e.key === 'Backspace') {
                    PerformExpressionBackspace();
                } else if (e.key === 'Escape') {
                    ClearActiveExpressionWorkspace();
                }
            }
        });
    }

    function SwitchCalculatorWorkspaceModule(mode) {
        AppState.currentMode = mode;
        
        // Dynamic title update mapping
        const modeTitles = {
            standard: 'Standard Mode',
            scientific: 'Scientific Lab',
            programmer: 'Programmer Bitwise',
            matrix: 'Matrix Engine',
            business: 'Business & Finance'
        };
        DOM.viewTitle.textContent = modeTitles[mode] || 'AstraCalc Pro';

        // Toggle UI panel container views targets
        document.querySelectorAll('.calc-module').forEach(mod => {
            if (mod.getAttribute('idmod') === mode) {
                mod.classList.add('active');
            } else {
                mod.classList.remove('active');
            }
        });
    }

    /* =========================================================================
     * SECURE SECURE ARITHMETIC MATHEMATICAL MANUAL EXPRESSION PARSER ENGINE
     * Implements strict custom multi-token split algorithms. No eval() vectors.
     * ========================================================================= */
    function CleanTokenizeStringExpression(exprStr) {
        const tokens = [];
        let currentNumBuffer = '';
        
        // Normalize custom display operators representations back to engine math tokens
        let cleanExprStr = exprStr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');

        for (let i = 0; i < cleanExprStr.length; i++) {
            const char = cleanExprStr[i];
            
            // Decimal, digits or scientific notations formats matching checks
            if ((char >= '0' && char <= '9') || char === '.' || (char === '-' && (i === 0 || ['+', '-', '*', '/', '^'].includes(cleanExprStr[i - 1])))) {
                currentNumBuffer += char;
            } else {
                if (currentNumBuffer !== '') {
                    tokens.push(parseFloat(currentNumBuffer));
                    currentNumBuffer = '';
                }
                if (['+', '-', '*', '/', '^', '%'].includes(char)) {
                    tokens.push(char);
                }
            }
        }
        if (currentNumBuffer !== '') {
            tokens.push(parseFloat(currentNumBuffer));
        }
        return tokens;
    }

    function ManuallyEvaluateTokenStack(tokens) {
        if (tokens.length === 0) return 0;

        // Pass 1: Exponentials operations calculations loops
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === '^') {
                const base = tokens[i - 1];
                const exponent = tokens[i + 1];
                const res = Math.pow(base, exponent);
                tokens.splice(i - 1, 3, res);
                i--;
            }
        }

        // Pass 2: Higher order operator precedence executions (Multiplication, Division, Modulo)
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === '*' || tokens[i] === '/' || tokens[i] === '%') {
                const left = tokens[i - 1];
                const op = tokens[i];
                const right = tokens[i + 1];
                let res = 0;
                
                switch (op) {
                    case '*': res = left * right; break;
                    case '/': 
                        if (right === 0) return 'Error: Division by Zero';
                        res = left / right; 
                        break;
                    case '%': res = left % right; break;
                }
                tokens.splice(i - 1, 3, res);
                i--;
            }
        }

        // Pass 3: Lower precedence operations additions subtractions logic loops
        let totalVal = tokens[0];
        if (typeof totalVal === 'string') return totalVal; // Capture prior evaluation errors directly

        for (let i = 1; i < tokens.length; i += 2) {
            const op = tokens[i];
            const rightVal = tokens[i + 1];
            if (op === '+') totalVal += rightVal;
            if (op === '-') totalVal -= rightVal;
        }

        return totalVal;
    }

    function ExecuteSecureExpressionParser() {
        if (!AppState.expression) return;
        
        try {
            const tokens = CleanTokenizeStringExpression(AppState.expression);
            const calculatedOutput = ManuallyEvaluateTokenStack(tokens);
            
            if (typeof calculatedOutput === 'number' && isNaN(calculatedOutput)) {
                throw new Error('Invalid Math Input');
            }

            const historicalRecord = {
                expr: AppState.expression,
                res: calculatedOutput.toString()
            };

            AppState.result = calculatedOutput.toString();
            AppState.lastAnswer = AppState.result;
            AppState.history.push(historicalRecord);
            
            RefreshHistoryViewLog();
            UpdateWorkspaceDisplaysOutputs(true);
        } catch (err) {
            AppState.result = 'Error';
            UpdateWorkspaceDisplaysOutputs(false);
        }
    }

    /* =========================================================================
     * WORKSPACE LAYER LOGIC EVENT DISPATCH ROUTERS HANDLERS
     * ========================================================================= */
    function AppendTokenToExpression(token) {
        if (AppState.result !== '0' && AppState.expression === '') {
            // Operator chain handling protocol directly
            if (['+', '-', '*', '/', '^'].includes(token)) {
                AppState.expression = AppState.result;
            }
        }
        AppState.expression += token;
        UpdateWorkspaceDisplaysOutputs(false);
    }

    function PerformExpressionBackspace() {
        AppState.expression = AppState.expression.slice(0, -1);
        UpdateWorkspaceDisplaysOutputs(false);
    }

    function ClearActiveExpressionWorkspace() {
        AppState.expression = '';
        AppState.result = '0';
        UpdateWorkspaceDisplaysOutputs(false);
    }

    function ProcessActiveModuleEvaluation() {
        ExecuteSecureExpressionParser();
        AppState.expression = '';
    }

    function UpdateWorkspaceDisplaysOutputs(isFinalEval) {
        if (AppState.currentMode === 'standard') {
            DOM.standardExpr.textContent = AppState.expression;
            DOM.standardResult.value = isFinalEval ? AppState.result : (AppState.expression || '0');
        } else if (AppState.currentMode === 'scientific') {
            DOM.scientificExpr.textContent = AppState.expression;
            DOM.scientificResult.value = isFinalEval ? AppState.result : (AppState.expression || '0');
        }
    }

    function HandleStandardInput(btnElement) {
        const valueToken = btnElement.getAttribute('data-token') || btnElement.textContent.trim();
        AppendTokenToExpression(valueToken);
    }

    function HandleStandardActions(btnElement) {
        const action = btnElement.getAttribute('data-action');
        if (action === 'clearAll' || action === 'clear') ClearActiveExpressionWorkspace();
        if (action === 'backspace') PerformExpressionBackspace();
        if (action === 'evaluate') ProcessActiveModuleEvaluation();
    }

    function HandleScientificInput(btnElement) {
        if (btnElement.hasAttribute('data-sci')) {
            ExecuteScientificFunctionTransform(btnElement.getAttribute('data-sci'));
        } else {
            const valToken = btnElement.getAttribute('data-token') || btnElement.textContent.trim();
            AppendTokenToExpression(valToken);
        }
    }

    function HandleScientificActions(btnElement) {
        const action = btnElement.getAttribute('data-action');
        if (action === 'clearAll') ClearActiveExpressionWorkspace();
        if (action === 'backspace') PerformExpressionBackspace();
        if (action === 'evaluate') ProcessActiveModuleEvaluation();
    }

    function ExecuteScientificFunctionTransform(operationType) {
        let executionTargetValue = parseFloat(AppState.expression || AppState.result || '0');
        if (isNaN(executionTargetValue)) return;

        let resultOut = 0;
        switch (operationType) {
            case 'sin': resultOut = Math.sin(executionTargetValue); break;
            case 'cos': resultOut = Math.cos(executionTargetValue); break;
            case 'tan': resultOut = Math.tan(executionTargetValue); break;
            case 'log': resultOut = Math.log10(executionTargetValue); break;
            case 'ln': resultOut = Math.log(executionTargetValue); break;
            case 'sqrt': resultOut = Math.sqrt(executionTargetValue); break;
            case 'sqr': resultOut = Math.pow(executionTargetValue, 2); break;
            case 'cube': resultOut = Math.pow(executionTargetValue, 3); break;
            case 'pi': resultOut = Math.PI; break;
            case 'e': resultOut = Math.E; break;
            case 'abs': resultOut = Math.abs(executionTargetValue); break;
            case 'neg': resultOut = executionTargetValue * -1; break;
            case 'fact':
                if (executionTargetValue < 0) { resultOut = 'Error'; break; }
                let fact = 1;
                for (let i = 2; i <= Math.floor(executionTargetValue); i++) fact *= i;
                resultOut = fact;
                break;
            default: return;
        }

        AppState.expression = '';
        AppState.result = resultOut.toString();
        AppState.lastAnswer = AppState.result;
        UpdateWorkspaceDisplaysOutputs(true);
    }

    function HandleMemoryOperations(memAction) {
        let activeVal = parseFloat(AppState.result || AppState.expression || '0');
        switch (memAction) {
            case 'mc': AppState.memory = 0; PushNotificationToast('Memory Cleared'); break;
            case 'mr': AppState.expression = AppState.memory.toString(); UpdateWorkspaceDisplaysOutputs(false); break;
            case 'ms': AppState.memory = activeVal; PushNotificationToast(`Stored: ${AppState.memory}`); break;
            case 'm+': AppState.memory += activeVal; PushNotificationToast(`Memory Incremented`); break;
            case 'm-': AppState.memory -= activeVal; PushNotificationToast(`Memory Decremented`); break;
        }
    }

    /* =========================================================================
     * PROGRAMMER RADIX BASE CALCULATIONS FUNCTIONS MODES
     * ========================================================================= */
    function HandleProgrammerNumericalEntry(btnElement) {
        let entryText = btnElement.textContent.trim();
        let activeStr = DOM.programmerDisplay.value === '0' ? '' : DOM.programmerDisplay.value;
        
        // Structural validation block for numeric entries relative to current base active state
        if (AppState.programmerBase === 2 && !['0','1'].includes(entryText)) return;
        if (AppState.programmerBase === 8 && (parseInt(entryText, 10) > 7)) return;
        if (AppState.programmerBase === 10 && btnElement.classList.contains('btn-alpha')) return;

        activeStr += entryText;
        AppState.programmerValue = parseInt(activeStr, AppState.programmerBase) || 0;
        DOM.programmerDisplay.value = activeStr;
        SyncProgrammerRadixDisplays();
    }

    function HandleProgrammerOperationalAction(btnElement) {
        const action = btnElement.getAttribute('data-action');
        const progOp = btnElement.getAttribute('data-prog-op');

        if (action === 'clearAll') {
            AppState.programmerValue = 0;
            DOM.programmerDisplay.value = '0';
            SyncProgrammerRadixDisplays();
            return;
        }
        if (action === 'backspace') {
            let s = DOM.programmerDisplay.value.slice(0, -1);
            DOM.programmerDisplay.value = s || '0';
            AppState.programmerValue = parseInt(s, AppState.programmerBase) || 0;
            SyncProgrammerRadixDisplays();
            return;
        }

        if (progOp) {
            // Apply single bit operation processing variations directly
            if (progOp === 'NOT') {
                AppState.programmerValue = ~AppState.programmerValue;
                SyncProgrammerRadixDisplays();
                DOM.programmerDisplay.value = AppState.programmerValue.toString(AppState.programmerBase).toUpperCase();
                PushNotificationToast('Applied Unary bitwise NOT');
            } else {
                PushNotificationToast(`Operation ${progOp} registered for execution processing parsing`);
            }
        }
    }

    function SyncProgrammerRadixDisplays() {
        let currentDecimalVal = AppState.programmerValue;
        DOM.decReadout.textContent = currentDecimalVal.toString(10);
        DOM.hexReadout.textContent = currentDecimalVal.toString(16).toUpperCase();
        DOM.octReadout.textContent = currentDecimalVal.toString(8);
        DOM.binReadout.textContent = currentDecimalVal.toString(2);
    }

    /* =========================================================================
     * MATRIX COMPONENT ENGINE LOGIC CONTROLLERS
     * ========================================================================= */
    function RenderMatrixGrids() {
        DOM.matrixAContainer.innerHTML = '';
        DOM.matrixBContainer.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cellA = document.createElement('input');
            cellA.type = 'number'; cellA.className = 'matrix-cell'; cellA.value = (i === 0 || i === 4 || i === 8) ? '1' : '0';
            cellA.setAttribute('id-cell', `a-${i}`);
            DOM.matrixAContainer.appendChild(cellA);

            const cellB = document.createElement('input');
            cellB.type = 'number'; cellB.className = 'matrix-cell'; cellB.value = (i === 0 || i === 4 || i === 8) ? '2' : '0';
            cellB.setAttribute('id-cell', `b-${i}`);
            DOM.matrixBContainer.appendChild(cellB);
        }
    }

    function GatherMatrixValues(prefix) {
        const values = [];
        for (let i = 0; i < 9; i++) {
            const el = document.querySelector(`[id-cell="${prefix}-${i}"]`);
            values.push(parseFloat(el.value || '0'));
        }
        return values;
    }

    function FormatMatrixOutputMarkup(matrixArray) {
        return `[ ${matrixArray[0]}, ${matrixArray[1]}, ${matrixArray[2]} ]\n` +
               `[ ${matrixArray[3]}, ${matrixArray[4]}, ${matrixArray[5]} ]\n` +
               `[ ${matrixArray[6]}, ${matrixArray[7]}, ${matrixArray[8]} ]`;
    }

    function ExecuteMatrixOperation(opType) {
        const matA = GatherMatrixValues('a');
        const matB = GatherMatrixValues('b');
        let outView = DOM.matrixResultView;

        if (opType === 'add') {
            const out = matA.map((v, idx) => v + matB[idx]);
            outView.textContent = FormatMatrixOutputMarkup(out);
        } else if (opType === 'subtract') {
            const out = matA.map((v, idx) => v - matB[idx]);
            outView.textContent = FormatMatrixOutputMarkup(out);
        } else if (opType === 'transposeA') {
            const out = [matA[0], matA[3], matA[6], matA[1], matA[4], matA[7], matA[2], matA[5], matA[8]];
            outView.textContent = FormatMatrixOutputMarkup(out);
        } else if (opType === 'detA') {
            const det = matA[0]*(matA[4]*matA[8] - matA[5]*matA[7]) - 
                        matA[1]*(matA[3]*matA[8] - matA[5]*matA[6]) + 
                        matA[2]*(matA[3]*matA[7] - matA[4]*matA[6]);
            outView.textContent = `Determinant of Matrix A = ${det}`;
        } else if (opType === 'clearMatrix') {
            RenderMatrixGrids();
            outView.textContent = 'Matrices identity state restored.';
        }
    }

    /* =========================================================================
     * BUSINESS AND FINANCE COMPUTATIONS ENGINES
     * ========================================================================= */
    function ComputeLoanEmiValue() {
        const P = parseFloat(DOM.emiPrincipal.value || '0');
        const yearlyRate = parseFloat(DOM.emiRate.value || '0');
        const N = parseFloat(DOM.emiTenure.value || '0');

        if (P <= 0 || yearlyRate <= 0 || N <= 0) {
            DOM.emiOutput.textContent = 'Enter valid parameters metrics';
            return;
        }

        const R = (yearlyRate / 12) / 100;
        const emiResult = P * R * Math.pow(1 + R, N) / (Math.pow(1 + R, N) - 1);
        DOM.emiOutput.textContent = `Monthly Installment: PKR ${emiResult.toFixed(2)}`;
    }

    function HandleTaxCalculation(isAddingTax) {
        const amount = parseFloat(DOM.taxAmount.value || '0');
        const rate = parseFloat(DOM.taxRate.value || '0');

        if (amount <= 0 || rate <= 0) {
            DOM.taxOutput.textContent = 'Enter valid transaction metrics';
            return;
        }

        let dynamicDelta = amount * (rate / 100);
        let finalOutputVal = isAddingTax ? (amount + dynamicDelta) : (amount - dynamicDelta);
        DOM.taxOutput.textContent = `Result Total: PKR ${finalOutputVal.toFixed(2)} (Tax Share: PKR ${dynamicDelta.toFixed(2)})`;
    }

    /* =========================================================================
     * HISTORICAL LOG PANELS RENDERING FRAMEWORKS
     * ========================================================================= */
    function RefreshHistoryViewLog() {
        DOM.historyItemsContainer.innerHTML = '';
        if (AppState.history.length === 0) {
            DOM.historyItemsContainer.innerHTML = '<div class="history-empty-state">No operations in queue.</div>';
            return;
        }

        AppState.history.forEach((item) => {
            const node = document.createElement('div');
            node.className = 'history-item-node';
            node.innerHTML = `
                <span class="history-node-expr">${item.expr} =</span>
                <span class="history-node-res">${item.res}</span>
            `;
            node.addEventListener('click', () => {
                AppState.expression = item.expr;
                UpdateWorkspaceDisplaysOutputs(false);
            });
            DOM.historyItemsContainer.appendChild(node);
        });
    }

    /* =========================================================================
     * LIVE EXPERIENCE MICRO-NOTIFICATIONS TOAST INSERTER
     * ========================================================================= */
    function PushNotificationToast(messageText) {
        const element = document.createElement('div');
        element.className = 'toast-node';
        element.textContent = messageText;
        DOM.toastContainer.appendChild(element);

        setTimeout(() => {
            element.style.opacity = '0';
            setTimeout(() => element.remove(), 300);
        }, 3200);
    }

})();