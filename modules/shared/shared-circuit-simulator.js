/**
 * CSC210 Circuit Simulation Library
 * Version: 1.0.0
 * 
 * This library provides interactive circuit simulation capabilities
 * for all CSC210 learning modules, including logic gates, truth tables,
 * and visual circuit representations.
 */

/* ===== BASE CLASSES ===== */

/**
 * Base class for all circuit components
 */
class CircuitComponent {
    constructor(id, type, x = 0, y = 0) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.inputs = [];
        this.outputs = [];
        this.selected = false;
        this.width = 60;
        this.height = 40;
    }
    
    addInput(input) {
        this.inputs.push(input);
    }
    
    addOutput(output) {
        this.outputs.push(output);
    }
    
    getBoundingBox() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }
    
    containsPoint(x, y) {
        const bbox = this.getBoundingBox();
        return x >= bbox.left && x <= bbox.right && y >= bbox.top && y <= bbox.bottom;
    }
    
    // Abstract methods to be implemented by subclasses
    compute() {
        throw new Error('compute() method must be implemented by subclass');
    }
    
    draw(ctx) {
        throw new Error('draw() method must be implemented by subclass');
    }
}

/**
 * Connection between circuit components
 */
class CircuitConnection {
    constructor(fromComponent, fromOutput, toComponent, toInput) {
        this.from = fromComponent;
        this.fromOutput = fromOutput;
        this.to = toComponent;
        this.toInput = toInput;
        this.value = false;
        this.animated = false;
    }
    
    draw(ctx, animated = false) {
        const fromPos = this.getOutputPosition();
        const toPos = this.getInputPosition();
        
        ctx.strokeStyle = this.value ? '#059669' : '#64748b';
        ctx.lineWidth = this.value && animated ? 3 : 2;
        ctx.beginPath();
        
        // Draw curved connection line
        const controlPoint1X = fromPos.x + (toPos.x - fromPos.x) * 0.5;
        const controlPoint1Y = fromPos.y;
        const controlPoint2X = fromPos.x + (toPos.x - fromPos.x) * 0.5;
        const controlPoint2Y = toPos.y;
        
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.bezierCurveTo(controlPoint1X, controlPoint1Y, controlPoint2X, controlPoint2Y, toPos.x, toPos.y);
        ctx.stroke();
        
        // Draw signal flow animation if active
        if (this.value && animated) {
            this.drawSignalFlow(ctx, fromPos, toPos);
        }
    }
    
    drawSignalFlow(ctx, fromPos, toPos) {
        const time = Date.now() / 1000;
        const progress = (time * 2) % 1; // 2 signals per second
        
        const x = fromPos.x + (toPos.x - fromPos.x) * progress;
        const y = fromPos.y + (toPos.y - fromPos.y) * progress;
        
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    getOutputPosition() {
        return {
            x: this.from.x + this.from.width / 2,
            y: this.from.y
        };
    }
    
    getInputPosition() {
        return {
            x: this.to.x - this.to.width / 2,
            y: this.to.y
        };
    }
}

/* ===== LOGIC GATES ===== */

/**
 * AND Gate implementation
 */
class ANDGate extends CircuitComponent {
    constructor(id, x = 0, y = 0) {
        super(id, 'AND', x, y);
        this.inputs = [false, false];
        this.output = false;
    }
    
    compute() {
        this.output = this.inputs[0] && this.inputs[1];
        return this.output;
    }
    
    draw(ctx) {
        const bbox = this.getBoundingBox();
        
        // Draw gate body
        ctx.fillStyle = this.selected ? '#e2e8f0' : '#f8fafc';
        ctx.strokeStyle = this.selected ? '#2563eb' : '#64748b';
        ctx.lineWidth = this.selected ? 2 : 1;
        
        ctx.beginPath();
        ctx.roundRect(bbox.left, bbox.top, this.width, this.height, 5);
        ctx.fill();
        ctx.stroke();
        
        // Draw label
        ctx.fillStyle = '#1e293b';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('AND', this.x, this.y + 4);
        
        // Draw input/output pins
        this.drawPins(ctx);
    }
    
