// =====================
// TABLA DINÁMICA
// =====================

function crearTabla(tipo) {

    const thead =
        document.querySelector(
            "#tabla-iteraciones thead"
        );

    const tbody =
        document.querySelector(
            "#tabla-iteraciones tbody"
        );

    document.getElementById(
        "tabla-iteraciones"
    ).classList.remove(
        "tabla-horner-newton"
    );

    thead.innerHTML = "";
    tbody.innerHTML = "";

    let columnas = [];

    switch (tipo) {

        case "biseccion":

            columnas = [
                "Iteración",
                "a",
                "c",
                "b",
                "f(a)",
                "f(c)",
                "f(b)",
                "f(a)·f(b)",
                "Ea",
                "Er%"
            ];

            break;


        case "reglaFalsa":

            columnas = [
                "Iteración",
                "a",
                "b",
                "f(a)",
                "f(b)",
                "f(a)·f(b)",
                "c",
                "f(c)",
                "Er%"
            ];

            break;


        case "newton":

            columnas = [
                "Iteración",
                "xi",
                "f(xi)",
                "f'(xi)",
                "Er%"
            ];

            break;


        case "secante":

            columnas = [
                "Iteración",
                "xi-1",
                "xi",
                "f(xi-1)",
                "f(xi)",
                "xi+1",
                "Er%"
            ];

            break;


        case "puntoFijo":

            columnas = [
                "Iteración",
                "xi",
                "g(xi)",
                "Er%",
                "Estado |g'(xi)|"
            ];

            break;


        case "muller":

            columnas = [
                "i",
                "xi",
                "xi+1",
                "xi+2",
                "f(xi)",
                "f(xi+1)",
                "f(xi+2)",
                "hi",
                "hi+1",
                "δi",
                "δi+1",
                "a",
                "b",
                "c",
                "b - √(b²-4ac)",
                "b + √(b²-4ac)",
                "|b - √(b²-4ac)|",
                "|b + √(b²-4ac)|",
                "b ± √(b²-4ac)",
                "2c / (b - √(b²-4ac))",
                "2c / (b + √(b²-4ac))",
                "2c / (b ± √(b²-4ac))",
                "xi+3 = xi+2 - 2c / (b ± √(b²-4ac))",
                "Error",
                "DECISIÓN"
            ];

            break;


        case "bairstow":

            columnas = [
                "Iteración",
                "r",
                "s",
                "b₀",
                "b₁",
                "Δr",
                "Δs",
                "Er%"
            ];

            break;


        case "hornerNewton":

            columnas = [
                "Seleccione Horner-Newton para generar la tabla"
            ];

            break;
    }

    let fila = "<tr>";

    columnas.forEach(col => {

        fila += `
            <th>
                ${col}
            </th>
        `;
    });

    fila += "</tr>";

    thead.innerHTML = fila;
}


// =====================
// CAMBIAR CATEGORÍA
// =====================

function cambiarCategoria(categoria) {

    // Actualizar botones categoría
    const botonesCat =
        document.querySelectorAll(
            ".categoria-btn"
        );

    botonesCat.forEach(btn => {

        btn.classList.remove(
            "activo"
        );
    });

    document.querySelector(
        `.categoria-btn[data-categoria="${categoria}"]`
    ).classList.add("activo");

    // Mostrar/ocultar grupos
    const grupos =
        document.querySelectorAll(
            ".categoria-grupo"
        );

    grupos.forEach(grupo => {

        grupo.classList.add("oculto");
    });

    document.querySelector(
        `.categoria-grupo[data-categoria="${categoria}"]`
    ).classList.remove("oculto");

    // Limpiar selección
    const botones =
        document.querySelectorAll(
            ".metodo-btn:not([disabled])"
        );

    botones.forEach(btn => {

        btn.classList.remove(
            "activo"
        );
    });

    metodoActual =
        null;

    limpiarResultados();
}


// =====================
// MOSTRAR INPUTS
// =====================

