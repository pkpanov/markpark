var MARKER_STATE_EDIT = 0;
var MARKER_STATE_DELETE = 1;
var MARKER_STATE_LOCKED = 2;

var MAP_MODE_EDIT_OUTER = 0;
var MAP_MODE_EDIT_INNER = 1;

var PAL_OPT_NONE = 0;
var PAL_OPT_ADD_TREE = 1;
var PAL_OPT_ADD_LAKE = 2;
var PAL_OPT_ADD_ROAD = 3;
var PAL_OPT_EDIT_ROAD = 4;
var PAL_OPT_RANDOM = 5;

var TILE_SIZE = 32;
var FIXED_ZOOM = 16;

var world_coords = [ { lat: 85, lng: 180 },
                     { lat: 85, lng: 90 },
                     { lat: 85, lng: 0 },
                     { lat: 85, lng: -90 },
                     { lat: 85, lng: -180 },
                     { lat: 0, lng: -180 },
                     { lat: -85, lng: -180 },
                     { lat: -85, lng: -90 },
                     { lat: -85, lng: 0 },
                     { lat: -85, lng: 90 },
                     { lat: -85, lng: 180 },
                     { lat: 0, lng: 180 },
                     { lat: 85, lng: 180 } ];

var park_map;
var park_border_line;
var park_border_line_coords = [];
var park_inner;
var park_inner_coords = [];
var park_grid;
var mouse_down_lat = 0;
var mouse_down_lnt = 0;
var park_markers;
var ruler_markers = [];
var icon_bluepin, icon_redpin, icon_greenpin;
var areapanel;
var palette;
var pal_selected = PAL_OPT_NONE;

function GridOverlay(tileSize) {

    this.tileSize = tileSize;
    this.loadedTiles = {};
    this.loadedTrees = {};
}

GridOverlay.prototype.getImage = function (coord) {

    var img = document.createElement('img');
    var tile_up_id = 'x_' + coord.x + '_y_' + (coord.y - 1);
    var tile_down_id = 'x_' + coord.x + '_y_' + (coord.y + 1);
    var tile_left_id = 'x_' + (coord.x - 1) + '_y_' + coord.y;
    var tile_right_id = 'x_' + (coord.x + 1) + '_y_' + coord.y;

    img.setAttribute('src', 'ico/tree1.png');
    img.setAttribute('width', this.tileSize.width);
    img.setAttribute('height', this.tileSize.height);
    img.style.position = 'absolute';
    img.style.margin = 'auto';
    img.style.top = '0';
    img.style.left = '0';
    img.style.right = '0';
    img.style.bottom = '0';
    img.style.borderRadius = '16px';

    if (this.loadedTrees[tile_up_id] != undefined) {

        img.style.borderTopLeftRadius = '0';
        img.style.borderTopRightRadius = '0';
    }

    if (this.loadedTrees[tile_down_id] != undefined) {

        img.style.borderBottomLeftRadius = '0';
        img.style.borderBottomRightRadius = '0';
    }

    if (this.loadedTrees[tile_left_id] != undefined) {

        img.style.borderTopLeftRadius = '0';
        img.style.borderBottomLeftRadius = '0';
    }

    if (this.loadedTrees[tile_right_id] != undefined) {

        img.style.borderTopRightRadius = '0';
        img.style.borderBottomRightRadius = '0';
    }

    return img;
}

GridOverlay.prototype.getTile = function (coord, zoom, ownerDocument) {

    var tile = ownerDocument.createElement('div');
    var p = new google.maps.Point(coord.x, coord.y);
    var tile_id = 'x_' + coord.x + '_y_' + coord.y;
    this.loadedTiles[tile_id] = tile;

    if (this.loadedTrees[tile_id] != undefined) {

        img = this.getImage(coord);
        tile.appendChild(img);
    }

    tile.style.width = this.tileSize.width + 'px';
    tile.style.height = this.tileSize.height + 'px';
    tile.style.fontSize = '10';
    tile.style.borderStyle = 'solid';
    tile.style.borderWidth = '1px 1px 0px 0px';
    tile.style.borderColor = '#aaaaaa';

    return tile;
};