    drawPins(ctx) {
        const bbox = this.getBoundingBox();
        
        // Input pins
        ctx.fillStyle = this.inputs[0] ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.left, this.y - 8, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = this.inputs[1] ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.left, this.y + 8, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Output pin
        ctx.fillStyle = this.output ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.right, this.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

/**
 * OR Gate implementation
 */
class ORGate extends CircuitComponent {
    constructor(id, x = 0, y = 0) {
        super(id, 'OR', x, y);
        this.inputs = [false, false];
        this.output = false;
    }
    
    compute() {
        this.output = this.inputs[0] || this.inputs[1];
        return this.output;
    }
    
    draw(ctx) {
        const bbox = this.getBoundingBox();
        
        ctx.fillStyle = this.selected ? '#e2e8f0' : '#f8fafc';
        ctx.strokeStyle = this.selected ? '#2563eb' : '#64748b';
        ctx.lineWidth = this.selected ? 2 : 1;
        
        ctx.beginPath();
        ctx.roundRect(bbox.left, bbox.top, this.width, this.height, 5);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#1e293b';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('OR', this.x, this.y + 4);
        
        this.drawPins(ctx);
    }
    
    drawPins(ctx) {
        const bbox = this.getBoundingBox();
        
        // Input pins
        ctx.fillStyle = this.inputs[0] ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.left, this.y - 8, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = this.inputs[1] ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.left, this.y + 8, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Output pin
        ctx.fillStyle = this.output ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.right, this.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

/**
 * XOR Gate implementation
 */
class XORGate extends CircuitComponent {
    constructor(id, x = 0, y = 0) {
        super(id, 'XOR', x, y);
        this.inputs = [false, false];
        this.output = false;
    }
    
    compute() {
        this.output = this.inputs[0] !== this.inputs[1];
        return this.output;
    }
    
    draw(ctx) {
        const bbox = this.getBoundingBox();
        
        ctx.fillStyle = this.selected ? '#e2e8f0' : '#f8fafc';
        ctx.strokeStyle = this.selected ? '#2563eb' : '#64748b';
        ctx.lineWidth = this.selected ? 2 : 1;
        
        ctx.beginPath();
        ctx.roundRect(bbox.left, bbox.top, this.width, this.height, 5);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#1e293b';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('XOR', this.x, this.y + 4);
        
        this.drawPins(ctx);
    }
    
    drawPins(ctx) {
        const bbox = this.getBoundingBox();
        
        // Input pins
        ctx.fillStyle = this.inputs[0] ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.left, this.y - 8, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = this.inputs[1] ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.left, this.y + 8, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Output pin
        ctx.fillStyle = this.output ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.right, this.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

/**
 * NOT Gate implementation
 */
class NOTGate extends CircuitComponent {
    constructor(id, x = 0, y = 0) {
        super(id, 'NOT', x, y);
        this.inputs = [false];
        this.output = false;
        this.width = 50;
    }
    
    compute() {
        this.output = !this.inputs[0];
        return this.output;
    }
    
    draw(ctx) {
        const bbox = this.getBoundingBox();
        
        ctx.fillStyle = this.selected ? '#e2e8f0' : '#f8fafc';
        ctx.strokeStyle = this.selected ? '#2563eb' : '#64748b';
        ctx.lineWidth = this.selected ? 2 : 1;
        
        ctx.beginPath();
        ctx.roundRect(bbox.left, bbox.top, this.width, this.height, 5);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#1e293b';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NOT', this.x, this.y + 4);
        
        this.drawPins(ctx);
    }
    
    drawPins(ctx) {
        const bbox = this.getBoundingBox();
        
        // Input pin
        ctx.fillStyle = this.inputs[0] ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.left, this.y, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Output pin
        ctx.fillStyle = this.output ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.right, this.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

/* ===== INPUT/OUTPUT COMPONENTS ===== */

/**
 * Input component for circuit simulation
 */
class InputComponent extends CircuitComponent {
    constructor(id, label = 'IN', x = 0, y = 0) {
        super(id, 'INPUT', x, y);
        this.label = label;
        this.value = false;
        this.width = 40;
    }
    
    compute() {
        return this.value;
    }
    
    toggle() {
        this.value = !this.value;
        return this.value;
    }
    
    draw(ctx) {
        const bbox = this.getBoundingBox();
        
        ctx.fillStyle = this.value ? '#059669' : '#f8fafc';
        ctx.strokeStyle = this.value ? '#047857' : '#64748b';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(bbox.left, bbox.top, this.width, this.height, 5);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.value ? 'white' : '#1e293b';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x, this.y - 2);
        ctx.fillText(this.value ? '1' : '0', this.x, this.y + 10);
        
        // Output pin
        ctx.fillStyle = this.value ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.right, this.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

/**
 * Output component for circuit simulation
 */
class OutputComponent extends CircuitComponent {
    constructor(id, label = 'OUT', x = 0, y = 0) {
        super(id, 'OUTPUT', x, y);
        this.label = label;
        this.value = false;
        this.width = 50;
    }
    
    compute() {
        // Output components don't compute, they display
        return this.value;
    }
    
    setValue(value) {
        this.value = value;
    }
    
    draw(ctx) {
        const bbox = this.getBoundingBox();
        
        ctx.fillStyle = this.value ? '#059669' : '#f8fafc';
        ctx.strokeStyle = this.value ? '#047857' : '#64748b';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(bbox.left, bbox.top, this.width, this.height, 5);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = this.value ? 'white' : '#1e293b';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.label, this.x, this.y - 2);
        ctx.fillText(this.value ? '1' : '0', this.x, this.y + 10);
        
        // Input pin
        ctx.fillStyle = this.value ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.left, this.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

/* ===== CIRCUIT SIMULATOR ===== */

/**
 * Main circuit simulator class
 */
class CircuitSimulator {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.components = [];
        this.connections = [];
        this.selectedComponent = null;
        this.isSimulating = false;
        this.animationFrame = null;
        
        // Configuration options
        this.options = {
            enableAnimation: true,
            showGrid: false,
            gridSize: 20,
            allowDrag: true,
            ...options
        };
        
        this.setupCanvas();
        this.setupEventListeners();
    }
    
    setupCanvas() {
        // Set up high-DPI canvas
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Check if clicking on a component
        const clickedComponent = this.getComponentAt(x, y);
        
        if (clickedComponent) {
            if (clickedComponent.type === 'INPUT') {
                clickedComponent.toggle();
                this.simulate();
                this.render();
            } else {
                this.selectComponent(clickedComponent);
            }
        } else {
            this.selectComponent(null);
        }
    }
    
    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Update cursor based on what's under mouse
        const component = this.getComponentAt(x, y);
        if (component) {
            this.canvas.style.cursor = component.type === 'INPUT' ? 'pointer' : 'move';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }
    
    handleMouseDown(event) {
        // Implementation for dragging components
        if (this.options.allowDrag) {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            const component = this.getComponentAt(x, y);
            if (component && component.type !== 'INPUT' && component.type !== 'OUTPUT') {
                this.dragging = {
                    component: component,
                    offsetX: x - component.x,
                    offsetY: y - component.y
                };
            }
        }
    }
    
    handleMouseUp(event) {
        if (this.dragging) {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            this.dragging.component.x = x - this.dragging.offsetX;
            this.dragging.component.y = y - this.dragging.offsetY;
            
            this.dragging = null;
            this.render();
        }
    }
    
    handleResize() {
        this.setupCanvas();
        this.render();
    }
    
    handleKeyDown(event) {
        if (event.key === 'Delete' && this.selectedComponent) {
            this.removeComponent(this.selectedComponent.id);
        }
        
        if (event.key === 'Escape') {
            this.selectComponent(null);
        }
    }
    
    getComponentAt(x, y) {
        return this.components.find(component => component.containsPoint(x, y));
    }
    
    selectComponent(component) {
        if (this.selectedComponent) {
            this.selectedComponent.selected = false;
        }
        
        this.selectedComponent = component;
        
        if (component) {
            component.selected = true;
        }
        
        this.render();
    }
    
    // Public API methods
    
    addComponent(type, id, x = 100, y = 100, options = {}) {
        let component;
        
        switch (type.toUpperCase()) {
            case 'AND':
                component = new ANDGate(id, x, y);
                break;
            case 'OR':
                component = new ORGate(id, x, y);
                break;
            case 'XOR':
                component = new XORGate(id, x, y);
                break;
            case 'NOT':
                component = new NOTGate(id, x, y);
                break;
            case 'INPUT':
                component = new InputComponent(id, options.label || 'IN', x, y);
                break;
            case 'OUTPUT':
                component = new OutputComponent(id, options.label || 'OUT', x, y);
                break;
            default:
                throw new Error(`Unknown component type: ${type}`);
        }
        
        this.components.push(component);
        this.render();
        return component;
    }
    
    removeComponent(id) {
        const index = this.components.findIndex(comp => comp.id === id);
        if (index !== -1) {
            // Remove connections involving this component
            this.connections = this.connections.filter(conn => 
                conn.from.id !== id && conn.to.id !== id
            );
            
            this.components.splice(index, 1);
            
            if (this.selectedComponent && this.selectedComponent.id === id) {
                this.selectedComponent = null;
            }
            
            this.render();
        }
    }
    
    connectComponents(fromId, fromOutput, toId, toInput) {
        const fromComponent = this.components.find(c => c.id === fromId);
        const toComponent = this.components.find(c => c.id === toId);
        
        if (fromComponent && toComponent) {
            const connection = new CircuitConnection(fromComponent, fromOutput, toComponent, toInput);
            this.connections.push(connection);
            this.render();
            return connection;
        }
        
        return null;
    }
    
    simulate() {
        // Topological sort to determine simulation order
        const sorted = this.topologicalSort();
        
        // Simulate each component in order
        sorted.forEach(component => {
            if (component.type !== 'INPUT') {
                component.compute();
            }
        });
        
        // Update connections
        this.connections.forEach(connection => {
            connection.value = connection.from.compute();
            
            // Update input of connected component
            if (connection.to.type !== 'OUTPUT') {
                connection.to.inputs[connection.toInput] = connection.value;
            } else {
                connection.to.setValue(connection.value);
            }
        });
    }
    
    topologicalSort() {
        // Simple topological sort for component simulation order
        const visited = new Set();
        const result = [];
        
        const visit = (component) => {
            if (visited.has(component.id)) return;
            
            visited.add(component.id);
            
            // Visit dependencies first (components that feed into this one)
            this.connections
                .filter(conn => conn.to.id === component.id)
                .forEach(conn => visit(conn.from));
            
            result.push(component);
        };
        
        this.components.forEach(component => visit(component));
        
        return result;
    }
    
    startAnimation() {
        if (this.isSimulating) return;
        
        this.isSimulating = true;
        
        const animate = () => {
            if (!this.isSimulating) return;
            
            this.simulate();
            this.render();
            
            this.animationFrame = requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    stopAnimation() {
        this.isSimulating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid if enabled
        if (this.options.showGrid) {
            this.drawGrid();
        }
        
        // Draw connections first (behind components)
        this.connections.forEach(connection => {
            connection.draw(this.ctx, this.options.enableAnimation && this.isSimulating);
        });
        
        // Draw components
        this.components.forEach(component => {
            component.draw(this.ctx);
        });
        
        // Draw selection indicator
        if (this.selectedComponent) {
            this.drawSelectionIndicator(this.selectedComponent);
        }
    }
    
    drawGrid() {
        const gridSize = this.options.gridSize;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x <= width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
    }
    
    drawSelectionIndicator(component) {
        const bbox = component.getBoundingBox();
        
        this.ctx.strokeStyle = '#2563eb';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.roundRect(bbox.left - 5, bbox.top - 5, component.width + 10, component.height + 10, 8);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]); // Reset line dash
    }
    
    clear() {
        this.components = [];
        this.connections = [];
        this.selectedComponent = null;
        this.stopAnimation();
        this.render();
    }
    
    getComponentById(id) {
        return this.components.find(c => c.id === id);
    }
    
    exportCircuit() {
        return {
            components: this.components.map(c => ({
                id: c.id,
                type: c.type,
                x: c.x,
                y: c.y,
                value: c.value || c.inputs,
                label: c.label
            })),
            connections: this.connections.map(c => ({
                from: c.from.id,
                fromOutput: c.fromOutput,
                to: c.to.id,
                toInput: c.toInput
            }))
        };
    }
    
    importCircuit(circuitData) {
        this.clear();
        
        // Add components
        circuitData.components.forEach(compData => {
            const component = this.addComponent(compData.type, compData.id, compData.x, compData.y, {
                label: compData.label
            });
            
            if (compData.value !== undefined) {
                if (component.type === 'INPUT') {
                    component.value = compData.value;
                } else {
                    component.inputs = compData.value;
                }
            }
        });
        
        // Add connections
        circuitData.connections.forEach(connData => {
            this.connectComponents(connData.from, connData.fromOutput, connData.to, connData.toInput);
        });
        
        this.render();
    }
}

/* ===== TRUTH TABLE GENERATOR ===== */

/**
 * Utility class for generating and managing truth tables
 */
class TruthTableGenerator {
    static generate(inputs, outputFunction) {
        const numInputs = inputs.length;
        const numRows = Math.pow(2, numInputs);
        const table = [];
        
        for (let i = 0; i < numRows; i++) {
            const row = {};
            
            // Generate input combinations
            inputs.forEach((inputName, index) => {
                row[inputName] = (i >> (numInputs - 1 - index)) & 1;
            });
            
            // Calculate output
            if (typeof outputFunction === 'function') {
                const inputValues = inputs.map(name => row[name]);
                row.output = outputFunction(...inputValues);
            }
            
            table.push(row);
        }
        
        return table;
    }
    
    static renderTable(container, truthTable, options = {}) {
        const table = document.createElement('table');
        table.className = 'truth-table';
        
        // Create header
        const header = table.createTHead();
        const headerRow = header.insertRow();
        
        const inputs = Object.keys(truthTable[0]).filter(key => key !== 'output');
        inputs.forEach(input => {
            const th = document.createElement('th');
            th.textContent = input;
            headerRow.appendChild(th);
        });
        
        if (truthTable[0].hasOwnProperty('output')) {
            const th = document.createElement('th');
            th.textContent = options.outputLabel || 'Output';
            headerRow.appendChild(th);
        }
        
        // Create body
        const tbody = table.createTBody();
        truthTable.forEach((row, index) => {
            const tr = tbody.insertRow();
            tr.setAttribute('data-row', index);
            
            inputs.forEach(input => {
                const td = tr.insertCell();
                td.textContent = row[input];
            });
            
            if (row.hasOwnProperty('output')) {
                const td = tr.insertCell();
                td.textContent = row.output;
            }
        });
        
        // Clear container and add table
        container.innerHTML = '';
        container.appendChild(table);
        
        return table;
    }
    
    static highlightRow(table, rowIndex) {
        // Remove existing highlights
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => row.classList.remove('active-row'));
        
        // Highlight specified row
        if (rowIndex >= 0 && rowIndex < rows.length) {
            rows[rowIndex].classList.add('active-row');
            rows[rowIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

/* ===== SPECIALIZED CIRCUIT COMPONENTS ===== */

/**
 * Half Adder circuit implementation
 */
class HalfAdder extends CircuitComponent {
    constructor(id, x = 0, y = 0) {
        super(id, 'HALF_ADDER', x, y);
        this.width = 80;
        this.height = 60;
        this.inputs = [false, false]; // A, B
        this.outputs = [false, false]; // Sum, Carry
    }
    
    compute() {
        const [a, b] = this.inputs;
        this.outputs[0] = a !== b; // Sum = A XOR B
        this.outputs[1] = a && b;  // Carry = A AND B
        return this.outputs;
    }
    
    draw(ctx) {
        const bbox = this.getBoundingBox();
        
        // Draw component body
        ctx.fillStyle = this.selected ? '#e2e8f0' : '#f8fafc';
        ctx.strokeStyle = this.selected ? '#2563eb' : '#64748b';
        ctx.lineWidth = this.selected ? 2 : 1;
        
        ctx.beginPath();
        ctx.roundRect(bbox.left, bbox.top, this.width, this.height, 8);
        ctx.fill();
        ctx.stroke();
        
        // Draw label
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('HALF', this.x, this.y - 5);
        ctx.fillText('ADDER', this.x, this.y + 8);
        
        // Draw pins with labels
        this.drawHalfAdderPins(ctx);
    }
    
    drawHalfAdderPins(ctx) {
        const bbox = this.getBoundingBox();
        
        // Input pins
        ctx.fillStyle = this.inputs[0] ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.left, this.y - 12, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#1e293b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('A', bbox.left - 8, this.y - 8);
        
        ctx.fillStyle = this.inputs[1] ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.left, this.y + 12, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#1e293b';
        ctx.fillText('B', bbox.left - 8, this.y + 16);
        
        // Output pins
        ctx.fillStyle = this.outputs[0] ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.right, this.y - 12, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1e293b';
        ctx.fillText('S', bbox.right + 8, this.y - 8);
        
        ctx.fillStyle = this.outputs[1] ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.right, this.y + 12, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillText('C', bbox.right + 8, this.y + 16);
    }
}

/**
 * Full Adder circuit implementation
 */
class FullAdder extends CircuitComponent {
    constructor(id, x = 0, y = 0) {
        super(id, 'FULL_ADDER', x, y);
        this.width = 80;
        this.height = 80;
        this.inputs = [false, false, false]; // A, B, Cin
        this.outputs = [false, false]; // Sum, Cout
    }
    
    compute() {
        const [a, b, cin] = this.inputs;
        this.outputs[0] = a !== b !== cin; // Sum = A XOR B XOR Cin
        this.outputs[1] = (a && b) || (cin && (a !== b)); // Cout = AB + Cin(A XOR B)
        return this.outputs;
    }
    
    draw(ctx) {
        const bbox = this.getBoundingBox();
        
        ctx.fillStyle = this.selected ? '#e2e8f0' : '#f8fafc';
        ctx.strokeStyle = this.selected ? '#2563eb' : '#64748b';
        ctx.lineWidth = this.selected ? 2 : 1;
        
        ctx.beginPath();
        ctx.roundRect(bbox.left, bbox.top, this.width, this.height, 8);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FULL', this.x, this.y - 5);
        ctx.fillText('ADDER', this.x, this.y + 8);
        
        this.drawFullAdderPins(ctx);
    }
    
    drawFullAdderPins(ctx) {
        const bbox = this.getBoundingBox();
        
        // Input pins
        const inputPositions = [-20, 0, 20];
        const inputLabels = ['A', 'B', 'Cin'];
        
        inputPositions.forEach((offset, i) => {
            ctx.fillStyle = this.inputs[i] ? '#059669' : '#64748b';
            ctx.beginPath();
            ctx.arc(bbox.left, this.y + offset, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = '#1e293b';
            ctx.font = '10px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(inputLabels[i], bbox.left - 8, this.y + offset + 4);
        });
        
        // Output pins
        const outputPositions = [-12, 12];
        const outputLabels = ['S', 'Cout'];
        
        outputPositions.forEach((offset, i) => {
            ctx.fillStyle = this.outputs[i] ? '#059669' : '#64748b';
            ctx.beginPath();
            ctx.arc(bbox.right, this.y + offset, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'left';
            ctx.fillText(outputLabels[i], bbox.right + 8, this.y + offset + 4);
        });
    }
}

/**
 * 4:1 Multiplexer implementation
 */
class Multiplexer4to1 extends CircuitComponent {
    constructor(id, x = 0, y = 0) {
        super(id, 'MUX_4TO1', x, y);
        this.width = 80;
        this.height = 100;
        this.dataInputs = [false, false, false, false]; // D0, D1, D2, D3
        this.selectInputs = [false, false]; // S0, S1
        this.output = false;
    }
    
    compute() {
        const selectValue = this.selectInputs[1] * 2 + this.selectInputs[0];
        this.output = this.dataInputs[selectValue];
        return this.output;
    }
    
    draw(ctx) {
        const bbox = this.getBoundingBox();
        
        // Draw trapezoid shape typical of MUX symbol
        ctx.fillStyle = this.selected ? '#e2e8f0' : '#f8fafc';
        ctx.strokeStyle = this.selected ? '#2563eb' : '#64748b';
        ctx.lineWidth = this.selected ? 2 : 1;
        
        ctx.beginPath();
        ctx.moveTo(bbox.left, bbox.top + 10);
        ctx.lineTo(bbox.right - 20, bbox.top);
        ctx.lineTo(bbox.right, bbox.bottom);
        ctx.lineTo(bbox.left, bbox.bottom - 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MUX', this.x, this.y - 10);
        ctx.fillText('4:1', this.x, this.y + 5);
        
        this.drawMuxPins(ctx);
    }
    
    drawMuxPins(ctx) {
        const bbox = this.getBoundingBox();
        
        // Data inputs (left side)
        const dataPositions = [-30, -10, 10, 30];
        dataPositions.forEach((offset, i) => {
            ctx.fillStyle = this.dataInputs[i] ? '#059669' : '#64748b';
            ctx.beginPath();
            ctx.arc(bbox.left, this.y + offset, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = '#1e293b';
            ctx.font = '8px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`D${i}`, bbox.left - 5, this.y + offset + 3);
        });
        
        // Select inputs (bottom)
        const selectPositions = [-10, 10];
        selectPositions.forEach((offset, i) => {
            ctx.fillStyle = this.selectInputs[i] ? '#059669' : '#64748b';
            ctx.beginPath();
            ctx.arc(this.x + offset, bbox.bottom, 3, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.fillText(`S${i}`, this.x + offset, bbox.bottom + 12);
        });
        
        // Output (right side)
        ctx.fillStyle = this.output ? '#059669' : '#64748b';
        ctx.beginPath();
        ctx.arc(bbox.right, this.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'left';
        ctx.fillText('Y', bbox.right + 8, this.y + 4);
    }
}

/* ===== CIRCUIT TEMPLATES AND PRESETS ===== */

/**
 * Pre-built circuit configurations
 */
class CircuitTemplates {
    static halfAdderCircuit(simulator) {
        simulator.clear();
        
        // Add components
        const inputA = simulator.addComponent('INPUT', 'input_a', 50, 80, { label: 'A' });
        const inputB = simulator.addComponent('INPUT', 'input_b', 50, 140, { label: 'B' });
        const xorGate = simulator.addComponent('XOR', 'xor_1', 200, 100);
        const andGate = simulator.addComponent('AND', 'and_1', 200, 160);
        const sumOutput = simulator.addComponent('OUTPUT', 'sum_out', 350, 100, { label: 'SUM' });
        const carryOutput = simulator.addComponent('OUTPUT', 'carry_out', 350, 160, { label: 'CARRY' });
        
        // Connect components
        simulator.connectComponents('input_a', 0, 'xor_1', 0);
        simulator.connectComponents('input_b', 0, 'xor_1', 1);
        simulator.connectComponents('input_a', 0, 'and_1', 0);
        simulator.connectComponents('input_b', 0, 'and_1', 1);
        simulator.connectComponents('xor_1', 0, 'sum_out', 0);
        simulator.connectComponents('and_1', 0, 'carry_out', 0);
        
        simulator.simulate();
        simulator.render();
        
        return {
            inputs: { A: inputA, B: inputB },
            outputs: { SUM: sumOutput, CARRY: carryOutput }
        };
    }
    
    static fullAdderCircuit(simulator) {
        simulator.clear();
        
        // This would be more complex, implementing full adder with gates
        // For brevity, using the FullAdder component directly
        const inputA = simulator.addComponent('INPUT', 'input_a', 50, 60, { label: 'A' });
        const inputB = simulator.addComponent('INPUT', 'input_b', 50, 100, { label: 'B' });
        const inputCin = simulator.addComponent('INPUT', 'input_cin', 50, 140, { label: 'Cin' });
        const fullAdder = simulator.addComponent('FULL_ADDER', 'fa_1', 200, 100);
        const sumOutput = simulator.addComponent('OUTPUT', 'sum_out', 350, 80, { label: 'SUM' });
        const carryOutput = simulator.addComponent('OUTPUT', 'carry_out', 350, 120, { label: 'Cout' });
        
        // Note: This would need connection logic for the FullAdder component
        
        return {
            inputs: { A: inputA, B: inputB, Cin: inputCin },
            outputs: { SUM: sumOutput, CARRY: carryOutput }
        };
    }
    
    static mux2to1Circuit(simulator) {
        simulator.clear();
        
        const inputD0 = simulator.addComponent('INPUT', 'input_d0', 50, 80, { label: 'D0' });
        const inputD1 = simulator.addComponent('INPUT', 'input_d1', 50, 140, { label: 'D1' });
        const inputS = simulator.addComponent('INPUT', 'input_s', 150, 200, { label: 'S' });
        
        // Build 2:1 MUX using gates
        const notGate = simulator.addComponent('NOT', 'not_s', 200, 200);
        const and1 = simulator.addComponent('AND', 'and_1', 280, 90);
        const and2 = simulator.addComponent('AND', 'and_2', 280, 150);
        const orGate = simulator.addComponent('OR', 'or_1', 380, 120);
        const output = simulator.addComponent('OUTPUT', 'output_y', 480, 120, { label: 'Y' });
        
        // Connect the MUX logic
        simulator.connectComponents('input_s', 0, 'not_s', 0);
        simulator.connectComponents('input_d0', 0, 'and_1', 0);
        simulator.connectComponents('not_s', 0, 'and_1', 1);
        simulator.connectComponents('input_d1', 0, 'and_2', 0);
        simulator.connectComponents('input_s', 0, 'and_2', 1);
        simulator.connectComponents('and_1', 0, 'or_1', 0);
        simulator.connectComponents('and_2', 0, 'or_1', 1);
        simulator.connectComponents('or_1', 0, 'output_y', 0);
        
        simulator.simulate();
        simulator.render();
        
        return {
            inputs: { D0: inputD0, D1: inputD1, S: inputS },
            outputs: { Y: output }
        };
    }
}

/* ===== EXPORT FOR MODULE USAGE ===== */
window.CircuitSimulator = {
    CircuitSimulator,
    CircuitComponent,
    CircuitConnection,
    ANDGate,
    ORGate,
    XORGate,
    NOTGate,
    InputComponent,
    OutputComponent,
    HalfAdder,
    FullAdder,
    Multiplexer4to1,
    TruthTableGenerator,
    CircuitTemplates
};

// Auto-initialize canvas if present
document.addEventListener('DOMContentLoaded', () => {
    const canvases = document.querySelectorAll('canvas[data-circuit-simulator]');
    canvases.forEach(canvas => {
        const options = {
            enableAnimation: canvas.dataset.enableAnimation !== 'false',
            showGrid: canvas.dataset.showGrid === 'true',
            allowDrag: canvas.dataset.allowDrag !== 'false'
        };
        
        const simulator = new CircuitSimulator(canvas.id, options);
        
        // Store reference for external access
        canvas._circuitSimulator = simulator;
    });
});

// Export for ES6 modules if supported
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.CircuitSimulator;
}/**
 * CSC210 Circuit Simulation Library
 * Version: 1.0.0
 * 
 * This library provides interactive circuit simulation capabilities
 * for all CSC210 learning modules, including logic gates, truth tables,
 * and visual circuit representations.
 */

/* ===== BASE CLASSES ===== */

/**
 * Base class for all circuit components
 */
class CircuitComponent {
    constructor(id, type, x = 0, y = 0) {
        this.id = id;
        this.type = type;
        this.x = x;
        this.y = y;
        this.inputs = [];
        this.outputs = [];
        this.selected = false;
        this.width = 60;
        this.height = 40;
    }
    
    addInput(input) {
        this.inputs.push(input);
    }
    
    addOutput(output) {
        this.outputs.push(output);
    }
    
    getBoundingBox() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }
    
    containsPoint(x, y) {
        const bbox = this.getBoundingBox();
        return x >= bbox.left && x <= bbox.right && y >= bbox.top && y <= bbox.bottom;
    }
    
    // Abstract methods to be implemented by subclasses
    compute() {
        throw new Error('compute() method must be implemented by subclass');
    }
    
    draw(ctx) {
        throw new Error('draw() method must be implemented by subclass');
    }
}

/**
 * Connection between circuit components
 */
class CircuitConnection {
    constructor(fromComponent, fromOutput, toComponent, toInput) {
        this.from = fromComponent;
        this.fromOutput = fromOutput;
        this.to = toComponent;
        this.toInput = toInput;
        this.value = false;
        this.animated = false;
    }
    
    draw(ctx, animated = false) {
        const fromPos = this.getOutputPosition();
        const toPos = this.getInputPosition();
        
        ctx.strokeStyle = this.value ? '#059669' : '#64748b';
        ctx.lineWidth = this.value && animated ? 3 : 2;
        ctx.beginPath();
        
        // Draw curved connection line
        const controlPoint1X = fromPos.x + (toPos.x - fromPos.x) * 0.5;
        const controlPoint1Y = fromPos.y;
        const controlPoint2X = fromPos.x + (toPos.