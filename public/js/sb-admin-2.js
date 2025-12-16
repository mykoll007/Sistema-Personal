(function($) {
  "use strict"; // Start of use strict

  // =============================
  // SIDEBAR TOGGLE
  // =============================
  $("#sidebarToggle, #sidebarToggleTop").on('click', function(e) {
    e.preventDefault();

    $("body").toggleClass("sidebar-toggled");
    $(".sidebar").toggleClass("toggled");

    // Fecha todas as colapsadas se a sidebar estiver minimizada
    if ($(".sidebar").hasClass("toggled")) {
      $('.sidebar .collapse').collapse('hide');
    }
  });

  // =============================
  // RESPONSIVO
  // =============================
  $(window).resize(function() {
    const w = $(window).width();

    // Se tela menor que 768px, fecha menus colapsados
    if (w < 768) {
      $('.sidebar .collapse').collapse('hide');
    }

    // Se tela menor que 480px e sidebar não estiver minimizada, minimiza
    if (w < 480 && !$(".sidebar").hasClass("toggled")) {
      $("body").addClass("sidebar-toggled");
      $(".sidebar").addClass("toggled");
      $('.sidebar .collapse').collapse('hide');
    }
  });

  // =============================
  // FIX: SCROLL DA SIDEBAR
  // =============================
  $('body.fixed-nav .sidebar').on('mousewheel DOMMouseScroll wheel', function(e) {
    if ($(window).width() > 768) {
      var e0 = e.originalEvent,
          delta = e0.wheelDelta || -e0.detail;
      this.scrollTop += (delta < 0 ? 1 : -1) * 30;
      e.preventDefault();
    }
  });

  // =============================
  // BOTÃO SCROLL TO TOP
  // =============================
  $(document).on('scroll', function() {
    var scrollDistance = $(this).scrollTop();
    if (scrollDistance > 100) {
      $('.scroll-to-top').fadeIn();
    } else {
      $('.scroll-to-top').fadeOut();
    }
  });

  // Smooth scrolling usando jQuery easing
  $(document).on('click', 'a.scroll-to-top', function(e) {
    e.preventDefault();
    var $anchor = $(this);
    $('html, body').stop().animate({
      scrollTop: ($($anchor.attr('href')).offset().top)
    }, 1000, 'easeInOutExpo');
  });

  // =============================
  // FIX DROPDOWN USUÁRIO
  // =============================
  $(document).on("click", "#userDropdown", function(e) {
    e.preventDefault();
    e.stopPropagation();          // impede interferência do SB Admin
    $(this).dropdown("toggle");   // força toggle do Bootstrap
  });

  // Permite clicar dentro do menu sem fechar
  $(document).on("click", ".dropdown-menu", function(e) {
    e.stopPropagation();
  });

  // =============================
  // MELHORIA: Toggle de submenus fácil
  // =============================
  $(document).on("click", ".sidebar .nav-item .nav-link", function() {
    const $parent = $(this).closest(".nav-item");
    if ($parent.hasClass("active")) {
      $parent.removeClass("active");
      $parent.find(".collapse").collapse('hide');
    } else {
      $(".sidebar .nav-item.active").removeClass("active").find(".collapse").collapse('hide');
      $parent.addClass("active");
      $parent.find(".collapse").collapse('show');
    }
  });

})(jQuery); // End of use strict