GridOverlay.prototype.refreshTile = function (coord) {

    var tile_id = 'x_' + coord.x + '_y_' + coord.y;

    if ((this.loadedTiles[tile_id] != undefined) &&
        (this.loadedTrees[tile_id] != undefined)) {

        img = this.getImage(coord);
        this.loadedTiles[tile_id].appendChild(img);
    }
}

GridOverlay.prototype.releaseTile = function (tile) {

    delete this.loadedTiles[tile.tile_id];
    delete this.loadedTrees[tile.tile_id];
    tile = null;
};

function init_map() {

    park_map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 42.707261, lng: 23.271824 },
        disableDefaultUI: true,
        zoom: FIXED_ZOOM,
        minZoom: FIXED_ZOOM,
        maxZoom: FIXED_ZOOM,
        zoomControl: false,
        draggableCursor: 'url(ico/track-15.png), auto',
        mode: MAP_MODE_EDIT_OUTER,
        styles: [
            {
                "featureType": "poi.attraction",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "poi.business",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "poi.government",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "road.local",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "poi.park",
                "elementType": "geometry.fill",
                "stylers": [
                    {
                        "UNUSEDcolor": "#01FF70"
                    }
                ]
            },
            {
                "stylers": [{ lightness: 0 }]
            }
        ]
    });

    icon_bluepin = {
        url: 'ico/blue-pushpin.png',
        scaledSize: new google.maps.Size(24, 24),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(8, 24)
    };

    icon_redpin = {
        url: 'ico/red-pushpin.png',
        scaledSize: new google.maps.Size(24, 24),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(8, 24)
    };

    icon_greenpin = {
        url: 'ico/green-pushpin.png',
        scaledSize: new google.maps.Size(24, 24),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(8, 24)
    };

    icon_ruler = {
        url: 'ico/ruler.png',
        scaledSize: new google.maps.Size(20, 20),
        origin: new google.maps.Point(0, 0),
    };

    park_markers = new google.maps.MVCArray();

    park_border_line = new google.maps.Polyline({
        path: park_border_line_coords,
        geodesic: true,
        strokeColor: '#000000',
        strokeOpacity: 0.7,
        strokeWeight: 2,
        editable: true,
        suppressUndo: true
    });

    park_inner = new google.maps.Polygon({
        path: park_inner_coords,
        geodesic: true,
        strokeWeight: 0,
        fillColor: '#000000',
        fillOpacity: 0.1,
        clickable: false
    });

    park_border_line.setMap(park_map);
    park_inner.setMap(park_map);
    park_map.addListener('click', add_vertex);
    park_map.addListener('rightclick', toogle_map_mode);
    park_map.data.addListener('rightclick', toogle_map_mode);

    park_border_line.addListener('mousedown', vertex_mouse_down);
    park_border_line.addListener('mouseup', vertex_mouse_up);
    park_border_line.getPath().addListener('insert_at', vertex_insert);
    park_border_line.getPath().addListener('remove_at', vertex_remove);
    park_border_line.getPath().addListener('set_at', vertex_modify);

    park_overlay = new GridOverlay(new google.maps.Size(TILE_SIZE, TILE_SIZE));

    areapanel = document.getElementById('areapanel');
    palette = document.getElementById('palette');

    var palette_options = palette.getElementsByClassName("palopt");

    for (var i = 0; i < palette_options.length; i++) {

        palette_options[i].addEventListener("click", function () {
            var current_active = document.getElementsByClassName("active");
            if (current_active.length > 0) current_active[0].className = current_active[0].className.replace(" active", "");
            this.className += " active";

            for (var j = 0; j < palette_options.length; j++)
                if (palette_options[j] == this) pal_selected = j;
        });
    }
}

function vertex_mouse_down(event) {

    if (event.vertex !== undefined) {

        mouse_down_lat = event.latLng.lat();
        mouse_down_lng = event.latLng.lng();
    }
}

