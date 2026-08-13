/* ===================== */
/* DETERMINANTE */
/* GAUSS JORDAN */
/* ===================== */
function determinantGaussian(originalMatrix){

    const n =
        originalMatrix.length;

    const A =
        cloneMatrix(originalMatrix);

    const steps = [];

    let determinant =
        new Fraction(1);

    let swaps = 0;

    /* ===================== */
    /* MATRIZ INICIAL */
    /* ===================== */
    steps.push({

        operation:
            "Matriz inicial",

        description:
            "Se comienza con la matriz original para aplicar el método de Gauss-Jordan.",

        matrix:
            cloneMatrix(A),

        pivot:
            1
    });

    /* ===================== */
    /* GAUSS JORDAN */
    /* ===================== */
    for(
        let i = 0;
        i < n;
        i++
    ){

        /* ===================== */
        /* BUSCAR PIVOTE */
        /* ===================== */
        let pivotRow = i;

        for(
            let j = i + 1;
            j < n;
            j++
        ){

            if(

                Math.abs(
                    A[j][i].valueOf()
                ) >

                Math.abs(
                    A[pivotRow][i].valueOf()
                )

            ){

                pivotRow = j;
            }
        }

        /* ===================== */
        /* MATRIZ SINGULAR */
        /* ===================== */
        if(
            A[pivotRow][i]
            .equals(0)
        ){

            return {

                determinant:
                    new Fraction(0),

                steps
            };
        }

        /* ===================== */
        /* INTERCAMBIO */
        /* ===================== */
        if(
            pivotRow !== i
        ){

            [
                A[i],
                A[pivotRow]
            ] =

            [
                A[pivotRow],
                A[i]
            ];

            swaps++;

            steps.push({

                operation:
                    `F${i+1} \\leftrightarrow F${pivotRow+1}`,

                description:
                    "Se intercambian filas para obtener un pivote válido.",

                matrix:
                    cloneMatrix(A),

                pivot:
                    i + 1
            });
        }

        /* ===================== */
        /* GUARDAR PIVOTE */
        /* ===================== */
        const pivotValue =
            new Fraction(
                A[i][i]
            );

        determinant =
            determinant.mul(
                pivotValue
            );

        /* ===================== */
        /* NORMALIZAR FILA */
        /* ===================== */
        for(
            let k = 0;
            k < n;
            k++
        ){

            A[i][k] =

                A[i][k].div(
                    pivotValue
                );
        }

        steps.push({

            operation:
            `
            F${i+1}
            =
            \\frac{
                F${i+1}
            }{
                ${fractionToLatex(
                    pivotValue
                )}
            }
            `,

            description:
                "Se divide la fila pivote para convertir el pivote en 1.",

            matrix:
                cloneMatrix(A),

            pivot:
                i + 1
        });

        /* ===================== */
        /* HACER CEROS */
        /* ===================== */
        for(
            let j = 0;
            j < n;
            j++
        ){

            if(j === i)
                continue;

            if(
                A[j][i]
                .equals(0)
            ){
                continue;
            }

            const factor =
                new Fraction(
                    A[j][i]
                );

            for(
                let k = 0;
                k < n;
                k++
            ){

                A[j][k] =

                    A[j][k].sub(

                        factor.mul(
                            A[i][k]
                        )
                    );
            }

            steps.push({

                operation:
                `
                F${j+1}
                =
                F${j+1}
                -
                (${fractionToLatex(factor)})
                F${i+1}
                `,

                description:
                    "Se elimina el valor de la columna pivote para formar la matriz identidad.",

                matrix:
                    cloneMatrix(A),

                pivot:
                    i + 1
            });
        }
    }

    /* ===================== */
    /* SIGNO */
    /* ===================== */
    if(
        swaps % 2 !== 0
    ){

        determinant =
            determinant.mul(-1);
    }

    /* ===================== */
    /* PASO FINAL */
    /* ===================== */
    steps.push({

        operation:
        `
        A
        \\rightarrow
        I
        `,

        description:
            "La matriz fue reducida a la identidad mediante Gauss-Jordan.",

        matrix:
            cloneMatrix(A),

        pivot:
            n
    });

    /* ===================== */
    /* RESULTADO */
    /* ===================== */
    return {

        determinant,

        steps
    };
}