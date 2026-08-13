// =====================
// MÉTODO BAIRSTOW
// =====================

function obtenerCoeficientesBairstow(
    latex
) {

    const resultado =
        document.getElementById(
            "resultado-text"
        );

    try {

        const expr =
            convertirLatexAJS(
                latex
            );

        const coeficientes =
            obtenerCoeficientesValidos(
                expr,
                Math.max(
                    2,
                    obtenerGradoPolinomio(
                        expr
                    )
                )
            );

        if (
            !coeficientes
        ) {

            alert(
                "Bairstow requiere un polinomio valido de grado 2 o mayor"
            );

            resultado.innerText =
                "Bairstow solo acepta polinomios en x.";

            return null;
        }

        return coeficientes;

    } catch (error) {

        console.error(
            "ERROR COEFICIENTES BAIRSTOW:",
            error
        );

        alert(
            "No se pudieron obtener los coeficientes del polinomio"
        );

        resultado.innerText =
            "Revisa que p(x) sea un polinomio valido.";

        return null;
    }
}


function obtenerCoeficientesValidos(
    expr,
    gradoInicial
) {

    const gradoMaximo =
        Math.max(
            gradoInicial,
            10
        );

    for (
        let grado = gradoInicial;
        grado <= gradoMaximo;
        grado++
    ) {

        const coeficientes =
            resolverCoeficientesPorInterpolacion(
                expr,
                grado
            );

        if (
            validarCoeficientesPolinomio(
                expr,
                coeficientes
            )
        ) {

            const coeficientesLimpios =
                limpiarCoeficientesAltos(
                    coeficientes
                );

            if (
                coeficientesLimpios.length > 2
            ) {

                return coeficientesLimpios;
            }
        }
    }

    return null;
}


function obtenerGradoPolinomio(
    expr
) {

    let grado = 0;

    const potencias =
        expr.matchAll(
            /x\s*\*\*\s*\(?\s*(\d+)\s*\)?/g
        );

    for (
        const potencia
        of potencias
    ) {

        grado =
            Math.max(
                grado,
                parseInt(
                    potencia[1],
                    10
                )
            );
    }

    if (
        /\bx\b/.test(
            expr
        )
    ) {

        grado =
            Math.max(
                grado,
                1
            );
    }

    return grado;
}


function limpiarCoeficientesAltos(
    coeficientes
) {

    while (
        coeficientes.length > 1
        &&
        Math.abs(
            coeficientes[coeficientes.length - 1]
        )
        < 1e-10
    ) {

        coeficientes.pop();
    }

    return coeficientes;
}


function resolverCoeficientesPorInterpolacion(
    expr,
    grado
) {

    const matriz = [];
    const valores = [];

    for (
        let fila = 0;
        fila <= grado;
        fila++
    ) {

        const x = fila;
        const ecuacion = [];

        for (
            let potencia = 0;
            potencia <= grado;
            potencia++
        ) {

            ecuacion.push(
                Math.pow(
                    x,
                    potencia
                )
            );
        }

        matriz.push(
            ecuacion
        );

        valores.push(
            evaluarFuncion(
                expr,
                x
            )
        );
    }

    return resolverSistemaLineal(
        matriz,
        valores
    );
}


function resolverSistemaLineal(
    matriz,
    valores
) {

    const n =
        valores.length;

    const aumentado =
        matriz.map(
            (fila, i) => [
                ...fila,
                valores[i]
            ]
        );

    for (
        let col = 0;
        col < n;
        col++
    ) {

        let pivote = col;

        for (
            let fila = col + 1;
            fila < n;
            fila++
        ) {

            if (
                Math.abs(
                    aumentado[fila][col]
                )
                >
                Math.abs(
                    aumentado[pivote][col]
                )
            ) {

                pivote = fila;
            }
        }

        if (
            Math.abs(
                aumentado[pivote][col]
            )
            < 1e-12
        ) {

            throw new Error(
                "Sistema singular"
            );
        }

        [
            aumentado[col],
            aumentado[pivote]
        ] = [
            aumentado[pivote],
            aumentado[col]
        ];

        const divisor =
            aumentado[col][col];

        for (
            let j = col;
            j <= n;
            j++
        ) {

            aumentado[col][j] /=
                divisor;
        }

        for (
            let fila = 0;
            fila < n;
            fila++
        ) {

            if (
                fila === col
            ) {

                continue;
            }

            const factor =
                aumentado[fila][col];

            for (
                let j = col;
                j <= n;
                j++
            ) {

                aumentado[fila][j] -=
                    factor * aumentado[col][j];
            }
        }
    }

    return aumentado.map(
        fila => {

            const valor =
                fila[n];

            return Math.abs(
                valor
            ) < 1e-10
                ? 0
                : valor;
        }
    );
}


