!function () {
  "use strict";

  var controller, windowHeight, windowWidth

    , tabletWidth = function () {
      return windowWidth < 800
    }

    , mobileWidth = function () {
      return windowWidth < 710
    }

    , parseDecimal = function (x) {
      return parseInt(x, 10)
    }

    // Staggers objects +/- random amount within specified range.
    // Causes problems (floating characters) if height is 700 or under.
    , randomOffset = function (px) {
      return windowHeight > 700 ? parseDecimal(Math.random() * px) - px : 0
    }

    , changeState = function (state) {
      this.state = state
      $(this.target).toggleClass("standing", state === "standing")
                    .toggleClass("falling", state === "falling")
                    .toggleClass("jumping", state === "jumping")
    }

    // Create tween from one section to the next.
    // Force character to stand after tween is complete.
    , addCharacterTween = function (character, id, bottomPercent, invalidate, offset) {
      var tweenOpts = {
        css: {"bottom": $(character).data('bottom') + bottomPercent + "%"},
        immediateRender: true,
        ease: Back.easeIn,
        onComplete: changeState,
        onCompleteParams: ["standing"],
        onReverseComplete: changeState,
        onReverseCompleteParams: ["standing"]
      }
      // Both position in animation and scrolling direction affect state of character.
      if (invalidate) {
        $.extend(tweenOpts, {
          onUpdate: function () {
            if (((this.ratio === 0 || this.ratio === 1) &&
                 this.state !== "standing") ||
                currScroll <= 0) {
              changeState.call(this, "standing")
            } else if (this.ratio > 0 && currScroll > prevScroll && this.state !== "falling") {
              changeState.call(this, "falling")
            } else if (this.ratio > 0 && prevScroll > currScroll && this.state !== "jumping") {
              changeState.call(this, "jumping")
            } else if (this.ratio < 0 && currScroll > prevScroll && this.state !== "jumping") {
              changeState.call(this, "jumping")
            } else if (this.ratio < 0 && prevScroll > currScroll && this.state !== "falling") {
              changeState.call(this, "falling")
            }
          }
        })
      }
      // Cause character to jump 300 pixels after moving from one section to the next.
      if (offset === undefined) offset = -300

      controller.addTween(id, new TweenMax(character, 1, tweenOpts), 500, offset + randomOffset(windowHeight / 20), true, invalidate)
    }

    // Number guest fieldsets. Skip hidden (to-be-deleted) ones.
    , countGuests = function () {
      var $this = $(this),
        $visibleFieldsets = $this.find('fieldset:visible')
      $visibleFieldsets.each(function (i, e) {
        $(e).find('legend').text("Guest #" + (i + 1))
      })
      $this.find('.remove_nested_fields').toggle($visibleFieldsets.length > 1)
      return $this
    }

    , readjust = function (selector, $target) {
      // Might be passing in a non-existent object
      if ($target.length) {
        // Readjust objects after scroll. Either displayed, hidden above,
        // or hidden below based on current section.
        $('.object_container .object').each(function (i, e) {
          var $e = $(e)
          if ($e.closest(selector).length) {
            $e.css('bottom', $e.data('bottom') + "%")
          } else if ($e.closest('.main_section').prevAll(selector).length) {
            $e.css('bottom', '100%')
          } else {
            $e.css('bottom', '-100%')
          }
        })
        // Readjust characters after scroll.
        $('.character_container .object').each(function (i, e) {
          var $e = $(e)
          $e.css('bottom', ($e.data('bottom') - (100 * $target.index()) + 100) + "%")
        })
      }
    }

    , scrollToSection = function (selector, $target) {
      var top = $target.offset().top
      $('html,body').animate({scrollTop: top}, {
        duration: 2000,
        queue: false,
        complete: function () {
          readjust(selector, $target)
        }
      })
      return false
    }

    , tabClicked = function (e) {
      $(e.data.section).children('.carousel').carousel(e.data.index)
      e.data.$sectionLinks.removeClass('active')
      e.data.$el.addClass('active')
      return false
    }

  $(function () {
    // Check for media query support
    var $rsvp, $carousel, mq = Modernizr.mq('only all'), imgUrls = []
      , assetLocation = document.location.protocol + "//assets." + document.location.host + "/objects/"
    controller = $.superscrollorama()
    windowHeight = $(window).height()
    windowWidth = $(window).width()

    // When resized, resize all sections and establish new thresholds for
    // navigation item activation
    $(window).resize(function () {
        windowHeight = $(window).height()
        windowWidth = $(window).width()
        resizeSections(windowHeight)
        $(this).scrollspy('refresh')
    })

    if (mq) {
      // Don't preload images if they won't be displayed (viewport too narrow)
      if (!mobileWidth()) {
        $.each(['jeffrey', 'anna', 'backup'], function (i, a) {
          $.each(['standing', 'jumping', 'falling'], function (j, b) {
            $.each(['home', 'exercise', 'travel', 'wedding', 'cooking'], function (k, c) {
              if (!(a === "backup" && b !== "standing")) {
                imgUrls.push(assetLocation + a + "/" + b + "-" + c + ".png")
              }
            })
            if (a === "backup" && b !== "standing") {
              imgUrls.push(assetLocation + a + "/" + b + ".png")
            }
          })
        })
        $.preloadCssImages({imgUrls: imgUrls})
      }

      // Store bottom offset for later readjusting
      $('.object').each(function (i, el) {
        var $el = $(el), bottom = $el.css('bottom')
        $el.data('bottom', parseDecimal(bottom.match('%') === null ? Math.round((parseDecimal(bottom) / parseDecimal(windowHeight)) * 100) : bottom))
      })

      // Tweens for characters
      $('.character_container .object').each(function (i, e) {
        addCharacterTween(e, '#welcome', 0, false, 0)
        addCharacterTween(e, '#about_us', -100, true)
        addCharacterTween(e, '#updates', -200, true)
        addCharacterTween(e, '#events', -300, true)
        addCharacterTween(e, '#rsvp', -400, true)
      })

      // Tweens for inanimate objects.
      // Two tweens are needed - one to go from hidden above to displayed, and
      // one to go from displayed to hidden below.
      $('.main_section').each(function (i, section) {
        $('.object', section).each(function (j, e) {
          var $section = $(section)
          // Last section doesn't need to be hidden below
          if (!$section.is('#rsvp')) {
            controller.addTween($section.next(), new TweenMax(e, 1, {
              css: {"bottom": "-100%"},
              immediateRender: true
            }), 400, randomOffset(100))
          }
          // First section doesn't need to be hidden above
          if (!$section.is('#welcome')) {
            controller.addTween($section, TweenMax.from(e, 1, {
              css: {"bottom": "100%"},
              immediateRender: true
            }), 400, randomOffset(100))
          }
        })
      })
    }
    
    $('[href^="#"]').each(function (i, link) {
      $(link).click(function () {
        // Go directly to section if mobile width.
        if (!mobileWidth()) {
          var selector = $(this).attr('href'), $target = $(selector), $mainSection, $sectionLinks, $el
          if ($target.hasClass('main_section')) {
            scrollToSection(selector, $target)
          } else if ($target.hasClass('item')) {
            $mainSection = $target.closest('.main_section')
            $sectionLinks = $mainSection.find('nav a')
            $el = $sectionLinks.filter('[href=' + selector + ']')
            scrollToSection('#' + $mainSection.attr('id'), $mainSection)
            tabClicked({
              data: {
                section: $mainSection,
                $sectionLinks: $sectionLinks,
                $el: $el,
                index: $sectionLinks.index($el)
              }
            })
          }
          return false
        }
      })

      if (mq) {
        // Change character clothes when section changes.
        $(link).bind('activate', function () {
          var id = $(link).attr('id')
          // Display container opacity slider if supported and not on section
          // with no container.
          $("#container_opacity").toggle(Modernizr.inputtypes.range && id !== "welcome_link" && !mobileWidth())
          $('.character_container .object').each(function (i, character) {
            $(character).addClass('poof')
            $(character).toggleClass('home', id === "welcome_link")
                        .toggleClass('exercise', id === "about_us_link")
                        .toggleClass('travel', id === "updates_link")
                        .toggleClass('wedding', id === "events_link")
                        .toggleClass('cooking', id === "rsvp_link")
            setTimeout(function () {
              $(character).removeClass('poof')
            }, 100)
          })
        })
      }
    })

    // Change active section about halfway through scroll.
    $(window).scrollspy({target: '.page_header a', offset: windowHeight / 2})

    $carousel = $('.carousel')
    $carousel.each(function (i, el) {
        $(el).carousel({interval: false})
    })

    // Prevent scrolling when at beginning or end of content container.
    $carousel.on('mousewheel', '.item > .container', function (e, d) {
      var $this = $(this), scrollTop = $this.scrollTop()
      if (!tabletWidth() && ((d > 0 && scrollTop === 0) || (d < 0 && scrollTop >= $this.get(0).scrollHeight - $this.innerHeight() - 1)))
        e.preventDefault()
    })

    $('.regular_section').each(function (i, section) {
      var $sectionLinks = $('nav a', section)
      $sectionLinks.each(function (j, el) {
        var $el = $(el)
        $el.click({section: section, $sectionLinks: $sectionLinks, $el: $el, index: j}, tabClicked)
      })
    })

    $rsvp = $('#rsvp')
    // Replace RSVP form with AJAX response.
    $rsvp.on('submit', 'form', function () {
      var $this = $(this),
        guestFail = false
      // Only look for visible guest names - deleted names still exist in the
      // DOM
      $this.find('.guest_name:visible').each(function () {
        var val = $(this).val()
        if (val === "Guest") {
          // don't submit form if person says cancel - set guestFail to true
          // which will return false down below
          guestFail = !confirm('It looks like you have left some guests\' names as "Guest". Do you want to continue to RSVP and provide their names some time later?')
          return false
        } else if (val === "") {
          alert('Please fill in all guest names, or remove guests who are not coming!')
          guestFail = true
          return false
        }
        return true
      })
      if (guestFail) {
        return false
      }
      $.ajax($this.attr('action'), {
        type: $this.attr('method'),
        data: $this.serialize(),
        dataType: 'html',
        success: function (data) {
          var $container = $this.closest('.container')
          $container.empty().html(data)
          countGuests.call($container)
          $('.flash', $container).fadeOut(5000)
        }
      })
      return false
    })

    // Only make range slider work if supported.
    if (Modernizr.inputtypes.range) {
      $('#container_opacity').change(function () {
        var val = $(this).val()
        if (val < 20) {
          // Hide completely if under 20% opacity - allows users to scroll
          // window with mouse over containers.
          $('.content_section, .carousel').hide()
        } else {
          $('.content_section, .carousel').show().css('opacity', (val / 100))
        }
      })
    }

    // Show objects for requested section
    if (window.location.hash) {
      $('[href=' + window.location.hash + ']').click()
    }

    // Count guests if a form loads with the page, and when guests are added
    // or removed.
    countGuests.call($rsvp)
    $rsvp.on('nested:fieldAdded nested:fieldRemoved', 'form', countGuests)
  })
}()