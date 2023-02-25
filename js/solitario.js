/***** INICIO DECLARACIÓN DE VARIABLES GLOBALES *****/

const PALOS = ["ova", "cua", "hex", "cir"];
const NUMEROS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
//const NUMEROS = [9, 10, 11, 12];

// paso (top y left) en pixeles de una carta a la siguiente en un mazo
const MARGEN_ENTRE_CARTA = 5;
const INCREMENTO_MARGEN = 5;

/*
	Funciones Drag & Drop -> Zona de destino
	Le indicamos al navegador que no haga lo que tiene asignado por defecto:
	dragenter: Se dispara cuando el objeto entra en la zona de destino
    dragover: Se dispara cuando el objeto se mueve sobre la zona de destino
    drop: Se dispara cuando soltamos el objeto en la zona de destino
*/
const dragEnter = (e) => e.preventDefault();
const dragOver = (e) => e.preventDefault();
const dragLeave = (e) => e.preventDefault();

const botonReiniciar = document.getElementById("reset");

// Tapetes
let tapete_inicial = document.getElementById("inicial");
let tapete_sobrantes = document.getElementById("sobrantes");
let tapete_receptor1 = document.getElementById("receptor1");
let tapete_receptor2 = document.getElementById("receptor2");
let tapete_receptor3 = document.getElementById("receptor3");
let tapete_receptor4 = document.getElementById("receptor4");

// Mazos
let mazo_inicial = [];
let mazo_sobrantes = [];
let mazo_receptor1 = [];
let mazo_receptor2 = [];
let mazo_receptor3 = [];
let mazo_receptor4 = [];

// Contadores de canombreCartasrtas
let cont_inicial = document.getElementById("contador_inicial");
let cont_sobrantes = document.getElementById("contador_sobrantes");
let cont_receptor1 = document.getElementById("contador_receptor1");
let cont_receptor2 = document.getElementById("contador_receptor2");
let cont_receptor3 = document.getElementById("contador_receptor3");
let cont_receptor4 = document.getElementById("contador_receptor4");
let cont_movimientos = document.getElementById("contador_movimientos");

// Tiempo
let cont_tiempo = document.getElementById("contador_tiempo"); // span cuenta tiempo
let segundos = 0; // cuenta de segundos
let temporizador = null; // manejador del temporizador

/*** !!!!!!!!!!!!!!!!!!! CÓDIGO PRINCIPAL !!!!!!!!!!!!!!!!!!!! **/
// Rutina asociada a boton reset: comenzar_juego
botonReiniciar.addEventListener("click", () => location.reload());

// El juego arranca ya al cargar la página: no se espera a reiniciar
addEventListener("load", () => comenzarJuego());

/* 	Crear baraja, es decir crear el mazo_inicial. Este será un array cuyos 
	elementos serán elementos HTML <img>, siendo cada uno de ellos una carta.
	Sugerencia: en dos bucles for, bárranse los "palos" y los "numeros", formando
	oportunamente el nombre del fichero png que contiene a la carta (recuérdese poner
	el path correcto en la URL asociada al atributo src de <img>). Una vez creado
	el elemento img, inclúyase como elemento del array mazo_inicial. 
*/
function comenzarJuego() {
    // creamos un array con los nombres de las cartas
    const arrayNombresCartas = crearNombresCartas();

    // creamos HTMLElements de las cartas
    crearElementosHtmlCartas(arrayNombresCartas);

    // Barajamos el mazo inicial
    barajar(mazo_inicial);

    // Dejamos el mazo barajeado en el tapete inicial
    cargarTapeteInicial(mazo_inicial);

    // Puesta a cero de contadores de mazos
    actualizarContadores();
    set_contador(cont_movimientos, 0);

    // Arrancar el conteo de tiempo
    arrancarTiempo();
}

/****** FUNCIONES DE EVENTO *******/
/*
	transferimos la info para identificar la carta:
	'e.target' es el elemento HTML (la carta)
	se accede a un atributo "data-" con la sintaxis:
	'e.target.dataset[atributo sin prefijo data-]'
*/
function dragStart(event) {
    event.dataTransfer.setData("text/plain/id", event.target.id);
}

