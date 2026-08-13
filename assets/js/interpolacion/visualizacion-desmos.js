// =====================================================
// VISUALIZACIÓN CON DESMOS
// =====================================================

let calculatorDesmos = null;

// Colores para cada spline - paleta vibrante
const coloresSplines = [
    '#FF6B6B', // Rojo coral
    '#4ECDC4', // Turquesa
    '#45B7D1', // Azul cielo
    '#FFA07A', // Salmón
    '#98D8C8', // Verde menta
    '#F7DC6F', // Amarillo oro
    '#BB8FCE', // Púrpura
    '#85C1E2', // Azul claro
    '#F8B88B', // Naranja suave
    '#52C7A1', // Verde esmeralda
    '#FFB6C1', // Rosa claro
    '#87CEEB'  // Azul acero
];

// =====================================================
// INICIALIZAR DESMOS
// =====================================================

function inicializarDesmos() {
    const container = document.getElementById('desmos-container');
    
    // Limpiar container si ya existe un calculador
    if (calculatorDesmos) {
        container.innerHTML = '';
    }
    
    calculatorDesmos = Desmos.GraphingCalculator(
        container,
        {
            expressions: true,
            grid: true,
            settingsMenu: true,
            zoomButtons: true,
            expressionsCollapsed: false
        }
    );
    
    return calculatorDesmos;
}


// =====================================================
// GRAFICAR TRAZADORES CÚBICOS CON DERIVADAS
// =====================================================

function graficarSplines() {
    
    if (!window.trazadoresActuales || !window.trazadoresActuales.splines) {
        alert('Por favor, calcula los trazadores primero');
        return;
    }
    
    const { datos, splines } = window.trazadoresActuales;
    
    inicializarDesmos();
    
    // =====================================================
    // AGREGAR CADA SPLINE COMO EXPRESIÓN SEPARADA
    // =====================================================
    
    splines.forEach((spline, index) => {
        
        const a = spline.a;
        const b = spline.b;
        const c = spline.c;
        const d = spline.d;
        const x0 = spline.x0;
        const x1 = spline.x1;
        
        const color = coloresSplines[index % coloresSplines.length];
        
        // Función cúbica: S_i(x) = a + b(x-x0) + c(x-x0)^2 + d(x-x0)^3
        const latex = `S_{${index}}(x) = ${a.toFixed(6)} + ${b.toFixed(6)}(x-${x0.toFixed(4)}) + ${c.toFixed(6)}(x-${x0.toFixed(4)})^2 + ${d.toFixed(6)}(x-${x0.toFixed(4)})^3`;
        
        calculatorDesmos.setExpression({
            id: `spline-${index}`,
            latex: latex,
            color: color,
            lineWidth: 3,
            domain: {
                min: x0,
                max: x1
            }
        });
        
        // =====================================================
        // DERIVADA PRIMERA: muestra continuidad de derivadas
        // =====================================================
        
        const b1 = b + 2 * c * (x1 - x0) + 3 * d * Math.pow(x1 - x0, 2);
        
        calculatorDesmos.setExpression({
            id: `derivada-${index}`,
            latex: `S'_{${index}}(x) = ${b.toFixed(6)} + ${(2*c).toFixed(6)}(x-${x0.toFixed(4)}) + ${(3*d).toFixed(6)}(x-${x0.toFixed(4)})^2`,
            color: color,
            lineWidth: 1,
            lineStyle: Desmos.Styles.DASHED,
            domain: {
                min: x0,
                max: x1
            },
            hidden: true // Oculto por defecto, pero disponible
        });
    });
    
    // =====================================================
    // AGREGAR PUNTOS DE DATOS EN ROJO
    // =====================================================
    
    const puntosLatex = datos.map((punto, i) => {
        return `(${punto.x}, ${punto.fx})`;
    }).join(', ');
    
    calculatorDesmos.setExpression({
        id: 'puntos-datos',
        latex: `\\{${puntosLatex}\\}`,
        color: '#FF0000',
        pointSize: 8,
        pointOpacity: 1
    });
    
    // =====================================================
    // AJUSTAR VISTA
    // =====================================================
    
    const xMin = Math.min(...datos.map(d => d.x));
    const xMax = Math.max(...datos.map(d => d.x));
    const yMin = Math.min(...datos.map(d => d.fx));
    const yMax = Math.max(...datos.map(d => d.fx));
    
    const xPadding = (xMax - xMin) * 0.1 || 1;
    const yPadding = (yMax - yMin) * 0.1 || 1;
    
    calculatorDesmos.setMathBounds({
        left: xMin - xPadding,
        right: xMax + xPadding,
        bottom: yMin - yPadding,
        top: yMax + yPadding
    });
    
    mostrarContenedorGrafico();
}

