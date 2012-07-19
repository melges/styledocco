// Entry file for Browserify

(function () {

'use strict';

// Don't run this script if we're rendering a preview page.
if (location.href === '#preview') return;

var $ = require('jquery-browserify');

// Get preview styles intended for preview iframes.
var styles = $('style[type="text/preview"]').toArray().reduce(
  function(styles, el) { return styles + el.innerHTML; },
'');

var $body = $('body').first();

// Loop through code previews and replace with iframes.
$('.preview').each(function() {
  var $oldPreview = $(this);
  var $iframe = $(document.createElement('iframe'))
                  .attr('seamless', 'seamless')
                  .data('code', $oldPreview.html());
  // Iframes cannot be resized with CSS, we need a wrapper element.
  var $preview = $(document.createElement('div')).addClass('preview')
  var $resize = $(document.createElement('div')).addClass('resize loading')
  $resize.append($iframe);
  $preview.append($resize);
  $oldPreview.replaceWith($preview);

  $iframe.on('load', function(event) {
    // Use iframe's document object.
    var doc = this.contentDocument;
    var oldHeadEl = doc.getElementsByTagName('head')[0];
    var $body = $('body', doc).first();

    // Replace iframe content with the preview HTML.
    $body.html($iframe.data('code'));

    // Add preview specific scripts and styles. We can't use jQuery methods
    // here due to the way it handles script insertion.
    var scriptEl = doc.createElement('script');
    var src = location.href.split('/');
    src.pop(); src.push('previews.js');
    scriptEl.src = src.join('/');
    var styleEl = doc.createElement('style');
    styleEl.innerHTML = styles;
    var headEl = doc.createElement('head');
    headEl.appendChild(styleEl);
    headEl.appendChild(scriptEl);
    oldHeadEl.parentNode.replaceChild(headEl, oldHeadEl);
    $preview.removeClass('loading');

    // Set the height of the iframe element to match the content.
    $iframe.height($body[0].scrollHeight);
  });
  if ($.browser.webkit) {
    // WebKit doesn't treat data uris as same origin [https://bugs.webkit.org/show_bug.cgi?id=17352]
    // Even with try/catch, errors will be thrown, so there's no good way to feature detect.
    $iframe.attr('src', location.href + '#preview');
  } else {
    // Set source to an empty HTML document.
    $iframe.attr('src', 'data:text/html,%3C!doctype%20html%3E%3Chtml%3E%3Chead%3E%3Ctitle%3E%3C%2Ftitle%3E%3C%2Fhead%3E%3Cbody%3E');
  }
});

// Allow `resize` to shrink in WebKit by setting width/height to 0 when
// starting to resize.
$('.resize').on('mousemove', function(event) {
  var $el = $(this);
  if (!$el.data('wasResized')) {
    if (($el.data('oldWidth') || $el.data('oldHeight')) &&
        ($el.data('oldWidth') !== $el.width() ||
         $el.data('oldHeight') !== $el.height())) {
      $el.width(0).height(0)
        .data({ wasResized: true })
        .find('iframe').first().height('100%');
    }
    $el.data({ oldWidth: $el.width(), oldHeight: $el.height() });
  }
});

// Dropdown menus
$body.on('click', function(event) {
  var $el = $(event.target);
  var activateDropdown = false;
  if ($el.hasClass('dropdown-toggle')) {
    event.preventDefault();
    // Click fired on an inactive dropdown toggle
    if (!$el.hasClass('is-active')) activateDropdown = true;
  }
  // Deactivate *all* dropdowns
  $('.dropdown-toggle').each(function() {
    $(this).removeClass('is-active')
      .next('.dropdown').removeClass('is-active');
  });
  // Activate the clicked dropdown
  if (activateDropdown) {
    $el.addClass('is-active');
    $el.next('.dropdown').addClass('is-active');
  }
});

}());