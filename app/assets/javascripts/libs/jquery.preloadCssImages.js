/**
 * jQuery-Plugin "preloadCssImages"
 * by Scott Jehl, scott@filamentgroup.com
 * http://www.filamentgroup.com
 * reference article: http://www.filamentgroup.com/lab/update_automatically_preload_images_from_css_with_jquery/
 * demo page: http://www.filamentgroup.com/examples/preloadImages/index_v2.php
 *
 * Copyright (c) 2008 Filament Group, Inc
 * Dual licensed under the MIT (filamentgroup.com/examples/mit-license.txt) and GPL (filamentgroup.com/examples/gpl-license.txt) licenses.
 *
 * Version: 5.0, 10.31.2008
 * Changelog:
 * 	02.20.2008 initial Version 1.0
 *    06.04.2008 Version 2.0 : removed need for any passed arguments. Images load from any and all directories.
 *    06.21.2008 Version 3.0 : Added options for loading status. Fixed IE abs image path bug (thanks Sam Pohlenz).
 *    07.24.2008 Version 4.0 : Added support for @imported CSS (credit: http://marcarea.com/). Fixed support in Opera as well.
 *    10.31.2008 Version: 5.0 : Many feature and performance enhancements from trixta
 * --------------------------------------------------------------------
 */

;jQuery.preloadCssImages = function(settings){
	settings = jQuery.extend({
		statusTextEl: null,
		statusBarEl: null,
		errorDelay: 999, // handles 404-Errors in IE
		simultaneousCacheLoading: 2,
        imgUrls: null
	}, settings);
	var allImgs = [],
		loaded = 0,
		imgUrls = [],
		thisSheetRules,
		errorTimer;

	function onImgComplete(){
		clearTimeout(errorTimer);
		if (imgUrls && imgUrls.length && imgUrls[loaded]) {
			loaded++;
			if (settings.statusTextEl) {
				var nowloading = (imgUrls[loaded]) ?
					'Now Loading: <span>' + imgUrls[loaded].split('/')[imgUrls[loaded].split('/').length - 1] :
					'Loading complete'; // wrong status-text bug fixed
				jQuery(settings.statusTextEl).html('<span class="numLoaded">' + loaded + '</span> of <span class="numTotal">' + imgUrls.length + '</span> loaded (<span class="percentLoaded">' + (loaded / imgUrls.length * 100).toFixed(0) + '%</span>) <span class="currentImg">' + nowloading + '</span></span>');
			}
			if (settings.statusBarEl) {
				var barWidth = jQuery(settings.statusBarEl).width();
				jQuery(settings.statusBarEl).css('background-position', -(barWidth - (barWidth * loaded / imgUrls.length).toFixed(0)) + 'px 50%');
			}
			loadImgs();
		}
	}

	function loadImgs(){
		//only load 1 image at the same time / most browsers can only handle 2 http requests, 1 should remain for user-interaction (Ajax, other images, normal page requests...)
		// otherwise set simultaneousCacheLoading to a higher number for simultaneous downloads
		if(imgUrls && imgUrls.length && imgUrls[loaded]){
			var img = new Image(); //new img obj
			img.src = imgUrls[loaded];	//set src either absolute or rel to css dir
			if(!img.complete){
				jQuery(img).bind('error load onreadystatechange', onImgComplete);
			} else {
				onImgComplete();
			}
			errorTimer = setTimeout(onImgComplete, settings.errorDelay); // handles 404-Errors in IE
		}
	}

	function parseCSS() {
		var downloads = settings.simultaneousCacheLoading;
		while( downloads--){
			setTimeout(loadImgs, downloads);
		}
	}
    imgUrls = settings.imgUrls;
	parseCSS();
	return imgUrls;
};