// =====================================================
// GRAFICAR POLINOMIO NEWTON O LAGRANGE
// =====================================================

function graficarPolinomio(polinomioLatex, datos) {
    
    if (!polinomioLatex || polinomioLatex.trim() === '') {
        alert('Por favor, calcula el polinomio primero');
        return;
    }
    
    inicializarDesmos();
    
    // Limpiar el LaTeX si contiene "P_n(x)=" al inicio
    let latex = polinomioLatex.replace(/^P_n\(x\)=/, '').replace(/^P\(x\)=/, '');
    
    // =====================================================
    // AGREGAR EL POLINOMIO
    // =====================================================
    
    calculatorDesmos.setExpression({
        id: 'polinomio',
        latex: latex,
        color: '#4169E1',
        lineWidth: 3
    });
    
    // =====================================================
    // AGREGAR PUNTOS DE DATOS
    // =====================================================
    
    if (datos && datos.length > 0) {
        const puntosLatex = datos.map((punto, i) => {
            return `(${punto.x}, ${punto.fx})`;
        }).join(', ');
        
        calculatorDesmos.setExpression({
            id: 'puntos-datos',
            latex: `\\{${puntosLatex}\\}`,
            color: '#FF0000',
            pointSize: 8,
            pointOpacity: 1
        });
        
        // =====================================================
        // AJUSTAR VISTA
        // =====================================================
        
        const xMin = Math.min(...datos.map(d => d.x));
        const xMax = Math.max(...datos.map(d => d.x));
        const yMin = Math.min(...datos.map(d => d.fx));
        const yMax = Math.max(...datos.map(d => d.fx));
        
        const xPadding = (xMax - xMin) * 0.1 || 1;
        const yPadding = (yMax - yMin) * 0.1 || 1;
        
        calculatorDesmos.setMathBounds({
            left: xMin - xPadding,
            right: xMax + xPadding,
            bottom: yMin - yPadding,
            top: yMax + yPadding
        });
    }
    
    mostrarContenedorGrafico();
}

// =====================================================
// AUXILIAR: Mostrar contenedor
// =====================================================

function mostrarContenedorGrafico() {
    document.getElementById('desmos-container').style.display = 'block';
    document.getElementById('grafico-mensaje').style.display = 'none';
}


// =====================================================
// EVENTOS
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    
    const btnGraficar = document.getElementById('btn-graficar-splines');
    
    if (btnGraficar) {
        btnGraficar.addEventListener('click', function() {
            const metodo = document.getElementById('metodo').value;
            
            if (metodo === 'trazadores') {
                graficarSplines();
            } else if (metodo === 'newton') {
                if (window.polinomioNewtonLatex) {
                    graficarPolinomio(window.polinomioNewtonLatex, window.datosActuales);
                } else {
                    alert('Por favor, calcula primero');
                }
            } else if (metodo === 'lagrange') {
                if (window.polinomioLagrangeLatex) {
                    graficarPolinomio(window.polinomioLagrangeLatex, window.datosActuales);
                } else {
                    alert('Por favor, calcula primero');
                }
            }
        });
    }
    
    // Mostrar automáticamente el gráfico cuando se calculan
    const btnCalcular = document.getElementById('btn-calcular');
    
    if (btnCalcular) {
        btnCalcular.addEventListener('click', function() {
            const metodo = document.getElementById('metodo').value;
            
            // Delay para permitir que se guarden los datos
            setTimeout(() => {
                if (metodo === 'trazadores' && window.trazadoresActuales) {
                    graficarSplines();
                } else if (metodo === 'newton' && window.polinomioNewtonLatex) {
                    graficarPolinomio(window.polinomioNewtonLatex, window.datosActuales);
                } else if (metodo === 'lagrange' && window.polinomioLagrangeLatex) {
                    graficarPolinomio(window.polinomioLagrangeLatex, window.datosActuales);
                }
            }, 800);
        });
    }
});

// Exportar para acceso global
window.graficarSplines = graficarSplines;
window.graficarPolinomio = graficarPolinomio;
window.inicializarDesmos = inicializarDesmos;
