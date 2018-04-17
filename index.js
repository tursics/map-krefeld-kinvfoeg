/* map-krefeld-kinvfoeg - JavaScript file */

/*jslint browser: true*/
/*global $,L,window,document*/

var map = null;

//-----------------------------------------------------------------------

//mapboxgl.accessToken = 'pk.eyJ1IjoidHVyc2ljcyIsImEiOiJjajBoN3hzZGwwMDJsMnF0YW96Y2l3OGk2In0._5BdojVYvNuR6x4fQNYZrA';
var baseURI = 'https://tursics.github.io/map-krefeld-kinvfoeg',
	appName = 'Krefeld: hier passiert uns!',
	fontawesomePath = './assets/fontawesome/';

//-----------------------------------------------------------------------

function formatNumber(txt) {
	'use strict';

	txt = String(parseInt(txt, 10));
	var sign = '',
		pos = 0;
	if (txt[0] === '-') {
		sign = '-';
		txt = txt.slice(1);
	}

	pos = txt.length;
	while (pos > 3) {
		pos -= 3;
		txt = txt.slice(0, pos) + '.' + txt.slice(pos);
	}

	return sign + txt;
}

// -----------------------------------------------------------------------------

var printerLabel = {
	layerPopup: null,

	show: function (coordinates, data, format, icon) {
		'use strict';

		var options = {
			closeButton: false,
			offset: L.point(0, -32),
			className: 'printerLabel'
		},
			str = '';

		str += '<div class="top ' + icon.options.markerColor + '">' + data[format.top] + '</div>';
		str += '<div class="middle">€' + formatNumber(data[format.middle]) + '</div>';
		str += '<div class="bottom ' + icon.options.markerColor + '">' + data[format.bottom] + '</div>';

		this.layerPopup = L.popup(options)
			.setLatLng(coordinates)
			.setContent(str)
			.openOn(map);
	},

//	hide: function (data) {
	hide: function () {
		'use strict';

		if (this.layerPopup && map) {
			map.closePopup(this.layerPopup);
			this.layerPopup = null;
		}
	}
};

// -----------------------------------------------------------------------------

var receipt = {
	initUI: function () {
		'use strict';

		$('#receipt .group').on('click', function () {
			$(this).toggleClass('groupClosed');
		});
		$('#receiptClose').on('click', this.hide);
	},

	init: function (data) {
		'use strict';

		$('#receiptBox #receipt').html(data.receipt.body.join("\n"));
		$('#receiptInfo').css('display', data.receipt.info ? 'block' : 'none');
	},

	show: function () {
		'use strict';

		$('#receiptBox').css('display', 'block');
	},

	hide: function () {
		'use strict';

		$('#receiptBox').css('display', 'none');
	},

	update: function (data) {
		'use strict';

		function setText(key, txt) {
			var item = $('#rec' + key);

			if (item.parent().hasClass('number')) {
				txt = formatNumber(txt);
			} else if (item.parent().hasClass('boolean')) {
				txt = (txt === 1 ? 'ja' : 'nein');
			}

			item.text(txt);
		}

		var key,
			date = new Date(),
			dateD = date.getDate(),
			dateM = date.getMonth() + 1,
			dateY = date.getFullYear(),
			dateH = date.getHours(),
			dateMin = date.getMinutes();

		if (dateD < 10) {
			dateD = '0' + dateD;
		}
		if (dateM < 10) {
			dateM = '0' + dateM;
		}
		if (dateH < 10) {
			dateH = '0' + dateH;
		}
		if (dateMin < 10) {
			dateMin = '0' + dateMin;
		}
		setText('Now', dateD + '.' + dateM + '.' + dateY + ' ' + dateH + ':' + dateMin);

		for (key in data) {
			if (data.hasOwnProperty(key)) {
				setText(key, data[key]);
			}
		}

		this.show();
	}
};

// -----------------------------------------------------------------------------

