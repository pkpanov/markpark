var MARKER_STATE_EDIT = 0;
var MARKER_STATE_DELETE = 1;
var MARKER_STATE_LOCKED = 2;

var MAP_MODE_EDIT_OUTER = 0;
var MAP_MODE_EDIT_INNER = 1;

var PAL_OPT_NONE        = 0;
var PAL_OPT_ADD_TREE    = 1;
var PAL_OPT_ADD_WATER   = 2;
var PAL_OPT_ADD_ROAD    = 3;
var PAL_OPT_RANDOM      = 4;

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
var tree_coords = [];
var water_coords = [];
var park_alley_cnt = 0;
var create_new_park_alley = false;
var park_alley_raw = [];
var park_alley = [];
var park_alley_coords = [];
var park_alley_markers = [];
var park_area;
var park_area_coords = [];
var park_grid;
var park_overlay;
var mouse_down_lat = 0;
var mouse_down_lnt = 0;
var park_markers;
var ruler_markers = [];
var random_markers = [];
var icon_bluepin, icon_redpin, icon_greenpin, icon_sign, icon_flag;
var areapanel;
var helppanel;
var palette;
var palette_selected = PAL_OPT_NONE;

function GridOverlay(tileSize) {

    this.tileSize = tileSize;
    this.loadedTiles = {};
    this.loadedTrees = {};
    this.loadedWater = {};
}

GridOverlay.prototype.getImage = function (coord, type) {

    var img = document.createElement('img');
    var tile_up_id = 'x_' + coord.x + '_y_' + (coord.y - 1);
    var tile_down_id = 'x_' + coord.x + '_y_' + (coord.y + 1);
    var tile_left_id = 'x_' + (coord.x - 1) + '_y_' + coord.y;
    var tile_right_id = 'x_' + (coord.x + 1) + '_y_' + coord.y;

    img.setAttribute('width', this.tileSize.width);
    img.setAttribute('height', this.tileSize.height);
    img.style.position = 'absolute';
    img.style.margin = 'auto';
    img.style.top = '0';
    img.style.left = '0';
    img.style.right = '0';
    img.style.bottom = '0';
    img.style.borderRadius = '16px';
    
    if ( type == PAL_OPT_ADD_TREE ) { 
    
        img.setAttribute('src', 'ico/tree1.png');
    } else if ( type == PAL_OPT_ADD_WATER ) {
    
        img.setAttribute('src', 'ico/water1.png');
        
        if (this.loadedWater[tile_up_id] != undefined) {

            img.style.borderTopLeftRadius = '0';
            img.style.borderTopRightRadius = '0';
        }

        if (this.loadedWater[tile_down_id] != undefined) {

            img.style.borderBottomLeftRadius = '0';
            img.style.borderBottomRightRadius = '0';
        }

        if (this.loadedWater[tile_left_id] != undefined) {

            img.style.borderTopLeftRadius = '0';
            img.style.borderBottomLeftRadius = '0';
        }

        if (this.loadedWater[tile_right_id] != undefined) {

            img.style.borderTopRightRadius = '0';
            img.style.borderBottomRightRadius = '0';
        }
    } else {
    
        img.setAttribute('src', 'ico/error1.png');
    }

    return img;
}

GridOverlay.prototype.getTile = function (coord, zoom, ownerDocument) {

    var tile = ownerDocument.createElement( 'div' );
    var p = new google.maps.Point( coord.x, coord.y );
    var tile_id = 'x_' + coord.x + '_y_' + coord.y;
    this.loadedTiles[ tile_id ] = tile;

    if ( this.loadedTrees[ tile_id ] != undefined ) {

        img = this.getImage( coord, PAL_OPT_ADD_TREE );
        tile.style.borderWidth = '1px 1px 0px 0px';
        tile.appendChild( img );
    } else if ( this.loadedWater[ tile_id ] != undefined ) {
    
        tile.style.borderWidth = '0px 0px 0px 0px';
        if ( park_overlay.loadedWater[ 'x_' + (coord.x+1) + '_y_' + coord.y ] === undefined ) tile.style.borderRightWidth = '1px';
        if ( park_overlay.loadedWater[ 'x_' + coord.x + '_y_' + (coord.y-1) ] === undefined ) tile.style.borderTopWidth = '1px';
        img = this.getImage( coord, PAL_OPT_ADD_WATER );
        tile.appendChild( img );
    } else {
    
        tile.style.borderWidth = '1px 1px 0px 0px';
    }

    tile.style.width = this.tileSize.width + 'px';
    tile.style.height = this.tileSize.height + 'px';
    tile.style.fontSize = '10';
    tile.style.borderStyle = 'solid';
    tile.style.borderColor = '#aaaaaa';

    return tile;
};