function change_marker_state(marker, idx, state) {

    marker.set('state', state);
    if (marker.get('infowindow') !== null) {

        marker.get('infowindow').close();
        marker.set('infowindow', null);
    }
    google.maps.event.clearListeners(marker, 'click');

    if (state == MARKER_STATE_EDIT) {

        marker.setIcon(icon_bluepin);
    } else if (state == MARKER_STATE_DELETE) {

        var infowindow = new google.maps.InfoWindow({
            disableAutoPan: true,
            content: 'натисни за изтриване'
        });

        infowindow.open(park_map, marker);
        marker.set('infowindow', infowindow);

        marker.setIcon(icon_redpin);
        marker.addListener('click', function () {
            (function () { park_border_line.getPath().removeAt(idx); })();
        });
    } else if (state == MARKER_STATE_LOCKED) {

        marker.setIcon(icon_greenpin);
    }
}

function vertex_mouse_up(event) {

    if ((event.vertex !== undefined) &&
        (event.latLng.lat() == mouse_down_lat) &&
        (event.latLng.lng() == mouse_down_lng)) {

        if (park_markers.getAt(event.vertex).get('state') == MARKER_STATE_DELETE) {

            change_marker_state(park_markers.getAt(event.vertex), event.vertex, MARKER_STATE_EDIT);
        } else if (park_markers.getAt(event.vertex).get('state') == MARKER_STATE_EDIT) {

            for (var i = 0; i < park_markers.getLength(); i++) {

                change_marker_state(park_markers.getAt(i), i, MARKER_STATE_EDIT);
            }

            change_marker_state(park_markers.getAt(event.vertex), event.vertex, MARKER_STATE_DELETE);
        }
    }
}

function vertex_insert(idx) {

    var marker = new google.maps.Marker({
        position: park_border_line.getPath().getAt(idx),
        map: park_map,
        animation: google.maps.Animation.DROP,
        icon: icon_bluepin
    });

    park_markers.insertAt(idx, marker);
    park_markers.getAt(idx).set('state', MARKER_STATE_EDIT);
    park_markers.getAt(idx).set('infowindow', null);
    park_inner.getPath().insertAt(idx, park_border_line.getPath().getAt(idx));
    update_areapanel();
}

function vertex_remove(idx, removed) {

    park_markers.getAt(idx).setMap(null);
    park_markers.removeAt(idx);
    park_inner.getPath().removeAt(idx);
    update_areapanel();
}

function vertex_modify(idx, prev) {

    park_markers.getAt(idx).setPosition(park_border_line.getPath().getAt(idx));
    park_inner.getPath().setAt(idx, park_border_line.getPath().getAt(idx));
    update_areapanel();
}

function add_vertex(event) {

    if (park_map.get('mode') == MAP_MODE_EDIT_OUTER) {

        park_border_line.getPath().push(event.latLng);
    }
}

function add_tree(event) {

    var world_coordinates = project(event.latLng);
    var scale = 1 << FIXED_ZOOM;
    var t = 256 / TILE_SIZE;
    var x = Math.floor(world_coordinates.x * scale * t);
    var y = Math.floor(world_coordinates.y * scale * t);
    var coord = new google.maps.Point(x, y);
    var tile_id = 'x_' + coord.x + '_y_' + coord.y;

    park_overlay.loadedTrees[tile_id] = 1;

    park_overlay.refreshTile(new google.maps.Point(x, y));
    park_overlay.refreshTile(new google.maps.Point(x - 1, y));
    park_overlay.refreshTile(new google.maps.Point(x + 1, y));
    park_overlay.refreshTile(new google.maps.Point(x, y - 1));
    park_overlay.refreshTile(new google.maps.Point(x, y + 1));
}

