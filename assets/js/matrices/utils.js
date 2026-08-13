/* ===================== */
/* CREATE EMPTY MATRIX */
/* ===================== */
function createMatrixData(size){

    return Array.from(
        { length: size },
        () =>
            Array(size)
            .fill("")
    );
}

/* ===================== */
/* CLONE MATRIX */
/* ===================== */
function cloneMatrix(matrix){

    return matrix.map(
        row =>

            row.map(
                cell =>
                    new Fraction(cell)
            )
    );
}

/* ===================== */
/* FRACTION TO LATEX */
/* ===================== */
function fractionToLatex(frac){

    if(frac.d === 1){

        return `${frac.s * frac.n}`;
    }

    return `\\frac{${frac.s * frac.n}}{${frac.d}}`;
}

/* ===================== */
/* MATRIX TO LATEX */
/* ===================== */
function matrixToLatex(matrix){

    const rows = matrix.map(
        row =>

            row.map(
                cell =>
                    fractionToLatex(cell)
            )
            .join(" & ")

    ).join(" \\\\ ");

    return `
    \\begin{bmatrix}
    ${rows}
    \\end{bmatrix}
    `;
}