(function(){
  'use strict';

  /* ==============================================================
     AJUSTES — tocá estos números para cambiar cuánto cuesta.

     La caricia se mide en DISTANCIA REAL que recorre el dedo, no en
     cantidad de eventos. Una "caricia" = recorrer una vez el ancho
     del escenario. Así cuesta lo mismo en cualquier celular y da
     igual si el dedo va rápido o lento.
     ============================================================== */
  var AJUSTES = {
    cariciasNecesarias: 9,     // subilo si querés que cueste más
    valorDeUnToque:     0.30,  // cuánto suma tocar sin arrastrar
    topePorMovimiento:  0.25,  // freno: un manotazo no cuenta de más
    seDespiertaEn:      12,    // % de la barra en el que abre los ojos
    corazonesEnTotal:   14
  };

  function $(id){ return document.getElementById(id); }

  var app    = $('app'),
      scene  = $('scene'),
      stage  = $('stage'),
      hint   = $('hint'),
      hints  = $('hints'),
      hearts = $('hearts'),
      meter  = $('meter'),
      fill   = $('meterFill'),
      samy   = $('samy'),
      trae   = $('trae'),
      ojosA  = $('ojosAbiertos'),
      ojosC  = $('ojosCerrados'),
      zzz    = $('zzz');

  var estado = 'durmiendo';   // durmiendo -> despierta -> buscando -> libro -> carta
  var caricia = 0;
  var ultimo = null;
  var apretado = false;
  var desdeCorazon = 0;

  function porcentaje(){
    return Math.min(100, caricia / AJUSTES.cariciasNecesarias * 100);
  }

  /* ===================== textos =====================
     Viven en el HTML, dentro de #hints. Acá solo se eligen. */
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

  /* ===================== estrellitas ===================== */
  (function estrellas(){
    var caja = $('dots');
    for (var i = 0; i < 26; i++){
      var d = document.createElement('div');
      d.className = 'dot';
      var s = 1.5 + Math.random() * 2.6;
      d.style.width = d.style.height = s.toFixed(1) + 'px';
      d.style.left = (Math.random() * 100).toFixed(1) + '%';
      d.style.top  = (Math.random() * 72).toFixed(1) + '%';
      d.style.animationDuration = (2.2 + Math.random() * 3.4).toFixed(1) + 's';
      d.style.animationDelay = (-Math.random() * 5).toFixed(1) + 's';
      caja.appendChild(d);
    }
  })();

  /* ===================== corazoncitos ===================== */
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

  /* ===================== la caricia ===================== */
  function acariciar(cantidad, x, y){
    if (estado !== 'durmiendo' && estado !== 'despierta') return;

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

    if (caricia >= AJUSTES.cariciasNecesarias) irABuscarElLibro();
  }

  function despertar(){
    estado = 'despierta';
    scene.classList.add('awake');
    ojosC.setAttribute('opacity', '0');
    ojosA.setAttribute('opacity', '1');
    zzz.style.opacity = '0';
  }

  /* ===================== dedo / mouse ===================== */
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

  scene.setAttribute('tabindex', '0');
  scene.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      var r = stage.getBoundingClientRect();
      acariciar(AJUSTES.cariciasNecesarias / 24, r.width / 2, r.height / 2);
    }
  });

  /* ===================== va a buscar el librito ===================== */
  function irABuscarElLibro(){
    estado = 'buscando';
    scene.classList.add('fetching');
    meter.classList.remove('on');
    decir('fetch');

    samy.style.transform = 'translate(118px, 6px)';
    setTimeout(function(){ samy.style.opacity = '.2'; }, 340);

    setTimeout(function(){
      trae.setAttribute('opacity', '1');
      samy.style.opacity = '1';
      samy.style.transform = 'translate(0px, 0px)';
      decir('brought');
    }, 1150);

    setTimeout(mostrarLibro, 2150);
  }

  /* ===================== las tarjetas ===================== */
  function abrirCapa(idPlantilla){
    var capa = document.createElement('div');
    capa.className = 'overlay';
    capa.appendChild($(idPlantilla).content.cloneNode(true));
    app.appendChild(capa);
    return capa;
  }

  function mostrarLibro(){
    estado = 'libro';
    var capa = abrirCapa('tpl-libro');
    var boton = capa.querySelector('.libro');
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

  /* ===================== lo que ella te escriba =====================
     Una página publicada en claude.ai no puede mandar nada a otro
     servidor por su cuenta: lo bloquea la seguridad del visor. Lo que
     sí puede es abrir un link. Así que el botón intenta mandarlo
     calladito y, si lo bloquean, abre el destino con el texto ya
     cargado.                                                        */
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

    /* de la URL de relleno previo sale la de envío directo */
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
      return fetch(envioURL, { method: 'POST', mode: 'no-cors', body: datos })
        .then(function(){ return true; })
        .catch(function(){ return false; });
    }

    var dejarPasar = false;

    enviar.addEventListener('click', function(e){
      if (dejarPasar){ dejarPasar = false; return; }

      if (!texto.value.trim()){
        e.preventDefault();
        texto.focus();
        return;
      }

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
        dejarPasar = true;
        enviar.click();
      });
    });

    actualizar();
  }

  /* ===================== el botón que se escapa ===================== */
  function hacerEscapar(boton, cancha){
    if (!boton || !cancha) return;

    var textos = [];
    var lista = $('escapes');
    if (lista){
      var spans = lista.querySelectorAll('span');
      for (var i = 0; i < spans.length; i++) textos.push(spans[i].textContent.trim());
    }

    var dx = 0, dy = 0, veces = 0, ultimoSalto = 0;

    function escapar(e){
      if (e && e.cancelable) e.preventDefault();

      var ahora = Date.now();
      if (ahora - ultimoSalto < 160) return;
      ultimoSalto = ahora;

      if (textos.length){
        boton.textContent = textos[Math.min(veces, textos.length - 1)];
      }
      veces++;

      /* El botón está centrado en la cancha, así que alcanza con medir
         cuánto espacio sobra. offsetWidth y clientWidth NO incluyen el
         transform; midiendo posiciones en pantalla el cálculo se
         contamina con el desplazamiento anterior. */
      var rangoX = Math.max(0, (cancha.clientWidth  - boton.offsetWidth)  / 2 - 2),
          rangoY = Math.max(0, (cancha.clientHeight - boton.offsetHeight) / 2 - 2);

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

    boton.addEventListener('pointerenter', escapar);
    boton.addEventListener('pointerdown', escapar);
    boton.addEventListener('focus', escapar);
    boton.addEventListener('click', escapar);
  }

  /* ===================== el carrusel ===================== */
  function armarCarrusel(capa){
    var viewport = capa.querySelector('.viewport'),
        track    = capa.querySelector('.track'),
        slides   = capa.querySelectorAll('.slide'),
        prev     = capa.querySelector('.prev'),
        next     = capa.querySelector('.next'),
        pager    = capa.querySelector('.pager');

    var actual = 0;
    var yaNavego = false;

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
      arrastrando = true; x0 = e.clientX; y0 = e.clientY;
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

    capa.addEventListener('keydown', function(e){
      if (e.key === 'ArrowRight'){ e.preventDefault(); ir(actual + 1); }
      if (e.key === 'ArrowLeft'){  e.preventDefault(); ir(actual - 1); }
    });

    window.addEventListener('resize', acomodar);

    acomodar();
    next.focus({ preventScroll: true });

    return function limpiar(){ window.removeEventListener('resize', acomodar); };
  }

  /* ===================== la respuesta ===================== */
  function mostrarFinal(respuesta){
    var capa = abrirCapa('tpl-final');

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

  /* ===================== arranque =====================
     Las fotos de la carta se bajan ahora, mientras ella acaricia
     a Samy, así ya están listas cuando se abre el librito.      */
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