function add_park_border_line_rulers() {

    var i;
    var len = park_border_line.getPath().length;

    if (len < 2) return;

    for (i = 0; i < len; i++) {

        var midlat = (park_border_line.getPath().getAt(i).lat() + park_border_line.getPath().getAt((i + 1) % len).lat()) / 2;
        var midlng = (park_border_line.getPath().getAt(i).lng() + park_border_line.getPath().getAt((i + 1) % len).lng()) / 2;

        var ruler_marker = new google.maps.Marker({
            position: {
                lat: midlat,
                lng: midlng
            },
            map: park_map,
            icon: icon_ruler,
            animation: google.maps.Animation.DROP,
        });

        ruler_markers.push(ruler_marker);

        ruler_marker.addListener('click', (function (idx) {
            return function f() {

                var dist_str = String(google.maps.geometry.spherical.computeDistanceBetween(
                    park_border_line.getPath().getAt(idx),
                    park_border_line.getPath().getAt((idx + 1) % len)).toFixed(2)) + ' м';

                var dist_info = new google.maps.InfoWindow({
                    disableAutoPan: true,
                    content: dist_str
                });

                dist_info.open(park_map, ruler_markers[idx]);
            }
        })(i));

        if (len == 2) break;
    }
}

function remove_park_border_line_rulers() {

    for (var i = 0; i < ruler_markers.length; i++)
        ruler_markers[i].setMap(null);

    ruler_markers = [];
}

function toogle_map_mode(event) {

    if (park_markers.getLength() == 0) return;

    if (park_map.get('mode') == MAP_MODE_EDIT_OUTER) {

        for (var i = 0; i < park_markers.getLength(); i++) {

            change_marker_state(park_markers.getAt(i), i, MARKER_STATE_LOCKED);
        }

        park_inner.setVisible(false);
        park_border_line.setVisible(false);
        park_map.data.add({
            geometry: new google.maps.Data.Polygon([world_coords, park_border_line.getPath().getArray()])
        });

        park_map.data.setStyle({
            strokeWeight: 1
        });

        add_park_border_line_rulers();

        park_map.overlayMapTypes.insertAt(0, park_overlay);
        google.maps.event.clearListeners(park_map, 'click');
        park_map.addListener('click', add_tree);

        var current_active = document.getElementsByClassName("active");
        if (current_active.length > 0) current_active[0].className = current_active[0].className.replace(" active", "");

        pal_selected = PAL_OPT_NONE;

        palette.style.width = '100px';

        park_map.set('mode', MAP_MODE_EDIT_INNER);
    } else if (park_map.get('mode') == MAP_MODE_EDIT_INNER) {

        for (var i = 0; i < park_markers.getLength(); i++) {

            change_marker_state(park_markers.getAt(i), i, MARKER_STATE_EDIT);
        }

        park_inner.setVisible(true);
        park_border_line.setVisible(true);
        park_map.data.forEach(function (f) {
            park_map.data.remove(f);
        });

        remove_park_border_line_rulers();

        park_map.overlayMapTypes.removeAt(0);
        google.maps.event.clearListeners(park_map, 'click');
        park_map.addListener('click', add_vertex);

        pal_selected = PAL_OPT_NONE;

        palette.style.width = '0';

        park_map.set('mode', MAP_MODE_EDIT_OUTER);
    } else {

        alert("Unsupported map mode");
    }
}

function project(latLng) {
    var siny = Math.sin(latLng.lat() * Math.PI / 180);

    siny = Math.min(Math.max(siny, -0.9999), 0.9999);

    return new google.maps.Point(
        (0.5 + latLng.lng() / 360),
        (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)));
}

function update_areapanel() {

    var i;
    var len = park_border_line.getPath().length;
    var circum = 0;

    for (i = 0; i < (len == 2 ? 1 : len); i++)
        circum += google.maps.geometry.spherical.computeDistanceBetween(
            park_border_line.getPath().getAt(i),
            park_border_line.getPath().getAt((i + 1) % len));

    var area = google.maps.geometry.spherical.computeArea(park_inner.getPath().getArray());
    area /= 1000;
    areapanel.innerHTML = 'обиколка: ' + circum.toFixed(2) + ' метра' + '<br>' + 'площ: ' + area.toFixed(2) + ' декара';
}