function validarCoeficientesPolinomio(
    expr,
    coeficientes
) {

    const puntos =
        [
            -2,
            -1,
            coeficientes.length,
            coeficientes.length + 1
        ];

    return puntos.every(
        x => {

            const original =
                evaluarFuncion(
                    expr,
                    x
                );

            const reconstruido =
                evaluarPolinomioCoeficientes(
                    coeficientes,
                    x
                );

            return (
                isFinite(
                    original
                )
                &&
                Math.abs(
                    original - reconstruido
                )
                < 1e-6
            );
        }
    );
}


function evaluarPolinomioCoeficientes(
    coeficientes,
    x
) {

    return coeficientes.reduce(
        (total, coeficiente, potencia) =>
            total +
            coeficiente *
            Math.pow(
                x,
                potencia
            ),
        0
    );
}


function obtenerTextoFactorBairstow(
    r,
    s
) {

    const terminoX =
        r < 0
            ? `+ ${Math.abs(r).toFixed(6)}x`
            : `- ${r.toFixed(6)}x`;

    const terminoIndependiente =
        s < 0
            ? `+ ${Math.abs(s).toFixed(6)}`
            : `- ${s.toFixed(6)}`;

    return `x² ${terminoX} ${terminoIndependiente}`;
}


function obtenerTextoRaicesBairstow(
    r,
    s
) {

    const discriminante =
        r * r + 4 * s;

    if (
        discriminante >= 0
    ) {

        const sqrtDisc =
            Math.sqrt(
                discriminante
            );

        const x1 =
            (r + sqrtDisc) / 2;

        const x2 =
            (r - sqrtDisc) / 2;

        return `
x₁ = ${x1.toFixed(6)}
x₂ = ${x2.toFixed(6)}
        `;
    }

    const real =
        r / 2;

    const imag =
        Math.sqrt(
            -discriminante
        ) / 2;

    return `
x₁ = ${real.toFixed(6)} + ${imag.toFixed(6)}i
x₂ = ${real.toFixed(6)} - ${imag.toFixed(6)}i
    `;
}


function resolverCuadraticoDirectoBairstow(
    coeficientes,
    tbody,
    resultado
) {

    const a =
        coeficientes[2];

    const b =
        coeficientes[1];

    const c =
        coeficientes[0];

    if (
        Math.abs(a) < 1e-12
    ) {

        resultado.innerText =
            "Bairstow requiere un polinomio cuadrático válido.";

        return;
    }

    const r =
        -b / a;

    const s =
        -c / a;

    tbody.innerHTML += `
        <tr>
            <td>1</td>
            <td>${r.toFixed(6)}</td>
            <td>${s.toFixed(6)}</td>
            <td>0.0000e+0</td>
            <td>0.0000e+0</td>
            <td>0.0000e+0</td>
            <td>0.0000e+0</td>
            <td>0.000000</td>
        </tr>
    `;

    resultado.innerText =
        `
✓ Polinomio cuadrático resuelto directamente

Factor cuadrático: ${obtenerTextoFactorBairstow(r, s)}

Raíces del factor:
${obtenerTextoRaicesBairstow(r, s)}

Error máximo: 0.0000e+0
        `;
}


function limpiarNumeroBairstow(
    valor
) {

    return Math.abs(
        valor
    ) < 1e-10
        ? 0
        : valor;
}


function formatearNumeroBairstow(
    valor
) {

    return limpiarNumeroBairstow(
        valor
    ).toFixed(
        6
    );
}