var marker = {
	layerGroup: null,
	cityData: null,

	show: function (data, cityData) {
		'use strict';

		try {
			this.cityData = cityData;

			this.layerGroup = L.featureGroup([]);
			this.layerGroup.addTo(map);

			this.layerGroup.addEventListener('click', function (evt) {
				receipt.update(evt.layer.options.data);
			});
			this.layerGroup.addEventListener('mouseover', function (evt) {
				printerLabel.show([evt.latlng.lat, evt.latlng.lng], evt.layer.options.data, evt.layer.options.format, evt.layer.options.icon);
			});
			this.layerGroup.addEventListener('mouseout', function (evt) {
				printerLabel.hide(evt.layer.options.data);
			});

			var that = this;
			$.each(data, function (key, val) {
				if ((typeof val.lat !== 'undefined') && (typeof val.lng !== 'undefined') && val.lat && val.lng) {
					var marker = L.marker([parseFloat(val.lat), parseFloat(val.lng)], {
							data: val,
							format: cityData.printerlabel,
							icon: L.AwesomeMarkers.icon({
								icon: val[cityData.marker.icon],
								prefix: 'fa',
								markerColor: val[cityData.marker.color]
							})
						});
					that.layerGroup.addLayer(marker);
				}
			});
		} catch (e) {
//			console.log(e);
		}
	},

	hide: function () {
		'use strict';

		try {
			if (this.layerGroup) {
				map.removeLayer(this.layerGroup);
				this.layerGroup = null;
			}
		} catch (e) {
//			console.log(e);
		}
	},

	select: function (selection) {
		'use strict';

		var that = this;

		$.each(this.layerGroup._layers, function (key, val) {
			if (val.options.data[that.cityData.search.data] === selection) {
				map.panTo(new L.LatLng(val.options.data.lat, val.options.data.lng));
				receipt.update(val.options.data);
			}
		});
	}
};

//-----------------------------------------------------------------------------

var search = {
	schools: [],

	initUI: function () {
		'use strict';

//		var that = this;

		$('#autocomplete').focus(function () {
			window.scrollTo(0, 0);
			document.body.scrollTop = 0;
			$('#pageMap').animate({
				scrollTop: parseInt(0, 10)
			}, 500);
		});
	},

	init: function (data, cityData) {
		'use strict';

		var that = this;
		this.schools = [];

		try {
			$.each(data, function (key, val) {
				that.schools.push({
					value: val[cityData.search.pattern],
					data: val[cityData.search.data],
					color: val[cityData.search.color],
					icon: val[cityData.search.icon],
					desc: val[cityData.search.description]
				});
			});
		} catch (e) {
//			console.log(e);
		}

		this.schools.sort(function (a, b) {
			if (a.value === b.value) {
				return a.data > b.data ? 1 : -1;
			}

			return a.value > b.value ? 1 : -1;
		});

		$('#autocomplete').val('');
		$('#autocomplete').autocomplete({
			lookup: that.schools,
			onSelect: that.callbackOnSelect,
			formatResult: that.callbackFormatResult,
			showNoSuggestionNotice: true,
			noSuggestionNotice: '<i class="fa fa-info-circle" aria-hidden="true"></i> Gebe einen Begriff ein'
		});

		this.show();
	},

	callbackOnSelect: function (suggestion) {
		'use strict';

		marker.select(suggestion.data);
	},

	callbackFormatResult: function (suggestion, currentValue) {
		'use strict';

		var str = '';
		str += '<div class="autocomplete-icon back' + suggestion.color + '"><i class="fa ' + suggestion.icon + '" aria-hidden="true"></i></div>';
		str += '<div>' + suggestion.value.replace(new RegExp(currentValue.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'gi'), '<strong>' + currentValue + '</strong>') + '</div>';
		str += '<div class="' + suggestion.color + '">' + suggestion.desc + '</div>';
		return str;
	},

	show: function () {
		'use strict';

		$('.searchInput').css('opacity', 1);
	},

	hide: function () {
		'use strict';

		$('.searchInput').css('opacity', 0);
	}
};

//-----------------------------------------------------------------------------