function mostrarInputs(tipo) {

    const grupoA =
        document.getElementById(
            "input-a-group"
        );

    const grupoB =
        document.getElementById(
            "input-b-group"
        );

    const grupoX0 =
        document.getElementById(
            "input-x0-group"
        );

    const grupoR =
        document.getElementById(
            "input-r-group"
        );

    const grupoS =
        document.getElementById(
            "input-s-group"
        );

    const titulo =
        document.getElementById(
            "titulo-funcion"
        );

    // ocultar todo
    grupoA.style.display =
        "none";

    grupoB.style.display =
        "none";

    grupoX0.style.display =
        "none";

    grupoR.style.display =
        "none";

    grupoS.style.display =
        "none";

    // reset labels
    document.querySelector(
        "#input-a-group label"
    ).innerText = "a:";

    document.querySelector(
        "#input-b-group label"
    ).innerText = "b:";

    document.querySelector(
        "#input-x0-group label"
    ).innerText = "x₀:";

    // reset título
    titulo.innerText =
        "Escriba f(x):";

    switch (tipo) {

        // =====================
        // BISECCIÓN
        // =====================

        case "biseccion":

            grupoA.style.display =
                "block";

            grupoB.style.display =
                "block";

            break;


        // =====================
        // REGLA FALSA
        // =====================

        case "reglaFalsa":

            grupoA.style.display =
                "block";

            grupoB.style.display =
                "block";

            break;


        // =====================
        // NEWTON
        // =====================

        case "newton":

            grupoX0.style.display =
                "block";

            break;


        // =====================
        // SECANTE
        // =====================

        case "secante":

            grupoA.style.display =
                "block";

            grupoB.style.display =
                "block";

            document.querySelector(
                "#input-a-group label"
            ).innerText = "x₀:";

            document.querySelector(
                "#input-b-group label"
            ).innerText = "x₁:";

            break;


        // =====================
        // PUNTO FIJO
        // =====================

        case "puntoFijo":

            grupoX0.style.display =
                "block";

            titulo.innerText =
                "Escriba g(x) (sin poner x =)";

            break;


        // =====================
        // MULLER
        // =====================

        case "muller":

            grupoA.style.display =
                "block";

            grupoB.style.display =
                "block";

            grupoX0.style.display =
                "block";

            document.querySelector(
                "#input-a-group label"
            ).innerText = "xᵢ:";

            document.querySelector(
                "#input-b-group label"
            ).innerText = "xᵢ₊₁:";

            document.querySelector(
                "#input-x0-group label"
            ).innerText = "xᵢ₊₂:";

            break;


        // =====================
        // BAIRSTOW
        // =====================

        case "bairstow":

            grupoR.style.display =
                "block";

            grupoS.style.display =
                "block";

            titulo.innerText =
                "Escriba el polinomio p(x):";

            break;


        // =====================
        // HORNER-NEWTON
        // =====================

        case "hornerNewton":

            grupoX0.style.display =
                "block";

            document.querySelector(
                "#input-x0-group label"
            ).innerText = "x₀:";

            titulo.innerText =
                "Escriba el polinomio p(x):";

            break;
    }
}


// =====================
// ACTIVAR BOTÓN
// =====================

function activarBotonMetodo(
    botones,
    botonActivo
) {

    botones.forEach(btn => {

        btn.classList.remove(
            "activo"
        );
    });

    botonActivo.classList.add(
        "activo"
    );
}


// =====================
// OBTENER INPUTS
// =====================

function obtenerValoresMetodo() {

    const a = parseFloat(
        document.getElementById(
            "input-a"
        ).value
    );

    const b = parseFloat(
        document.getElementById(
            "input-b"
        ).value
    );

    const x0 = parseFloat(
        document.getElementById(
            "input-x0"
        ).value
    );

    const r = parseFloat(
        document.getElementById(
            "input-r"
        ).value
    );

    const s = parseFloat(
        document.getElementById(
            "input-s"
        ).value
    );

    return {

        a:
            isNaN(a)
            ? null
            : a,

        b:
            isNaN(b)
            ? null
            : b,

        x0:
            isNaN(x0)
            ? null
            : x0,

        r:
            isNaN(r)
            ? null
            : r,

        s:
            isNaN(s)
            ? null
            : s
    };
}


// =====================
// LIMPIAR RESULTADOS
// =====================

function limpiarResultados() {

    document.querySelector(
        "#tabla-iteraciones tbody"
    ).innerHTML = "";

    document.getElementById(
        "resultado-text"
    ).innerText =
        "Aquí aparecerá la raíz aproximada...";
}