GridOverlay.prototype.refreshTile = function (coord) {

    var tile_id = 'x_' + coord.x + '_y_' + coord.y;

    if ( this.loadedTiles[ tile_id ] != undefined )  {
    
        if ( this.loadedTrees[ tile_id ] != undefined ) {
        
            img = this.getImage( coord, PAL_OPT_ADD_TREE );
            this.loadedTiles[ tile_id ].style.borderWidth = '1px 1px 0px 0px';
        } else if ( this.loadedWater[ tile_id ] != undefined ) {
        
            this.loadedTiles[ tile_id ].style.borderWidth = '0px 0px 0px 0px';
            if ( park_overlay.loadedWater[ 'x_' + (coord.x+1) + '_y_' + coord.y ] === undefined ) this.loadedTiles[ tile_id ].style.borderRightWidth = '1px';
            if ( park_overlay.loadedWater[ 'x_' + coord.x + '_y_' + (coord.y-1) ] === undefined ) this.loadedTiles[ tile_id ].style.borderTopWidth = '1px';
            img = this.getImage( coord, PAL_OPT_ADD_WATER );
        } else {
        
            img = this.getImage( coord, PAL_OPT_NONE );
        }

        this.loadedTiles[ tile_id ].appendChild( img );
    }
}

GridOverlay.prototype.releaseTile = function (tile) {

    delete this.loadedTiles[tile.tile_id];
    delete this.loadedTrees[tile.tile_id];
    delete this.loadedWater[tile.tile_id];
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
    
    icon_sign = {
        url: 'ico/sign1.png',
        scaledSize: new google.maps.Size(32, 32),
        origin: new google.maps.Point(0, 0),
    };
    
    icon_flag = {
        url: 'ico/flag1.png',
        scaledSize: new google.maps.Size(32, 32),
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

    park_area = new google.maps.Polygon({
        path: park_area_coords,
        geodesic: true,
        strokeWeight: 0,
        fillColor: '#000000',
        fillOpacity: 0.1,
        clickable: false
    });

    park_border_line.setMap(park_map);
    park_area.setMap(park_map);
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
    helppanel = document.getElementById('helppanel');
    
    helppanel.addEventListener( "click", function() {
        alert("РЕЖИМ: ДЕФИНИРАНЕ НА ПАРК\n\
клик по картата: добавя нов връх\n\
клик върху връх: изтрива връх\n\
преместване на връх: редактира границите\n\n\
РЕЖИМ: РЕДАКТИРАНЕ НА ПАРК\n\
изберете обект от менюто и добавете на картата\n\n\
ДЕСЕН БУТОН НА МИШКАТА СМЕНЯ РЕЖИМА");
		alert("КЛАВИШ 'S' записва картата във файл\n\
КЛАВИШ 'L' зарежда картата от файл");
    } );
    
    palette = document.getElementById('palette');

    var palette_options = palette.getElementsByClassName("palopt");

    for (var i = 0; i < palette_options.length; i++) {

        palette_options[i].addEventListener("click", function () {
            var current_active = document.getElementsByClassName("active");
            if (current_active.length > 0) current_active[0].className = current_active[0].className.replace(" active", "");
            this.className += " active";
            
            create_new_park_alley = false;
            
            if ( palette_selected == PAL_OPT_ADD_ROAD ) {
            
                if ( park_alley_cnt > 0 ) {
                
                    if ( park_alley_raw[ park_alley_cnt - 1 ].length < 2 ) {
                
                        remove_alley( park_alley_cnt - 1 );
                    }
                }
            }

            for (var j = 0; j < palette_options.length; j++)
                if (palette_options[j] == this) {
                    palette_selected = j+1;
                    if ( palette_selected == PAL_OPT_ADD_ROAD ) create_new_park_alley = true;
                    break;
                }
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
    park_area.getPath().insertAt(idx, park_border_line.getPath().getAt(idx));
    update_areapanel();
}

function vertex_remove(idx, removed) {

    park_markers.getAt(idx).setMap(null);
    park_markers.removeAt(idx);
    park_area.getPath().removeAt(idx);
    update_areapanel();
}

function vertex_modify(idx, prev) {

    park_markers.getAt(idx).setPosition(park_border_line.getPath().getAt(idx));
    park_area.getPath().setAt(idx, park_border_line.getPath().getAt(idx));
    update_areapanel();
}

function add_vertex(event) {

    if (park_map.get('mode') == MAP_MODE_EDIT_OUTER) {

        park_border_line.getPath().push(event.latLng);
    }
}

function remove_alley( alley_idx ) {

    if ( alley_idx >= park_alley_cnt ) return;

    for ( var i = 0; i < 2; i++ )
        if ( park_alley_markers[ alley_idx ][ i ] != null ) {

            park_alley_markers[ alley_idx ][ i ].setMap( null );
            park_alley_markers[ alley_idx ][ i ] = null;
        }
        
    park_alley_markers.splice( alley_idx, 1 );
    park_alley_raw.splice( alley_idx, 1 );
    park_alley_coords.splice( alley_idx, 1 );
    park_alley[ alley_idx ].setMap( null );
    park_alley.splice( alley_idx, 1 );
    park_alley_cnt--;
    create_new_park_alley = true;
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function set_alley_sign_info_window( marker, iii ) {

    marker.addListener('click', (function (idx) {
            return function f() {

                var i;
                var dist = 0;
                
                for ( i = 0; i < park_alley_raw[ idx ].length - 1; i++ )
                    dist += google.maps.geometry.spherical.computeDistanceBetween(
                                park_alley_raw[ idx ][ i ],
                                park_alley_raw[ idx ][ i + 1 ]);

                var dist_str = String(dist.toFixed(2)) + ' м';

                var dist_info = new google.maps.InfoWindow({
                    disableAutoPan: true,
                    content: dist_str
                });

                dist_info.open(park_map, marker);
            }
        })(iii));
}

function add_object(event) {
    
    var world_coordinates = park_map.getProjection().fromLatLngToPoint( event.latLng );
    var scale = 1 << FIXED_ZOOM;
    var t = 256 / TILE_SIZE;
    var x = Math.floor( world_coordinates.x * scale / TILE_SIZE );
    var y = Math.floor( world_coordinates.y * scale / TILE_SIZE );
    var coord = new google.maps.Point(x, y);
    var tile_id = 'x_' + coord.x + '_y_' + coord.y;
    
    if ( ( palette_selected != PAL_OPT_ADD_TREE && park_overlay.loadedTrees[tile_id] != undefined ) ||
         ( park_overlay.loadedWater[tile_id] != undefined ) ) return;

    if ( palette_selected == PAL_OPT_NONE ) {
    } else if ( palette_selected == PAL_OPT_ADD_TREE ) {
    
        if ( park_overlay.loadedTrees[tile_id] != undefined ) {
        
            for ( var i = -1; i <= +1; i++ )
                for ( var j = -1; j <= +1; j++ ) {

                    tile_id = 'x_' + (x+i) + '_y_' + (y+j);
                    if ( ( park_overlay.loadedTrees[tile_id] == undefined ) &&
                         ( park_overlay.loadedWater[tile_id] == undefined ) ) {
                
						tree_coords.push( event.latLng );
                        park_overlay.loadedTrees[tile_id] = 1;
                        park_overlay.refreshTile(new google.maps.Point(x+i, y+j));
                    }
                }
        } else {
        
			tree_coords.push( event.latLng );
            park_overlay.loadedTrees[tile_id] = 1;
            park_overlay.refreshTile(new google.maps.Point(x, y));
        }
    } else if ( palette_selected == PAL_OPT_ADD_WATER ) {
    
		water_coords.push( event.latLng );
        park_overlay.loadedWater[tile_id] = 1;
        park_overlay.refreshTile(new google.maps.Point(x, y));
        
        if ( park_overlay.loadedWater[ 'x_' + (x-1) + '_y_' + y ] != undefined )
        park_overlay.refreshTile(new google.maps.Point(x - 1, y));
        
        if ( park_overlay.loadedWater[ 'x_' + (x+1) + '_y_' + y ] != undefined )
        park_overlay.refreshTile(new google.maps.Point(x + 1, y));
        
        if ( park_overlay.loadedWater[ 'x_' + x + '_y_' + (y-1) ] != undefined )
        park_overlay.refreshTile(new google.maps.Point(x, y - 1));
        
        if ( park_overlay.loadedWater[ 'x_' + x + '_y_' + (y+1) ] != undefined )
        park_overlay.refreshTile(new google.maps.Point(x, y + 1));
    } else if ( palette_selected == PAL_OPT_ADD_ROAD ) {
    
        if ( create_new_park_alley ) {
 
            park_alley_cnt++;
            var alley_idx = park_alley_cnt - 1;

            park_alley_raw.push( [ event.latLng ] );
            park_alley_coords.push( [] );
            
            park_alley.push( new google.maps.Polyline({
                                path: park_alley_coords[ alley_idx ],
                                geodesic: true,
                                //strokeColor: '#9F8170',
                                strokeColor: rgbToHex(Math.floor(Math.random() * 255),Math.floor(Math.random() * 255),Math.floor(Math.random() * 255)),
                                strokeOpacity: 0.5,
                                strokeWeight: 7,
                                editable: false,
                                suppressUndo: true
            }) );

            park_alley[ alley_idx ].setMap( park_map );
            
            park_alley_markers.push( [ null, null ] );
            park_alley_markers[ alley_idx ][ 1 ] = new google.maps.Marker({
                position: park_alley_raw[ alley_idx ][ 0 ], 
                map: park_map,
                icon: icon_flag
            });
            park_alley_markers[ alley_idx ][ 1 ].setMap( park_map );
            var infowindow = new google.maps.InfoWindow({
                disableAutoPan: true,
                content: 'натисни за край на алея'
            });

            infowindow.open(park_map, park_alley_markers[ alley_idx ][ 1 ]);
            park_alley_markers[ alley_idx ][ 1 ].addListener('click', function () {
                
                infowindow.close();
                google.maps.event.clearListeners(park_alley_markers[ alley_idx ][ 1 ], 'click');
                park_alley_markers[ alley_idx ][ 1 ].setIcon( icon_sign );
                set_alley_sign_info_window( park_alley_markers[ alley_idx ][ 1 ], alley_idx );
                google.maps.event.trigger( park_alley_markers[ alley_idx ][ 1 ], 'click' );
                create_new_park_alley = true;
            });
 
            create_new_park_alley = false;
        } else {
        
            var alley_idx = park_alley_cnt - 1;
        
            park_alley_raw[ alley_idx ].push( event.latLng );
            park_alley[ alley_idx ].getPath().clear();
            
            for ( var i = 1; i < park_alley_raw[ alley_idx ].length - 1; i += 2 ) {

                var p0 = park_alley_raw[ alley_idx ][ i - 1 ];
                var p1 = park_alley_raw[ alley_idx ][ i ];
                var p2 = park_alley_raw[ alley_idx ][ i + 1 ];

                for ( var t = 0; t <= 1; t += 0.05 ) {

                    var lat = ( 1 - t ) * ( 1 - t ) * p0.lat() + 2 * ( 1 - t ) * t * p1.lat() + t * t * p2.lat();
                    var lng = ( 1 - t ) * ( 1 - t ) * p0.lng() + 2 * ( 1 - t ) * t * p1.lng() + t * t * p2.lng();

                    park_alley[ alley_idx ].getPath().push( new google.maps.LatLng( lat, lng ) );
                }
            }

            if ( park_alley_raw[ alley_idx ].length % 2 == 0 ) {

                if ( park_alley_raw[ alley_idx ].length == 2 )
                    park_alley[ alley_idx ].getPath().push( park_alley_raw[ alley_idx ][ 0 ] );
                park_alley[ alley_idx ].getPath().push( event.latLng );
            }
            
            for ( var i = 0; i < 2; i++ )
                if ( park_alley_markers[ alley_idx ][ i ] != null ) {

                    park_alley_markers[ alley_idx ][ i ].setMap( null );
                    park_alley_markers[ alley_idx ][ i ] = null;
                }

            if ( park_alley_raw[ alley_idx ].length > 1 ) {

                park_alley_markers[ alley_idx ][ 0 ] = new google.maps.Marker({
                    position: park_alley_raw[ alley_idx ][ 0 ], 
                    map: park_map,
                    icon: icon_sign
                });
                park_alley_markers[ alley_idx ][ 0 ].setMap( park_map );
                set_alley_sign_info_window( park_alley_markers[ alley_idx ][ 0 ], alley_idx );
            }

            park_alley_markers[ alley_idx ][ 1 ] = new google.maps.Marker({
                position: park_alley_raw[ alley_idx ][ park_alley_raw[ alley_idx ].length - 1 ], 
                map: park_map,
                icon: icon_flag
            });
            park_alley_markers[ alley_idx ][ 1 ].setMap( park_map );
            var infowindow = new google.maps.InfoWindow({
                disableAutoPan: true,
                content: 'натисни за край на алея'
            });

            infowindow.open(park_map, park_alley_markers[ alley_idx ][ 1 ]);
            
            park_alley_markers[ alley_idx ][ 1 ].addListener('click', function () {
                
                infowindow.close();
                google.maps.event.clearListeners(park_alley_markers[ alley_idx ][ 1 ], 'click');
                park_alley_markers[ alley_idx ][ 1 ].setIcon( icon_sign );
                set_alley_sign_info_window( park_alley_markers[ alley_idx ][ 1 ], alley_idx );
                google.maps.event.trigger( park_alley_markers[ alley_idx ][ 1 ], 'click' );
                create_new_park_alley = true;
            });

            /*
            var X = ( TILE_SIZE * ( 2 * x + 1 ) ) / ( scale * 2 );
            var Y = ( TILE_SIZE * ( 2 * y + 1 ) ) / ( scale * 2 );    
            var ll = park_map.getProjection().fromPointToLatLng( new google.maps.Point( X, Y ) );
            console.log( 'x = ' +  x + ' y = ' + y );
            console.log( 'latLng.lat = ' +  event.latLng.lat() + ' latLng.lng = ' + event.latLng.lng() );
            console.log( 'world_coord.x = ' + world_coordinates.x + ' world_coord.y = ' + world_coordinates.y );
            console.log( 'pt.x = ' +  pt.x/256 + ' pt.y = ' + pt.y/256 );
            console.log( 'X = ' + X + ' Y = ' + Y );
            console.log( 'll.lat = ' +  ll.lat() + 'll.lng = ' + ll.lng() );

            var marker = new google.maps.Marker({
                position: ll,
                title:"Hello World!"
            });

            marker.setMap( park_map );
            */
        }
        
    } else if ( palette_selected == PAL_OPT_RANDOM ) {
    
        var random_marker_ico_path = String( Math.floor(Math.random() * 80) );
        
        while ( random_marker_ico_path.length < 4 ) random_marker_ico_path = '0' + random_marker_ico_path;
        random_marker_ico_path = 'ico/objects/' + random_marker_ico_path + '.png';
        
        var random_marker_ico = {

            url: random_marker_ico_path,
            scaledSize: new google.maps.Size(40, 40),
            origin: new google.maps.Point(0, 0),
        };
    
        var random_marker = new google.maps.Marker({
            position: event.latLng,
            map: park_map,
            icon: random_marker_ico,
            animation: google.maps.Animation.DROP
        });

        random_markers.push( random_marker );
        random_marker.addListener('click', function f() {

            var dist_info = new google.maps.InfoWindow({
                disableAutoPan: true,
                content: "ala-бала"
            });

            dist_info.open( park_map, random_marker );
            
            setTimeout( function() { dist_info.close() }, 3000 );
        });
        
        google.maps.event.trigger( random_marker, 'click' );
    }
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
            animation: google.maps.Animation.DROP
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
        
        if ( i == 0 ) google.maps.event.trigger( ruler_markers[ 0 ], 'click' );

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

        park_area.setVisible(false);
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
        google.maps.event.clearListeners(park_map, 'dblclick');
        park_map.addListener('click', add_object);
        park_map.addListener('dblclick', add_object);

        var current_active = document.getElementsByClassName("active");
        if (current_active.length > 0) current_active[0].className = current_active[0].className.replace(" active", "");

        palette_selected = PAL_OPT_NONE;

        palette.style.width = '100px';
        
        for ( i = 0; i < random_markers.length; i++ ) {
        
            random_markers[ i ].setMap( park_map );
            google.maps.event.trigger( random_markers[ i ], 'click' );
        }
        
        for ( i = 0; i < park_alley_cnt; i++ ) {
        
            park_alley[ i ].setMap( park_map );
            if ( park_alley_markers[ i ][ 0 ] != null ) park_alley_markers[ i ][ 0 ].setMap( park_map );
            if ( park_alley_markers[ i ][ 1 ] != null ) park_alley_markers[ i ][ 1 ].setMap( park_map );
        }

        park_map.set('mode', MAP_MODE_EDIT_INNER);
    } else if (park_map.get('mode') == MAP_MODE_EDIT_INNER) {

        for (var i = 0; i < park_markers.getLength(); i++) {

            change_marker_state(park_markers.getAt(i), i, MARKER_STATE_EDIT);
        }

        park_area.setVisible(true);
        park_border_line.setVisible(true);
        park_map.data.forEach(function (f) {
            park_map.data.remove(f);
        });

        remove_park_border_line_rulers();

        park_map.overlayMapTypes.removeAt(0);
        google.maps.event.clearListeners(park_map, 'click');
        park_map.addListener('click', add_vertex);

        palette_selected = PAL_OPT_NONE;

        palette.style.width = '0';
        
        for ( i = 0; i < random_markers.length; i++ )
            random_markers[ i ].setMap( null );
        
        for ( i = 0; i < park_alley_cnt; i++ ) {
        
            park_alley[ i ].setMap( null );
            if ( park_alley_markers[ i ][ 0 ] != null ) park_alley_markers[ i ][ 0 ].setMap( null );
            if ( park_alley_markers[ i ][ 1 ] != null ) park_alley_markers[ i ][ 1 ].setMap( null );
        }

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

    var area = google.maps.geometry.spherical.computeArea(park_area.getPath().getArray());
    area /= 1000;
    areapanel.innerHTML = 'обиколка: ' + circum.toFixed(2) + ' метра' + '<br>' + 'площ: ' + area.toFixed(2) + ' декара';
}

function clear_all() {
	
	park_map.set('mode', MAP_MODE_EDIT_INNER);
	toogle_map_mode( null );
	tree_coords.length = 0;
	water_coords.length = 0;
	park_overlay.loadedTiles = {};
    park_overlay.loadedTrees = {};
    park_overlay.loadedWater = {};
	park_border_line.getPath().clear();
	park_border_line_coords.length = 0;
	park_alley_cnt = 0;
	park_alley_raw.length = 0;
	park_alley.length = 0; 
	park_alley_coords.length = 0;
	park_alley_markers.length = 0;
	park_area_coords.length = 0;
	park_markers.length = 0;
	ruler_markers.length = 0;
	random_markers.length = 0;
}

function save_to_file( ) {
	
	var i, j;
	var idx = 0;
	var event = {};
	var park_data = "";
	
	park_data += park_border_line.getPath().length.toString();
	park_data += "\r\n";
	
	for ( i = 0; i < park_border_line.getPath().length; i++ ) {
		
		park_data += park_border_line.getPath().getAt(i).lat().toFixed(6).toString();
		park_data += ',';
		park_data += park_border_line.getPath().getAt(i).lng().toFixed(6).toString();
		park_data += "\r\n";
	}
	
	park_data += tree_coords.length.toString();
	park_data += "\r\n";;
	
	for ( i = 0; i < tree_coords.length; i++ ) {
		
		park_data += tree_coords[ i ].lat().toFixed(6).toString();
		park_data += ',';
		park_data += tree_coords[ i ].lng().toFixed(6).toString();
		park_data += "\r\n";
	}
	
	park_data += water_coords.length.toString();
	park_data += "\r\n";
	
	for ( i = 0; i < water_coords.length; i++ ) {
		
		park_data += water_coords[ i ].lat().toFixed(6).toString();
		park_data += ',';
		park_data += water_coords[ i ].lng().toFixed(6).toString();
		park_data += "\r\n";
	}
	
	park_data += park_alley_cnt.toString();
	park_data += "\r\n";
	
	for ( i = 0; i < park_alley_cnt; i++ ) {
		
		park_data += park_alley_raw[ i ].length;
		park_data += "\r\n";
		
		for ( j = 0; j < park_alley_raw[ i ].length; j++ ) {
			
			park_data += park_alley_raw[ i ][ j ].lat().toFixed(6).toString();
			park_data += ',';
			park_data += park_alley_raw[ i ][ j ].lng().toFixed(6).toString();
			park_data += "\r\n";
		}
	}
	
	park_data += random_markers.length.toString();
	park_data += "\r\n";
	
	for ( i = 0; i < random_markers.length; i++ ) {
		
		park_data += random_markers[ i ].getPosition().lat().toFixed(6).toString();
		park_data += ',';
		park_data += random_markers[ i ].getPosition().lng().toFixed(6).toString();
		park_data += "\r\n";
	}
	
	console.log( park_data );
	
	var data = new Blob([park_data], {type: 'text/plain'});
	textFile = window.URL.createObjectURL(data);
	
	var link = document.createElement('a');
	link.href = textFile;
	link.download = 'park_map.txt';
	link.click();
}

function build_park( arr ) {
	
	var i, j;
	var idx = 0;
	var event = {};
	
	var border_line_len = parseInt( arr[ idx++ ] );
	for ( i = 0; i < border_line_len; i++ ) {
		
		var p = new google.maps.LatLng( parseFloat( arr[ idx ] ), parseFloat( arr[ idx + 1 ] ) );
		idx += 2;

		event.latLng = p;
		park_map.set('mode', MAP_MODE_EDIT_OUTER);
		add_vertex( event );
	}

	var mid_lat = ( park_border_line.getPath().getAt( 0 ).lat() + park_border_line.getPath().getAt( Math.floor( border_line_len / 2 ) ).lat() ) / 2;
	var mid_lng = ( park_border_line.getPath().getAt( 0 ).lng() + park_border_line.getPath().getAt( Math.floor( border_line_len / 2 ) ).lng() ) / 2;
	
	park_map.setCenter( new google.maps.LatLng(mid_lat, mid_lng ) );
	
	park_map.set('mode', MAP_MODE_EDIT_OUTER);
	toogle_map_mode( null );
	
	palette_selected = PAL_OPT_ADD_TREE;
	var tree_count = parseInt( arr[ idx++ ] );
	for ( i = 0; i < tree_count; i++ ) {
		
		var p = new google.maps.LatLng( parseFloat( arr[ idx ] ), parseFloat( arr[ idx + 1 ] ) );
		idx += 2;
		
		event.latLng = p;
		add_object( event );
	}
	
	palette_selected = PAL_OPT_ADD_WATER;
	var water_count = parseInt( arr[ idx++ ] );
	for ( i = 0; i < water_count; i++ ) {
		
		var p = new google.maps.LatLng( parseFloat( arr[ idx ] ), parseFloat( arr[ idx + 1 ] ) );
		idx += 2;
		
		event.latLng = p;
		add_object( event );
	}
	
	palette_selected = PAL_OPT_ADD_ROAD;
	var park_alley_cntx = parseInt( arr[ idx++ ] );
	for ( i = 0; i < park_alley_cntx; i++ ) {
		
		create_new_park_alley = true;
		
		var park_alley_pt_count = parseInt( arr[ idx++ ] );
		
		for ( j = 0; j < park_alley_pt_count; j++ ) {
			
			var p = new google.maps.LatLng( parseFloat( arr[ idx ] ), parseFloat( arr[ idx + 1 ] ) );
			idx += 2;
		
			event.latLng = p;
			add_object( event );
		}
		
		google.maps.event.trigger( park_alley_markers[ i ][ 1 ], 'click' );
	}
	
	palette_selected = PAL_OPT_RANDOM;
	var random_count = parseInt( arr[ idx++ ] );
	for ( i = 0; i < random_count; i++ ) {
		
		var p = new google.maps.LatLng( parseFloat( arr[ idx ] ), parseFloat( arr[ idx + 1 ] ) );
		idx += 2;
		
		event.latLng = p;
		add_object( event );
	}
}

document.onkeypress = function( e ) {

	if (!e) e = window.event;	
	//alert( e.charCode );
	
	if ( e.charCode == 83 || e.charCode == 115 ) {
		
		save_to_file();
	}
		
	if ( e.charCode == 82 || e.charCode == 114 ) {

		clear_all();
	}
	
	if ( e.charCode == 76 || e.charCode == 108 ) {

		var element = document.createElement('div');
		element.innerHTML = '<input type="file">';
		var fileInput = element.firstChild;

		fileInput.addEventListener('change', function() {
			
			var file = fileInput.files[ 0 ];

			if ( file.name.match(/\.(txt|json|log)$/) ) {
				var reader = new FileReader();

				reader.onload = function() {
					
					console.log(reader.result);
					
					var s = reader.result.split(/[\s,\r\n]+/);
					clear_all();
					build_park( s );
				};

				reader.readAsText(file);    
			} else {
				alert("File not supported, .txt or .json files only");
			}
		});

		fileInput.click();
	}		
}