function dividirPorFactorBairstow(
    coeficientes,
    r,
    s
) {

    const dividendo =
        [
            ...coeficientes
        ].reverse();

    const divisor =
        [
            1,
            -r,
            -s
        ];

    const trabajo =
        [
            ...dividendo
        ];

    const cociente = [];
    const gradoCociente =
        dividendo.length - divisor.length;

    for (
        let i = 0;
        i <= gradoCociente;
        i++
    ) {

        const termino =
            trabajo[i] / divisor[0];

        cociente.push(
            termino
        );

        for (
            let j = 0;
            j < divisor.length;
            j++
        ) {

            trabajo[i + j] -=
                termino * divisor[j];
        }
    }

    return {

        cociente:
            cociente
                .reverse()
                .map(
                    limpiarNumeroBairstow
                ),

        residuo:
            trabajo
                .slice(
                    cociente.length
                )
                .map(
                    limpiarNumeroBairstow
                )
    };
}


function formatearPolinomioBairstow(
    coeficientes
) {

    const terminos = [];

    for (
        let potencia = coeficientes.length - 1;
        potencia >= 0;
        potencia--
    ) {

        const coeficiente =
            limpiarNumeroBairstow(
                coeficientes[potencia]
            );

        if (
            Math.abs(
                coeficiente
            )
            < 1e-10
        ) {

            continue;
        }

        const signo =
            coeficiente < 0
                ? "-"
                : "+";

        const absoluto =
            Math.abs(
                coeficiente
            );

        let termino = "";

        if (
            potencia === 0
        ) {

            termino =
                formatearNumeroBairstow(
                    absoluto
                );

        } else if (
            potencia === 1
        ) {

            termino =
                `${formatearNumeroBairstow(absoluto)}x`;

        } else {

            termino =
                `${formatearNumeroBairstow(absoluto)}x^${potencia}`;
        }

        terminos.push({

            signo,
            termino
        });
    }

    if (
        terminos.length === 0
    ) {

        return "0";
    }

    return terminos
        .map(
            (item, index) =>
                index === 0
                    ? (
                        item.signo === "-"
                            ? `-${item.termino}`
                            : item.termino
                    )
                    : `${item.signo} ${item.termino}`
        )
        .join(
            " "
        );
}


function obtenerTextoComprobacionBairstow(
    coeficientes,
    r,
    s
) {

    const division =
        dividirPorFactorBairstow(
            coeficientes,
            r,
            s
        );

    let texto =
        `
Comprobación:
Al dividir el polinomio entre el factor cuadrático:
${obtenerTextoFactorBairstow(r, s)}

Cociente aproximado:
${formatearPolinomioBairstow(division.cociente)}
        `;

    if (
        division.cociente.length === 2
        &&
        Math.abs(
            division.cociente[1]
        )
        > 1e-12
    ) {

        const raizRestante =
            -division.cociente[0] /
            division.cociente[1];

        texto +=
            `

Raíz restante:
x = ${formatearNumeroBairstow(raizRestante)}
            `;
    }

    return texto;
}