var data = {
	dataMenu: null,

	initUI: function () {
		'use strict';

		var that = this;
		$('#searchBox .module select').on('change', function () {
			that.loadCity($('#searchBox .module select').val());
		});
	},

	loadMenu: function () {
		'use strict';

		var that = this;

		$.ajax({
			url: 'data/menu.json',
			dataType: 'json',
			mimeType: 'application/json',
			success: function (data) {
				that.initMenu(data);
			}
		});
	},

	initMenu: function (data) {
		'use strict';

		this.dataMenu = data;

		try {
			var str = '';

			str += '<option selected disabled value="-">Wähle eine Datenquelle aus</option>';

			$.each(this.dataMenu, function (key, val) {
				str += '<option value="' + val.key + '">' + val.title + '</option>';
			});

			$('#searchBox .module select').html(str).val('-').change();
			$('#searchBox .module').css('opacity', 1);
		} catch (e) {
//			console.log(e);
		}
	},

	getCityInfo: function (root, id) {
		'use strict';

		var ret = null,
			that = this;

		$.each(root, function (key, val) {
			if (val.id === id) {
				ret = val;
				return false;
			} else if (('undefined' === typeof val.id) && ('object' === typeof val.menu)) {
				var city = that.getCityInfo(val.menu, id);
				if (city !== null) {
					ret = city;
				}
			}
		});

		return ret;
	},

	loadCity: function (cityKey) {
		'use strict';

		try {
			var city = null,
				that = this;

			city = this.getCityInfo(this.dataMenu, cityKey);

			if (city) {
				receipt.hide();
				marker.hide();
				search.hide();
//				map.setView(new L.LatLng(city.lat, city.lng), city.zoom, {animation: true});

				$.ajax({
					url: 'data/' + city.config + '.json',
					dataType: 'json',
					mimeType: 'application/json',
					success: function (data) {
						that.initCity(city, data);
					}
				});
			}
		} catch (e) {
//			console.log(e);
		}
	},

	initCity: function (city, cityData) {
		'use strict';

		receipt.init(cityData);

		$.ajax({
			url: 'data/' + city.data + '.json',
			dataType: 'json',
			mimeType: 'application/json',
			success: function (data) {
				marker.show(data, cityData);
				search.init(data, cityData);
			}
		});
	}
};

//-----------------------------------------------------------------------

function getJSON(uri, callback) {
	'use strict';

	var request = new XMLHttpRequest();
	request.open('GET', uri, true);
	request.onload = function () {
		if (request.status >= 200 && request.status < 400) {
			var data = JSON.parse(request.responseText);
			callback(data);
		} else {
			callback(null);
		}
	};
	request.onerror = function () {
		callback(null);
	};
	request.send();
}

//-----------------------------------------------------------------------

function getMenuItemSnippet(menuData, level1, level2) {
	'use strict';

	return '<i class="icon" style="background-image:url(' + fontawesomePath + menuData[level1].menu[level2].icon + '.svg);"></i>' + menuData[level1].menu[level2].title;
}

//-----------------------------------------------------------------------

function getMenuItemSnippetLoading(menuData, level1, level2) {
	'use strict';

	return '<i class="icon spinning1" style="background-image:url(' + fontawesomePath + 'circle-o-notch.svg);"></i>' + menuData[level1].menu[level2].title;
}

//-----------------------------------------------------------------------

function getMenuItemSnippetLoaded(menuData, level1, level2) {
	'use strict';

	return '<i class="icon spinning2" style="background-image:url(' + fontawesomePath + 'circle-o-notch.svg);"></i>' + menuData[level1].menu[level2].title;
}

//-----------------------------------------------------------------------

function getMenuLinkSnippet(menuData, level1, level2) {
	'use strict';

	menuData[level1].menu[level2].title = menuData[level1].menu[level2].title || '';
	menuData[level1].menu[level2].id = menuData[level1].menu[level2].id || '';
	menuData[level1].menu[level2].icon = menuData[level1].menu[level2].icon || 'marker';
	menuData[level1].menu[level2].color = menuData[level1].menu[level2].color || '#000000';

	return '<a href="#" class="submenu" ' +
		'data-id="' + menuData[level1].menu[level2].id + '" ' +
		'data-icon="' + menuData[level1].menu[level2].icon + '" ' +
		'data-type="' + menuData[level1].menu[level2].type + '" ' +
		'data-level1="' + level1 + '" ' +
		'data-level2="' + level2 + '" ' +
		'style="background-color:' + menuData[level1].menu[level2].color + '00;">' +
		getMenuItemSnippet(menuData, level1, level2) + '</a>';
}

//-----------------------------------------------------------------------