function drop(event) {
    // evitamos que se ejecute la acción por defecto
    event.preventDefault();

    // recuperamos el elemento carta
    currentCartaHtml = document.getElementById(
        event.dataTransfer.getData("text/plain/id")
    );

    // consultamos el mazo de destino
    let elementoDestino = comprobarTapeteDestino(event.target);

    // comprobamos si el target es correcto
    if (destinoValido(elementoDestino)) {
        // comprobamos si la carta proviene de otro mazo
        if (distintaProcedencia(elementoDestino, currentCartaHtml)) {
            // intentamos meter la carta en el mazo
            if (meterCartaEnMazo(elementoDestino, currentCartaHtml)) {
                // comprobamos la jugada efectuada
                finalizarJugadaEfectuada();
            }
        }
    }
}

function crearNombresCartas() {
    let arrayNombresCartas = [];

    for (let i = 0; i < PALOS.length; i++) {
        for (let j = 0; j < NUMEROS.length; j++) {
            let nombreCarta = `${NUMEROS[j]}-${PALOS[i]}`;
            arrayNombresCartas.push(nombreCarta);
        }
    }

    return arrayNombresCartas;
}

function crearElementosHtmlCartas(arrayNombres) {
    for (let i = 0; i < arrayNombres.length; i++) {
        let nombreCarta = arrayNombres[i];

        // separamos el número del palo
        let indice = nombreCarta.indexOf("-");
        let palo = nombreCarta.substring(indice + 1);
        let numero = nombreCarta.substring(0, indice);

        // generamos un color para la carta en función del palo
        let color = "naranja";
        palo == "cir" || palo == "hex" ? (color = "gris") : (color = "naranja");

        // creamos el elemento HTML
        const cartaHtml = document.createElement("IMG");

        // añadimos los atributos al elemento HTML
        cartaHtml.setAttribute("draggable", "false");
        cartaHtml.setAttribute("id", `${nombreCarta}`);
        cartaHtml.setAttribute("class", "carta");
        cartaHtml.setAttribute("src", `imagenes/baraja/${nombreCarta}.png`);
        cartaHtml.setAttribute("palo", palo);
        cartaHtml.setAttribute("numero", numero);
        cartaHtml.setAttribute("color", color);

        /*
			Funciones Drag & Drop -> Objeto a arrastrar
			dragstart: Se dispara al comenzar a arrastrar
            drag: Se dispara mientras arrastramos
            dragend: Se dispara cuando soltamos el objeto

			Para los eventos drag y dragend asignamos funciones vacías
			porque no vamos a realizar ninguna acción
		*/
        cartaHtml.addEventListener("dragstart", dragStart);

        mazo_inicial.push(cartaHtml);
    }
}

