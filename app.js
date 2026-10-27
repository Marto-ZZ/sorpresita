(function(){
  'use strict';

  /* AJUSTES */
  var AJUSTES = {
    cariciasNecesarias: 9,     // subilo si querés que cueste más
    valorDeUnToque:     0.30,  // cuánto suma tocar sin arrastrar
    topePorMovimiento:  0.25,  // freno: un manotazo no puede contar de más
    seDespiertaEn:      12,    // % de la barra en el que abre los ojos
    corazonesEnTotal:   14     // cuántos corazoncitos salen en todo el camino
  };

  /* atajos */
  function $(id){ return document.getElementById(id); }

  var app    = $('app'),
      scene  = $('scene'),
      stage  = $('stage'),
      hint   = $('hint'),
      hints  = $('hints'),
      hearts = $('hearts'),
      meter  = $('meter'),
      fill   = $('meterFill'),
      purin  = $('purin'),
      held   = $('held'),
      eyesO  = $('eyesOpen'),
      eyesC  = $('eyesClosed'),
      zzz    = $('zzz');

  var estado = 'durmiendo';   // durmiendo -> despierto -> buscando -> sobre -> carta
  var caricia = 0;            // 0 .. AJUSTES.cariciasNecesarias
  var ultimo = null;
  var apretado = false;
  var desdeCorazon = 0;

  function porcentaje(){
    return Math.min(100, caricia / AJUSTES.cariciasNecesarias * 100);
  }

  /* textos */
  function decir(clave){
    var nodo = null;

    if (typeof clave === 'string'){
      nodo = hints.querySelector('[data-at="' + clave + '"]');
    } else {
      var todos = hints.querySelectorAll('[data-at]');
      for (var i = 0; i < todos.length; i++){
        var at = parseFloat(todos[i].getAttribute('data-at'));
        if (!isNaN(at) && at <= clave) nodo = todos[i];
      }
    }

    if (nodo && hint.innerHTML !== nodo.innerHTML) hint.innerHTML = nodo.innerHTML;
  }

  /* puntitos de fondo */
  (function puntitos(){
    var caja = $('dots');
    for (var i = 0; i < 14; i++){
      var d = document.createElement('div');
      d.className = 'dot';
      var s = 4 + Math.random() * 9;
      d.style.width = d.style.height = s.toFixed(1) + 'px';
      d.style.left = (Math.random() * 100).toFixed(1) + '%';
      d.style.top  = (Math.random() * 100).toFixed(1) + '%';
      d.style.animationDuration = (7 + Math.random() * 9).toFixed(1) + 's';
      d.style.animationDelay = (-Math.random() * 10).toFixed(1) + 's';
      caja.appendChild(d);
    }
  })();

  /* corazoncitos */
  function corazon(x, y){
    var e = document.createElement('span');
    e.className = 'heart';
    var pool = ['💛', '🤍', '💗', '✨', '💛'];
    e.textContent = pool[(Math.random() * pool.length) | 0];
    e.style.left = x + 'px';
    e.style.top  = y + 'px';
    e.style.fontSize = (15 + Math.random() * 11).toFixed(0) + 'px';
    hearts.appendChild(e);
    e.addEventListener('animationend', function(){ e.remove(); });
  }

  /*  la caricia  */
  function acariciar(cantidad, x, y){
    if (estado !== 'durmiendo' && estado !== 'despierto') return;

    caricia = Math.min(AJUSTES.cariciasNecesarias, caricia + cantidad);

    meter.classList.add('on');
    fill.style.width = porcentaje() + '%';

    desdeCorazon += cantidad;
    if (desdeCorazon >= AJUSTES.cariciasNecesarias / AJUSTES.corazonesEnTotal){
      desdeCorazon = 0;
      corazon(x, y);
    }

    if (estado === 'durmiendo' && porcentaje() >= AJUSTES.seDespiertaEn) despertar();

    decir(porcentaje());

    if (caricia >= AJUSTES.cariciasNecesarias) irABuscarElSobre();
  }

  function despertar(){
    estado = 'despierto';
    scene.classList.add('awake');
    eyesC.setAttribute('opacity', '0');
    eyesO.setAttribute('opacity', '1');
    zzz.style.opacity = '0';
  }

  /*  dedo / mouse  */
  function anchoEscenario(){
    var w = stage.getBoundingClientRect().width;
    return w > 0 ? w : 320;
  }

  function puntoLocal(evt){
    var r = stage.getBoundingClientRect();
    return { x: evt.clientX - r.left, y: evt.clientY - r.top };
  }

  scene.addEventListener('pointerdown', function(e){
    apretado = true;
    ultimo = { x: e.clientX, y: e.clientY };
    var p = puntoLocal(e);
    acariciar(AJUSTES.valorDeUnToque, p.x, p.y);
    if (scene.setPointerCapture){
      try { scene.setPointerCapture(e.pointerId); } catch (err){}
    }
  });

  scene.addEventListener('pointermove', function(e){
    if (!apretado || !ultimo) return;

    var dx = e.clientX - ultimo.x,
        dy = e.clientY - ultimo.y,
        dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2) return;
    ultimo = { x: e.clientX, y: e.clientY };

    var p = puntoLocal(e);
    acariciar(Math.min(dist / anchoEscenario(), AJUSTES.topePorMovimiento), p.x, p.y);
  });

  function soltar(){ apretado = false; ultimo = null; }
  scene.addEventListener('pointerup', soltar);
  scene.addEventListener('pointercancel', soltar);

  /* teclado, por si alguien entra desde una compu sin mouse */
  scene.setAttribute('tabindex', '0');
  scene.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      var r = stage.getBoundingClientRect();
      acariciar(AJUSTES.cariciasNecesarias / 24, r.width / 2, r.height / 2);
    }
  });

  /*  va a buscar el sobre  */
  function irABuscarElSobre(){
    estado = 'buscando';
    scene.classList.add('fetching');
    meter.classList.remove('on');
    decir('fetch');

    purin.style.transform = 'translate(118px, 6px)';
    setTimeout(function(){ purin.style.opacity = '.2'; }, 340);

    setTimeout(function(){
      held.setAttribute('opacity', '1');
      purin.style.opacity = '1';
      purin.style.transform = 'translate(0px, 0px)';
      decir('brought');
    }, 1150);

    setTimeout(mostrarSobre, 2150);
  }

  /*  las tarjetas  */
  function abrirCapa(idPlantilla){
    var capa = document.createElement('div');
    capa.className = 'overlay';
    capa.appendChild($(idPlantilla).content.cloneNode(true));
    app.appendChild(capa);
    return capa;
  }

  function mostrarSobre(){
    estado = 'sobre';
    var capa = abrirCapa('tpl-envelope');
    var boton = capa.querySelector('.envelope');
    boton.focus({ preventScroll: true });
    boton.addEventListener('click', function(){
      capa.remove();
      mostrarCarta();
    });
  }

  function mostrarCarta(){
    estado = 'carta';
    var capa = abrirCapa('tpl-letter');
    var limpiar = armarCarrusel(capa);

    var escapista = capa.querySelector('.escapes');
    if (escapista) hacerEscapar(escapista, capa.querySelector('.escape-zone'));

    /* solo los que tienen data-a cuentan como respuesta */
    var botones = capa.querySelectorAll('.ans[data-a]');

    for (var i = 0; i < botones.length; i++){
      botones[i].addEventListener('click', function(){
        var respuesta = this.getAttribute('data-a');
        limpiar();
        capa.remove();
        mostrarFinal(respuesta);
      });
    }
  }

  /*  lo que ella escriba */
  function armarRespuesta(capa){
    var caja = capa.querySelector('.reply');
    if (!caja) return;

    var texto  = caja.querySelector('textarea'),
        enviar = caja.querySelector('.send'),
        aviso  = caja.querySelector('.sent'),
        config = $('destino');

    var numero = ((config && config.getAttribute('data-whatsapp')) || '').replace(/[^0-9]/g, '');
    var form   = ((config && config.getAttribute('data-form')) || '').trim();

    function actualizar(){
      var t = texto.value.trim();

      if (!t){
        enviar.classList.add('off');
        enviar.removeAttribute('href');
        return;
      }

      enviar.classList.remove('off');
      enviar.href = form
        ? form + encodeURIComponent(t)
        : 'https://wa.me/' + numero + '?text=' + encodeURIComponent(t);
    }

    texto.addEventListener('input', actualizar);

    /* De la URL de relleno previo salen los datos para mandarlo
       calladito, sin que ella tenga que ir al formulario:
       .../viewform?...entry.123=   ->   .../formResponse  +  entry.123  */
    var envioURL = '', campo = '';
    if (form){
      var base = form.match(/^(https:\/\/docs\.google\.com\/forms\/[^?]*?)\/viewform/);
      var ent  = form.match(/(entry\.\d+)=\s*$/);
      if (base && ent){
        envioURL = base[1] + '/formResponse';
        campo    = ent[1];
      }
    }

    function mandarCallado(t){
      var datos = new URLSearchParams();
      datos.append(campo, t);
      /* no-cors: el navegador manda el pedido pero no deja leer la
         respuesta, así que esto confirma que salió, no que Google lo
         haya aceptado. Si el visor lo bloquea, el fetch falla y ahí
         caemos en abrir el formulario como antes.                   */
      return fetch(envioURL, { method: 'POST', mode: 'no-cors', body: datos })
        .then(function(){ return true; })
        .catch(function(){ return false; });
    }

    var dejarPasar = false;

    enviar.addEventListener('click', function(e){
      if (dejarPasar){ dejarPasar = false; return; }   /* el click de respaldo */

      if (!texto.value.trim()){
        e.preventDefault();
        texto.focus();
        return;
      }

      /* sin envío directo configurado, se abre el link de siempre */
      if (!envioURL){
        if (aviso) aviso.hidden = false;
        return;
      }

      e.preventDefault();
      enviar.classList.add('off');

      mandarCallado(texto.value.trim()).then(function(salio){
        enviar.classList.remove('off');

        if (salio){
          if (aviso) aviso.hidden = false;
          texto.readOnly = true;
          return;
        }

        /* lo bloquearon: abrimos el formulario con el texto cargado.
           Acá no se avisa "listo", porque todavía le falta apretar
           Enviar en la página de Google.                           */
        dejarPasar = true;
        enviar.click();
      });
    });

    actualizar();
  }

  /* el botón que se escapa */
  function hacerEscapar(boton, cancha){
    if (!boton || !cancha) return;

    var textos = [];
    var lista = $('escapes');
    if (lista){
      var spans = lista.querySelectorAll('span');
      for (var i = 0; i < spans.length; i++) textos.push(spans[i].textContent.trim());
    }

    var dx = 0, dy = 0, veces = 0, ultimo = 0;

    function escapar(e){
      if (e && e.cancelable) e.preventDefault();

      /* el dedo dispara varios eventos seguidos; que cuente uno solo */
      var ahora = Date.now();
      if (ahora - ultimo < 160) return;
      ultimo = ahora;

      /* el texto primero, porque al cambiar cambia el ancho */
      if (textos.length){
        boton.textContent = textos[Math.min(veces, textos.length - 1)];
      }
      veces++;

      var rangoX = Math.max(0, (cancha.clientWidth  - boton.offsetWidth)  / 2 - 2),
          rangoY = Math.max(0, (cancha.clientHeight - boton.offsetHeight) / 2 - 2);

      /* que el salto se note: reintenta hasta encontrar un lugar lejos */
      var nx, ny, intentos = 0;
      var saltoMinimo = Math.min(80, rangoX);
      do {
        nx = (Math.random() * 2 - 1) * rangoX;
        ny = (Math.random() * 2 - 1) * rangoY;
        intentos++;
      } while (intentos < 20 &&
               Math.sqrt((nx - dx) * (nx - dx) + (ny - dy) * (ny - dy)) < saltoMinimo);

      dx = nx;
      dy = ny;
      boton.style.transform = 'translate(' + Math.round(dx) + 'px,' + Math.round(dy) + 'px)';

      if (boton.blur) boton.blur();
    }

    boton.addEventListener('pointerenter', escapar);   /* mouse */
    boton.addEventListener('pointerdown', escapar);    /* dedo */
    boton.addEventListener('focus', escapar);          /* teclado */
    boton.addEventListener('click', escapar);          /* por las dudas */
  }

  /* el carrusel */
  function armarCarrusel(capa){
    var viewport = capa.querySelector('.viewport'),
        track    = capa.querySelector('.track'),
        slides   = capa.querySelectorAll('.slide'),
        prev     = capa.querySelector('.prev'),
        next     = capa.querySelector('.next'),
        pager    = capa.querySelector('.pager');

    var actual = 0;
    var yaNavego = false;

    /* un puntito por tarjeta */
    for (var i = 0; i < slides.length; i++){
      (function(n){
        var p = document.createElement('button');
        p.type = 'button';
        p.setAttribute('aria-label', 'Ir a la tarjeta ' + (n + 1));
        p.addEventListener('click', function(){ ir(n); });
        pager.appendChild(p);
      })(i);
    }
    var puntos = pager.querySelectorAll('button');

    function acomodar(){
      viewport.style.height = slides[actual].offsetHeight + 'px';
      track.style.transform = 'translateX(' + (-actual * 100) + '%)';

      prev.disabled = (actual === 0);
      next.disabled = (actual === slides.length - 1);
      next.classList.toggle('calling', !yaNavego && actual === 0);

      for (var i = 0; i < puntos.length; i++){
        puntos[i].setAttribute('aria-current', i === actual ? 'true' : 'false');
      }
    }

    function ir(n){
      n = Math.max(0, Math.min(slides.length - 1, n));
      if (n !== actual) yaNavego = true;
      actual = n;
      acomodar();
    }

    prev.addEventListener('click', function(){ ir(actual - 1); });
    next.addEventListener('click', function(){ ir(actual + 1); });

    /* deslizar con el dedo */
    var x0 = 0, y0 = 0, arrastrando = false;

    viewport.addEventListener('pointerdown', function(e){
      arrastrando = true;
      x0 = e.clientX;
      y0 = e.clientY;
    });
    viewport.addEventListener('pointerup', function(e){
      if (!arrastrando) return;
      arrastrando = false;
      var dx = e.clientX - x0, dy = e.clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)){
        ir(actual + (dx < 0 ? 1 : -1));
      }
    });
    viewport.addEventListener('pointercancel', function(){ arrastrando = false; });

    /* flechas del teclado */
    capa.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight'){ e.preventDefault(); ir(actual + 1); }
      if (e.key === 'ArrowLeft'){  e.preventDefault(); ir(actual - 1); }
    });

    /* si una foto entra tarde o cambia la pantalla, recalcular el alto */
    var fotos = capa.querySelectorAll('.banner');
    for (var k = 0; k < fotos.length; k++) fotos[k].addEventListener('load', acomodar);
    window.addEventListener('resize', acomodar);

    acomodar();
    next.focus({ preventScroll: true });

    return function limpiar(){ window.removeEventListener('resize', acomodar); };
  }

  function mostrarFinal(respuesta){
    var capa = abrirCapa('tpl-final');

    /* deja solo el bloque que corresponde a la respuesta elegida */
    var bloques = capa.querySelectorAll('[data-answer]');
    for (var i = 0; i < bloques.length; i++){
      if (bloques[i].getAttribute('data-answer') !== respuesta) bloques[i].remove();
    }

    armarRespuesta(capa);

    var r = stage.getBoundingClientRect();
    for (var j = 0; j < 16; j++){
      (function(n){
        setTimeout(function(){
          corazon(Math.random() * r.width, r.height * (0.4 + Math.random() * 0.5));
        }, n * 85);
      })(j);
    }
  }

  /*  arranque 
     Las fotos de la carta se bajan ahora, mientras acaricia,
     así ya están listas cuando se abre el sobre.              */
  (function precargarFotos(){
    var plantilla = $('tpl-letter');
    if (!plantilla) return;
    var fotos = plantilla.content.querySelectorAll('img');
    for (var i = 0; i < fotos.length; i++){
      var pre = new Image();
      pre.src = fotos[i].getAttribute('src');
    }
  })();

  decir(0);
})();
