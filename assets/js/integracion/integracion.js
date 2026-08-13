document.addEventListener("DOMContentLoaded", () => {
    const mathField = document.getElementById("funcion-integracion");
    const btnCalcular = document.getElementById("btn-calcular");
    const btnLimpiar = document.getElementById("btn-limpiar");
    const inputN = document.getElementById("valor-n");
    const labelN = document.getElementById("label-n");
    let metodoActual = "rectangulo";

    configurarMathFieldIntegracion(mathField);
    configurarEventosMetodo();
    configurarEjemplos();
    actualizarPreviewIntegracion();
    limpiarRenderIntegracion();
    iniciarGraficaIntegracion();

    btnCalcular.addEventListener("click", calcular);
    btnLimpiar.addEventListener("click", limpiar);
    mathField.addEventListener("input", () => {
        actualizarPreviewIntegracion();
        limpiarGraficaIntegracion();
    });

    function configurarEventosMetodo() {
        document.querySelectorAll(".metodo-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document
                    .querySelectorAll(".metodo-btn")
                    .forEach(boton => boton.classList.remove("active"));

                btn.classList.add("active");
                metodoActual = btn.dataset.metodo;
                actualizarEtiquetaN();
                limpiarRenderIntegracion();
            });
        });
    }

    function configurarEjemplos() {
        document.querySelectorAll(".ejemplo-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                mathField.value = btn.dataset.latex;
                actualizarPreviewIntegracion();
            });
        });
    }

    function configurarMathFieldIntegracion(field) {
        if (!field) return;

        field.setOptions({
            virtualKeyboardMode: "onfocus",
            virtualKeyboards: "all",
            smartMode: true,
            smartFence: true,
            inlineShortcuts: {
                pi: "\\pi",
                sqrt: "\\sqrt{#0}",
                sin: "\\sin",
                cos: "\\cos",
                tan: "\\tan",
                ln: "\\ln",
                log: "\\log"
            }
        });

        field.setAttribute("placeholder", "Ejemplo: e^{x^2}");
        field.value = "e^{x^2}";
    }

    function actualizarEtiquetaN() {
        if (metodoActual === "romberg") {
            labelN.textContent = "Niveles Romberg";
            inputN.value = Math.min(parseInt(inputN.value, 10) || 4, 8);
            inputN.min = 2;
            inputN.max = 10;
            return;
        }

        labelN.textContent = "Subintervalos (n)";
        inputN.min = 1;
        inputN.removeAttribute("max");
    }

    function calcular() {
        try {
            const latex = mathField.value || mathField.getValue();
            const a = parseFloat(document.getElementById("limite-a").value);
            const b = parseFloat(document.getElementById("limite-b").value);
            const n = parseInt(inputN.value, 10);

            validarEntradas(latex, a, b, n);

            let data;

            if (metodoActual === "rectangulo") {
                data = calcularMetodoRectangulo(latex, a, b, n);
            }

            if (metodoActual === "trapecio") {
                data = calcularMetodoTrapecio(latex, a, b, n);
            }

            if (metodoActual === "romberg") {
                data = calcularMetodoRomberg(latex, a, b, n);
            }

            agregarComparacionReal(data);
            renderIntegracion(data);
            graficarIntegracion(data);
        } catch (error) {
            mostrarErrorIntegracion(error.message);
            limpiarGraficaIntegracion();
        }
    }

    function agregarComparacionReal(data) {
        const areaReal = calcularAreaReal(data.expresion, data.a, data.b);
        const errorAbsoluto = Math.abs(areaReal - data.resultado);
        const errorPorcentual =
            Math.abs(areaReal) > 1e-12
                ? Math.abs((errorAbsoluto / areaReal) * 100)
                : null;

        data.areaReal = areaReal;
        data.errorAbsoluto = errorAbsoluto;
        data.errorPorcentual = errorPorcentual;
    }

    function calcularAreaReal(expresion, a, b) {
        const subintervalos = 2000;
        const h = (b - a) / subintervalos;
        let suma = evaluarFuncionIntegracion(expresion, a) + evaluarFuncionIntegracion(expresion, b);

        for (let i = 1; i < subintervalos; i++) {
            const x = a + i * h;
            const factor = i % 2 === 0 ? 2 : 4;

            suma += factor * evaluarFuncionIntegracion(expresion, x);
        }

        return (h / 3) * suma;
    }

    function validarEntradas(latex, a, b, n) {
        if (!latex || !latex.trim()) {
            throw new Error("Ingrese una funcion para integrar.");
        }

        if (isNaN(a) || isNaN(b)) {
            throw new Error("Ingrese limites numericos validos.");
        }

        if (a === b) {
            throw new Error("Los limites no pueden ser iguales.");
        }

        if (isNaN(n) || n < 1) {
            throw new Error("Ingrese un valor valido para n.");
        }

        if (metodoActual === "romberg" && (n < 2 || n > 10)) {
            throw new Error("Romberg necesita entre 2 y 10 niveles.");
        }
    }

    function limpiar() {
        document.getElementById("limite-a").value = 0;
        document.getElementById("limite-b").value = 1;
        inputN.value = metodoActual === "romberg" ? 4 : 5;
        mathField.value = "e^{x^2}";
        actualizarPreviewIntegracion();
        limpiarRenderIntegracion();
        limpiarGraficaIntegracion();
    }

    function actualizarPreviewIntegracion() {
        const preview = document.getElementById("preview-latex");
        preview.innerHTML = `$$f(x)=${mathField.value || ""}$$`;

        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise();
        }
    }
});