function setCallbacksToMenu(menuData) {
	'use strict';

	var multiSelection = false;

	function onClickMenuCB(e) {
		var menu = document.getElementsByClassName('dropdown-toggle'),
			i,
			menuShown = false;

		for (i = 0; i < menu.length; ++i) {
			if (menu[i] === e.target) {
				if (menu[i].parentNode.classList.length === 2) {
					menu[i].parentNode.classList = ['dropdown'];
				} else {
					menu[i].parentNode.classList = ['dropdown open'];
					menuShown = true;
				}
			} else {
				menu[i].parentNode.classList = ['dropdown'];
			}
		}

		menu = document.getElementById('pagecover');
		menu.classList = [menuShown ? 'open' : ''];
	}

	function onClickSubMenu(obj) {
		var layer = obj.dataset.id,
			icon = obj.dataset.icon,
			visibility = false,
			backgroundColor = obj.style.backgroundColor.split(',');

		if (('undefined' !== typeof map.getLayer) && map.getLayer(layer)) {
			visibility = map.getLayoutProperty(layer, 'visibility');

			if (visibility !== 'none') {
				map.setLayoutProperty(layer, 'visibility', 'none');
				obj.className = obj.className.substr(0, obj.className.indexOf(' active'));
				backgroundColor[3] = ' 0)';
				obj.style.backgroundColor = backgroundColor.join(',');
			} else {
				obj.className += ' active';
				map.setLayoutProperty(layer, 'visibility', 'visible');
				backgroundColor[3] = ' .99)';
				obj.style.backgroundColor = backgroundColor.join(',');
			}
		} else {
			if (!multiSelection) {
				div = document.getElementsByClassName('submenu');
				for (i = 0; i < div.length; ++i) {
//					div[i].className = div[i].className.substr(0, div[i].className.indexOf(' active'));
					backgroundColor[3] = ' 0)';
					div[i].style.backgroundColor = backgroundColor.join(',');
				}
			}

			obj.innerHTML = getMenuItemSnippetLoading(menuData, obj.dataset.level1, obj.dataset.level2);
			obj.className += ' active';
//			map.setLayoutProperty(layer, 'visibility', 'visible');
			backgroundColor[3] = ' .99)';
			obj.style.backgroundColor = backgroundColor.join(',');

			if ('polygon' === obj.dataset.type) {
				loadGeoJSONPolygon(layer, baseURI + '/map/' + layer + '.json', '{title}', icon, ['!=', 'title', '']);
			} else {
				data.loadCity(layer);
//				loadGeoJSON(layer, baseURI + '/map/' + layer + '.json', '{title}', icon, ['!=', 'title', '']);
			}
		}
	}

	function onClickSubMenuCB(e) {
		var menu = document.getElementsByClassName('dropdown-toggle'),
			i,
			obj;

/*		for (i = 0; i < menu.length; ++i) {
			menu[i].parentNode.classList = ['dropdown'];
		}

		menu = document.getElementById('pagecover');
		menu.classList = [''];*/

		obj = e.target;
		if (obj.className.indexOf('submenu') === -1) {
			obj = e.target.parentNode;
		}

		onClickSubMenu(obj);
	}

	function loadingData(e) {
		if (e.isSourceLoaded && ('sourcedata' === e.type)) {
			var elems = document.querySelectorAll('[data-id="' + e.sourceId + '"]'),
				backgroundColor,
				obj;

			if (elems.length > 0) {
				obj = elems[0];
				if ('undefined' === typeof e.coord) {
					obj.innerHTML = getMenuItemSnippetLoaded(data, obj.dataset.level1, obj.dataset.level2);
				} else {
					obj.innerHTML = getMenuItemSnippet(data, obj.dataset.level1, obj.dataset.level2);
				}
			}
		}
	}

	var div = document.getElementsByClassName('dropdown-toggle'),
		i;

	for (i = 0; i < div.length; ++i) {
//		div[i].onclick = onClickMenuCB;
		div[i].onmousedown = onClickMenuCB;
	}

	div = document.getElementsByClassName('submenu');
	for (i = 0; i < div.length; ++i) {
		div[i].onmousedown = onClickSubMenuCB;
	}

//	div = document.getElementById('headerbar');
//	div.onmousedown = onClickMenuCB;

	div = document.getElementById('pagecover');
	div.onmousedown = onClickMenuCB;

	map.on('sourcedata', loadingData);
}

//-----------------------------------------------------------------------

function buildNavigationAsync(data) {
	'use strict';

	var navbar = document.getElementsByClassName('navbar-collapse'),
		d,
		m,
		str = '';

	data = data || [];
	str += '<ul class="nav navbar-nav">';

	for (d = 0; d < data.length; ++d) {
		str += '<li class="dropdown">';
		str += '<a class="dropdown-toggle" href="#">' + data[d].title + '</a>';
		str += '<ul class="dropdown-menu">';

		data[d].menu = data[d].menu || [];

		for (m = 0; m < data[d].menu.length; ++m) {
			data[d].menu[m].title = data[d].menu[m].title || '';
			data[d].menu[m].id = data[d].menu[m].id || '';
			data[d].menu[m].icon = data[d].menu[m].icon || 'marker';
			data[d].menu[m].color = data[d].menu[m].color || '#000000';

			str += '<li>' + getMenuLinkSnippet(data, d, m) + '</li>';
		}

		str += '</ul>';
		str += '</li>';
	}

	str += '</ul>';

	navbar[0].innerHTML = str;

	setCallbacksToMenu(data);
}

