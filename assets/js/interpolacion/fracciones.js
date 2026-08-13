// ===============================
// FRACCIONES.JS
// GeoMath
// ===============================

// ===============================
// MCD
// ===============================

function mcd(a, b) {

    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));

    while (b !== 0) {

        const t = b;

        b = a % b;

        a = t;
    }

    return a || 1;
}

// ===============================
// CLASE FRACCION
// ===============================

class Fraccion {

    constructor(num, den = 1) {

        if (!Number.isFinite(num)) {

            throw new Error(
                "Numerador inválido"
            );
        }

        if (!Number.isFinite(den)) {

            throw new Error(
                "Denominador inválido"
            );
        }

        if (den === 0) {

            throw new Error(
                "Denominador no puede ser 0"
            );
        }

        this.num = Number(num);
        this.den = Number(den);

        this.simplificar();
    }

    simplificar() {

        if (this.num === 0) {

            this.den = 1;
            return;
        }

        const g = mcd(
            this.num,
            this.den
        );

        this.num /= g;
        this.den /= g;

        if (this.den < 0) {

            this.num *= -1;
            this.den *= -1;
        }
    }

    clone() {

        return new Fraccion(
            this.num,
            this.den
        );
    }

    // ===========================
    // TEXTO
    // ===========================

    toString() {

        if (this.den === 1) {

            return `${this.num}`;
        }

        // Si el denominador es muy grande, mostrar decimal
        if (
            this.den > 1000
        ) {

            return `${this.toDecimal().toFixed(6)}`;
        }

        return `${this.num}/${this.den}`;
    }

    // ===========================
    // LATEX
    // ===========================

    toLatex() {

        if (this.den === 1) {

            return `${this.num}`;
        }

        // Si el denominador es muy grande, mostrar decimal
        if (
            this.den > 1000
        ) {

            return `${this.toDecimal().toFixed(6)}`;
        }

        return `\\frac{${this.num}}{${this.den}}`;
    }

    // ===========================
    // DECIMAL
    // ===========================

    toDecimal() {

        return this.num / this.den;
    }
}

// ===============================
// DECIMAL → FRACCION EXACTA
// ===============================

function decimalAFraccion(decimal) {

    if (decimal instanceof Fraccion) {

        return decimal.clone();
    }

    if (!Number.isFinite(decimal)) {

        throw new Error(
            "Valor inválido"
        );
    }

    if (Number.isInteger(decimal)) {

        return new Fraccion(
            decimal,
            1
        );
    }

    const signo =
        decimal < 0 ? -1 : 1;

    decimal =
        Math.abs(decimal);

    const texto =
        decimal.toString();

    if (
        texto.includes("e")
    ) {

        const precision =
            1000000000;

        return new Fraccion(
            Math.round(decimal * precision) * signo,
            precision
        );
    }

    const decimales =
        texto.split(".")[1].length;

    const denominador =
        Math.pow(
            10,
            decimales
        );

    const numerador =
        Math.round(
            decimal *
            denominador
        ) * signo;

    return new Fraccion(
        numerador,
        denominador
    );
}

// ===============================
// CONVERTIR
// ===============================

function aFraccion(valor) {

    if (
        valor instanceof Fraccion
    ) {

        return valor.clone();
    }

    if (
        !Number.isFinite(valor)
    ) {

        throw new Error(
            "Valor inválido"
        );
    }

    return decimalAFraccion(
        valor
    );
}

// ===============================
// SUMAR
// ===============================

function sumar(a, b) {

    a = aFraccion(a);
    b = aFraccion(b);

    return new Fraccion(

        a.num * b.den +
        b.num * a.den,

        a.den * b.den
    );
}

// ===============================
// RESTAR
// ===============================

function restar(a, b) {

    a = aFraccion(a);
    b = aFraccion(b);

    return new Fraccion(

        a.num * b.den -
        b.num * a.den,

        a.den * b.den
    );
}

// ===============================
// MULTIPLICAR
// ===============================

function multiplicar(a, b) {

    a = aFraccion(a);
    b = aFraccion(b);

    return new Fraccion(

        a.num * b.num,

        a.den * b.den
    );
}

// ===============================
// DIVIDIR
// ===============================

function dividir(a, b) {

    a = aFraccion(a);
    b = aFraccion(b);

    if (b.num === 0) {

        throw new Error(
            "División entre cero"
        );
    }

    return new Fraccion(

        a.num * b.den,

        a.den * b.num
    );
}

// ===============================
// NEGAR
// ===============================

function negar(a) {

    a = aFraccion(a);

    return new Fraccion(

        -a.num,

        a.den
    );
}

// ===============================
// POTENCIA
// ===============================

function potencia(a, n) {

    a = aFraccion(a);

    if (n === 0) {

        return new Fraccion(
            1,
            1
        );
    }

    let resultado =
        new Fraccion(
            1,
            1
        );

    for (
        let i = 0;
        i < Math.abs(n);
        i++
    ) {

        resultado =
            multiplicar(
                resultado,
                a
            );
    }

    if (n < 0) {

        resultado =
            dividir(
                1,
                resultado
            );
    }

    return resultado;
}

// ===============================
// COMPARAR
// ===============================

function iguales(a, b) {

    a = aFraccion(a);
    b = aFraccion(b);

    return (

        a.num === b.num
        &&
        a.den === b.den

    );
}

// ===============================
// GLOBALES
// ===============================

window.Fraccion =
    Fraccion;

window.sumar =
    sumar;

window.restar =
    restar;

window.multiplicar =
    multiplicar;

window.dividir =
    dividir;

window.negar =
    negar;

window.potencia =
    potencia;

window.iguales =
    iguales;

window.aFraccion =
    aFraccion;

window.decimalAFraccion =
    decimalAFraccion;