window.metodoBarirstow = function (
    coeficientes,
    r,
    s
) {

    const tbody =
        document.querySelector(
            "#tabla-iteraciones tbody"
        );

    const resultado =
        document.getElementById(
            "resultado-text"
        );

    tbody.innerHTML = "";

    resultado.innerText =
        "Calculando...";

    const tolerancia =
        1e-6;

    const maxIter =
        50;

    let n = coeficientes.length - 1;
    let ri = r;
    let si = s;

    if (
        n === 2
    ) {

        resolverCuadraticoDirectoBairstow(
            coeficientes,
            tbody,
            resultado
        );

        return;
    }

    // =====================
    // ITERACIONES
    // =====================

    for (
        let iter = 1;
        iter <= maxIter;
        iter++
    ) {

        // =====================
        // CALCULAR b Y c
        // =====================

        const b = new Array(n + 1);
        const c = new Array(n + 1);

        b[n] = coeficientes[n];
        b[n - 1] =
            coeficientes[n - 1] + ri * b[n];

        c[n] = b[n];
        c[n - 1] =
            b[n - 1] + ri * c[n];

        for (let i = n - 2; i >= 0; i--) {

            b[i] =
                coeficientes[i] +
                ri * b[i + 1] +
                si * b[i + 2];

            c[i] =
                b[i] +
                ri * c[i + 1] +
                si * c[i + 2];
        }

        // =====================
        // ERRORES
        // =====================

        const b0 = b[0];
        const b1 = b[1];
        const c1 = c[1];
        const c2 = c[2];

        // =====================
        // CALCULAR INCREMENTOS
        // =====================

        const c3 = c[3] || 0;

        const denom =
            c2 * c2 -
            c1 * c3;

        if (Math.abs(denom) < 1e-15) {

            resultado.innerText =
                "❌ Denominador muy pequeño";

            return;
        }

        const deltaR =
            (-b1 * c2 + b0 * c3) /
            denom;

        const deltaS =
            (-b0 * c2 + b1 * c1) /
            denom;

        // =====================
        // ACTUALIZAR r y s
        // =====================

        ri += deltaR;
        si += deltaS;

        if (
            !isFinite(ri) ||
            !isFinite(si) ||
            !isFinite(deltaR) ||
            !isFinite(deltaS)
        ) {

            resultado.innerText =
                "Error numérico - divergencia";

            return;
        }

        // =====================
        // ERROR RELATIVO
        // =====================

        const errorR =
            Math.abs(deltaR) > 0
            ? (
                Math.abs(ri) > 1e-15
                    ? Math.abs(deltaR / ri) * 100
                    : Math.abs(deltaR) * 100
            )
            : 0;

        const errorS =
            Math.abs(deltaS) > 0
            ? (
                Math.abs(si) > 1e-15
                    ? Math.abs(deltaS / si) * 100
                    : Math.abs(deltaS) * 100
            )
            : 0;

        const errorMax =
            Math.max(errorR, errorS);

        // =====================
        // TABLA
        // =====================

        tbody.innerHTML += `
        <tr>

            <td>
                ${iter}
            </td>

            <td>
                ${ri.toFixed(6)}
            </td>

            <td>
                ${si.toFixed(6)}
            </td>

            <td>
                ${b0.toExponential(4)}
            </td>

            <td>
                ${b1.toExponential(4)}
            </td>

            <td>
                ${deltaR.toExponential(4)}
            </td>

            <td>
                ${deltaS.toExponential(4)}
            </td>

            <td>
                ${errorMax.toFixed(6)}
            </td>

        </tr>
        `;

        // =====================
        // CRITERIO PARO
        // =====================

        if (errorMax < tolerancia) {

            const discriminante =
                ri * ri + 4 * si;

            let raices = "";
            const comprobacion =
                obtenerTextoComprobacionBairstow(
                    coeficientes,
                    ri,
                    si
                );

            if (discriminante >= 0) {

                const sqrt_disc =
                    Math.sqrt(discriminante);

                const x1 =
                    (ri + sqrt_disc) / 2;

                const x2 =
                    (ri - sqrt_disc) / 2;

                raices = `
x₁ = ${x1.toFixed(6)}
x₂ = ${x2.toFixed(6)}
                `;

            } else {

                const real =
                    ri / 2;

                const imag =
                    Math.sqrt(
                        -discriminante
                    ) / 2;

                raices = `
x₁ = ${real.toFixed(6)} + ${imag.toFixed(6)}i
x₂ = ${real.toFixed(6)} - ${imag.toFixed(6)}i
                `;
            }

            resultado.innerText =
                `
✓ Convergió en ${iter} iteraciones

Factor cuadrático: ${obtenerTextoFactorBairstow(ri, si)}

Raíces del factor:
${raices}
${comprobacion}

Error máximo: ${errorMax.toExponential(4)}
            `;

            return;
        }

        // =====================
        // VALIDACIÓN NUMÉRICA
        // =====================

        if (
            !isFinite(ri) ||
            !isFinite(si) ||
            !isFinite(deltaR) ||
            !isFinite(deltaS)
        ) {

            resultado.innerText =
                "❌ Error numérico - divergencia";

            return;
        }
    }

    // =====================
    // NO CONVERGIÓ
    // =====================

    resultado.innerText =
        `
⚠ No convergió en ${maxIter} iteraciones

Últimos valores:
r = ${ri.toFixed(6)}
s = ${si.toFixed(6)}

Factor: ${obtenerTextoFactorBairstow(ri, si)}
        `;
};