//-----------------------------------------------------------------------

function buildNavigation() {
	'use strict';

	var headerbar = document.getElementById('headerbar'),
		str = '';

	str += '<div class="fluid">';

	str += '<div class="navbar-header">';
	str += '<a class="navbar-brand" href="index.html">' + appName + '</a>';
	str += '</div>';

	str += '<div class="navbar-collapse">';
	str += '</div>';

	str += '</div>';

	headerbar.innerHTML = str;

	getJSON('data/menu.json', function (menuData) {
		buildNavigationAsync(menuData);
	});
}

// -----------------------------------------------------------------------------

var ControlInfo = L.Control.extend({
	options: {
		position: 'bottomright'
	},

//	onAdd: function (map) {
	onAdd: function () {
		'use strict';

		var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

		container.innerHTML = '<a style="font-size:1.2em" href="#popupShare" title="Teilen" data-rel="popup" data-position-to="window" data-transition="pop"><i class="fa fa-share-alt" aria-hidden="true"></i></a>';
//		container.innerHTML += '<a style="font-size:1.2em" href="#popupInfo" title="Info" data-rel="popup" data-position-to="window" data-transition="pop"><i class="fa fa-info" aria-hidden="true"></i></a>';

		return container;
	}
});

// -----------------------------------------------------------------------------

function initMap(elementName, lat, lng, zoom) {
	'use strict';

	if (null === map) {
		var mapboxToken = 'pk.eyJ1IjoidHVyc2ljcyIsImEiOiI1UWlEY3RNIn0.U9sg8F_23xWXLn4QdfZeqg',
			mapboxTiles = L.tileLayer('https://{s}.tiles.mapbox.com/v4/tursics.l7ad5ee8/{z}/{x}/{y}.png?access_token=' + mapboxToken, {
				attribution: '<a href="http://www.openstreetmap.org" target="_blank">OpenStreetMap-Mitwirkende</a>, <a href="https://www.mapbox.com" target="_blank">Mapbox</a>'
			});

		map = L.map(elementName, {zoomControl: false, scrollWheelZoom: true})
			.addLayer(mapboxTiles)
			.setView([lat, lng], zoom);

		map.addControl(L.control.zoom({ position: 'bottomright'}));
		map.addControl(new ControlInfo());

		data.loadMenu();
		buildNavigation();
	}
}

// -----------------------------------------------------------------------------

$(document).on("pageshow", "#pageMap", function () {
	'use strict';

	function updateEmbedURI() {
		var size = $('#selectEmbedSize').val().split('x'),
			x = size[0],
			y = size[1],
			html = '<iframe src="' + baseURI + '" width="' + x + '" height="' + y + '" frameborder="0" style="border:0" allowfullscreen></iframe>';

		$('#inputEmbedURI').val(html);
		if (-1 === $('#embedMap iframe')[0].outerHTML.indexOf('width="' + x + '"')) {
			$('#embedMap iframe')[0].outerHTML = html.replace('.html"', '.html?foo=' + (new Date().getTime()) + '"');
			$('#embedMap input').focus().select();
		}
	}

	// center of Krefeld
	initMap('mapContainer', 51.340164, 6.602664, 12);

	receipt.initUI();
	data.initUI();
	search.initUI();

	$("#popupShare").on('popupafteropen', function () {
		$('#shareLink input').focus().select();
	});
	$('#tabShareLink').on('click', function () {
		$('#popupShare').popup('reposition', 'positionTo: window');
		$('#shareLink input').focus().select();
	});
	$('#tabEmbedMap').on('click', function () {
		updateEmbedURI();
		$('#popupShare').popup('reposition', 'positionTo: window');
		$('#embedMap input').focus().select();
	});

	$('#selectEmbedSize').val('400x300').selectmenu('refresh');
	$('#selectEmbedSize').on('change', function () {
		updateEmbedURI();
		$('#popupShare').popup('reposition', 'positionTo: window');
	});
});

//-----------------------------------------------------------------------

//buildNavigation();

//-----------------------------------------------------------------------
