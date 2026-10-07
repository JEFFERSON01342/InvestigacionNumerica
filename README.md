# GeoMath

Para usar la gráfica de Desmos, no abras los archivos HTML con doble clic (`file://`).
Desde esta carpeta ejecuta:

```powershell
node server-local.js
```

Después abre [http://localhost:8080/](http://localhost:8080/); la página principal abre directamente Programación Lineal.

La página incluye Símplex estándar y dual, Símplex revisado, Gran M, Dos Fases y método gráfico. El Símplex dual solo aparece para modelos con restricciones ≤ después de convertir las restricciones ≥ multiplicándolas por −1, variables no negativas, al menos un lado derecho negativo y una fila objetivo inicialmente dual-factible. El ejemplo incluido resuelve un modelo de minimización con restricciones ≥. El Símplex revisado muestra las matrices de cada iteración y también puede resolver el modelo dual.

En Configuración puedes seleccionar un ejemplo correspondiente al método actual y pulsar **Cargar y resolver ejemplo** para llenar el modelo y ver su procedimiento automáticamente. El ejemplo de Símplex dual siempre está disponible en esa lista y activa ese método al cargarlo, incluso si aún no hay un modelo compatible. Al terminar la guía inicial aparece un recorrido interactivo por la configuración, los signos, los ejemplos y los campos de entrada; también se puede volver a abrir desde **Ver guía**.

Los métodos se habilitan según el modelo que se resolverá; al activar el dual, la compatibilidad se recalcula para el primal o el dual seleccionado. Al pasar el cursor por el método seleccionado se muestra el motivo de su disponibilidad. En los campos matemáticos, escribir un coeficiente numérico y pulsar espacio agrega automáticamente la siguiente variable disponible entre `x`, `y`, `z`, `w`, `u` y `v`.