function barajar(mazo) {
    //Algoritmo de Fisher-Yates
    for (let i = mazo.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // índice aleatorio entre 0 e i

        // intercambia elementos array[i] y array[j]
        // usamos la sintaxis "asignación de desestructuración" para lograr eso
        // encontrarás más información acerca de esa sintaxis en los capítulos siguientes
        // lo mismo puede ser escrito como:
        // let t = array[i]; array[i] = array[j]; array[j] = t
        [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
    }

    return mazo;
}

/**
 	En el elemento HTML que representa el tapete inicial (variable tapete_inicial)
	se deben añadir como hijos todos los elementos <img> del array mazo.
	Antes de añadirlos, se deberían fijar propiedades como la anchura, la posición,
	coordenadas top y left, algun atributo de tipo data-...
	Al final se debe ajustar el contador de cartas a la cantidad oportuna
*/
function cargarTapeteInicial(mazo) {
    let desplazamiento = MARGEN_ENTRE_CARTA;
    // creamos un fragmento para no recargar toda la página
    const fragmento = document.createDocumentFragment();

    mazo.forEach((cartaHtml) => {
        // establecemos desplazamiento superior e izquierdo de 5px
        cartaHtml.style.top = `${desplazamiento}px`;
        cartaHtml.style.left = `${desplazamiento}px`;
        desplazamiento += INCREMENTO_MARGEN;

        // asignamos el mazo de procedencia
        cartaHtml.setAttribute("procedencia", tapete_inicial.id);

        // incluimos cada carta en el fragmento
        fragmento.appendChild(cartaHtml);
    });

    // inyectamos el fragmento en el código
    tapete_inicial.appendChild(fragmento);

    // ajustamos el contador de cartas
    set_contador(cont_inicial, mazo.length);

    activarPrimeraCarta();
}

function activarPrimeraCarta() {
    if (mazo_inicial.length > 0) {
        mazo_inicial[mazo_inicial.length - 1].setAttribute("draggable", "true");
    }
}

/*
	Devolvemos el elemento padre (un tapete) si el elemento de destino es una carta ya 
    almacenada en un tapete
*/
function comprobarTapeteDestino(elementoHtmlDestino) {
    if (elementoHtmlDestino.parentNode == tapete_sobrantes) {
        return tapete_sobrantes;
    } else if (elementoHtmlDestino.parentNode == tapete_receptor1) {
        return tapete_receptor1;
    } else if (elementoHtmlDestino.parentNode == tapete_receptor2) {
        return tapete_receptor2;
    } else if (elementoHtmlDestino.parentNode == tapete_receptor3) {
        return tapete_receptor3;
    } else if (elementoHtmlDestino.parentNode == tapete_receptor4) {
        return tapete_receptor4;
    } else return elementoHtmlDestino;
}

/*
    Comprueba si el destino es uno de los tapetes de cartas
*/
function destinoValido(elementoHtmlDestino) {
    let esValido = false;

    if (elementoHtmlDestino.id == tapete_sobrantes.id) esValido = true;
    else if (elementoHtmlDestino.id == tapete_receptor1.id) esValido = true;
    else if (elementoHtmlDestino.id == tapete_receptor2.id) esValido = true;
    else if (elementoHtmlDestino.id == tapete_receptor3.id) esValido = true;
    else if (elementoHtmlDestino.id == tapete_receptor4.id) esValido = true;

    return esValido;
}

/*
    Comprueba si la carta proviene del mismo tapete o de uno diferente
*/
function distintaProcedencia(tapeteDestino, currentCarta) {
    const procedenciaCarta = currentCarta.getAttribute("procedencia");
    let esValido = false;

    if (procedenciaCarta !== tapeteDestino.id) {
        esValido = true;
    }

    return esValido;
}

function meterCartaEnMazo(tapeteDestino, currentCartaHtml) {
    let esValido = false;

    switch (tapeteDestino.id) {
        case tapete_sobrantes.id:
            //añadimos carta al mazo sobrantes
            mazo_sobrantes.push(currentCartaHtml);

            // añadimos la carta al mazo de sobrantes sin necesidad de comprobar nada
            tapete_sobrantes.appendChild(currentCartaHtml);

            //eliminamos primera carta del mazo inicial (ultima a nivel programatico)
            mazo_inicial.pop();

            esValido = true;
            break;
        case tapete_receptor1.id:
            esValido = validarMovimientoEnTapeteRepector(
                mazo_receptor1,
                currentCartaHtml
            );
            break;
        case tapete_receptor2.id:
            esValido = validarMovimientoEnTapeteRepector(
                mazo_receptor2,
                currentCartaHtml
            );
            break;
        case tapete_receptor3.id:
            esValido = validarMovimientoEnTapeteRepector(
                mazo_receptor3,
                currentCartaHtml
            );
            break;
        case tapete_receptor4.id:
            esValido = validarMovimientoEnTapeteRepector(
                mazo_receptor4,
                currentCartaHtml
            );
            break;
    }

    if (esValido) {
        // ponemos la carta en el tapete de destino
        tapeteDestino.appendChild(currentCartaHtml);

        // reestablecemos posición de la carta Html
        currentCartaHtml.style.top = `${0}px`;
        currentCartaHtml.style.left = `${0}px`;

        // establecemos los atributos de la carta movida
        currentCartaHtml.setAttribute("procedencia", `${tapeteDestino.id}`);
    }

    return esValido;
}

function validarMovimientoEnTapeteRepector(mazoDestino, currentCartaHtml) {
    const colorCurrentCarta = currentCartaHtml.getAttribute("color");
    const numeroCurrentCarta = currentCartaHtml.getAttribute("numero");
    const procedenciaCurrentCarta =
        currentCartaHtml.getAttribute("procedencia");

    let esValido = false;
    if (mazoDestino.length <= 0) {
        if (numeroCurrentCarta == 12) {
            esValido = true;
        }
    } else if (mazoDestino.length > 0) {
        const ultimaCarta = mazoDestino[mazoDestino.length - 1];
        const numeroUltimaCarta = ultimaCarta.getAttribute("numero");
        const colorUltimaCarta = ultimaCarta.getAttribute("color");

        if (
            colorCurrentCarta != colorUltimaCarta &&
            numeroCurrentCarta == numeroUltimaCarta - 1
        ) {
            esValido = true;
        }
    }

    if (esValido) {
        // cambiamos los atributoa de la carta añadida
        currentCartaHtml.setAttribute("draggable", "false");

        //añadimos carta al mazo sobrantes
        mazoDestino.push(currentCartaHtml);

        //eliminamos primera carta del mazo de origen
        if (procedenciaCurrentCarta == tapete_inicial.id) {
            mazo_inicial.pop();
        } else if (procedenciaCurrentCarta == tapete_sobrantes.id) {
            mazo_sobrantes.pop();
        }
    }

    return esValido;
}

function finalizarJugadaEfectuada() {
    if (mazo_inicial.length <= 0) {
        if (mazo_sobrantes <= 0) {
            alert(
                `ENHORABUENA!!!, has ganado la partida.
                Movimientos efectuados =  ${cont_movimientos.innerHTML}
                Tiempo total = ${cont_tiempo.innerHTML}`
            );

            pararTiempo();
        } else {
            moverMazoSobranteAInicial();
        }
    }

    inc_contador(cont_movimientos);

    actualizarContadores();

    activarPrimeraCarta();
}

function moverMazoSobranteAInicial() {
    mazo_inicial = mazo_sobrantes;
    mazo_sobrantes = [];
    barajar(mazo_inicial);
    cargarTapeteInicial(mazo_inicial);
}

/****** FUNCIONES DE CONTADOR*******/
function actualizarContadores() {
    set_contador(cont_sobrantes, mazo_sobrantes.length);
    set_contador(cont_receptor1, mazo_receptor1.length);
    set_contador(cont_receptor2, mazo_receptor2.length);
    set_contador(cont_receptor3, mazo_receptor3.length);
    set_contador(cont_receptor4, mazo_receptor4.length);
    set_contador(cont_inicial, mazo_inicial.length);
}

function inc_contador(contador) {
    contador.textContent = +contador.textContent + 1;
}

function dec_contador(contador) {
    contador.textContent = +contador.textContent - 1;
}

function set_contador(contador, valor) {
    contador.textContent = valor;
}

/**
	Se debe encargar de arrancar el temporizador: cada 1000 ms se
	debe ejecutar una función que a partir de la cuenta autoincrementada
	de los segundos (segundos totales) visualice el tiempo oportunamente con el 
	format hh:mm:ss en el contador adecuado.

	Para descomponer los segundos en horas, minutos y segundos pueden emplearse
	las siguientes igualdades:

	segundos = truncar (   segundos_totales % (60)                 )
	minutos  = truncar ( ( segundos_totales % (60*60) )     / 60   )
	horas    = truncar ( ( segundos_totales % (60*60*24)) ) / 3600 )

	donde % denota la operación módulo (resto de la división entre los operadores)

	Así, por ejemplo, si la cuenta de segundos totales es de 134 s, entonces será:
	   00:02:14

	Como existe la posibilidad de "resetear" el juego en cualquier momento, hay que 
	evitar que exista más de un temporizador simultáneo, por lo que debería guardarse
	el resultado de la llamada a setInterval en alguna variable para llamar oportunamente
	a clearInterval en su caso.   
*/
function arrancarTiempo() {
    if (temporizador) clearInterval(temporizador);
    let hms = function () {
        let seg = Math.trunc(segundos % 60);
        let min = Math.trunc((segundos % 3600) / 60);
        let hor = Math.trunc((segundos % 86400) / 3600);
        let tiempo =
            (hor < 10 ? "0" + hor : "" + hor) +
            ":" +
            (min < 10 ? "0" + min : "" + min) +
            ":" +
            (seg < 10 ? "0" + seg : "" + seg);
        set_contador(cont_tiempo, tiempo);
        segundos++;
    };
    segundos = 0;
    hms(); // Primera visualización 00:00:00
    temporizador = setInterval(hms, 1000);
}

function pararTiempo() {
    clearInterval(temporizador);
}
