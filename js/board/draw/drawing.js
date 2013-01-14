window.learn_draw = new Object();
window.learn_draw = {
    colors: ['#EB3636', '#78E66E', 'blue', 'black'],
    available_instruments: ['colorpicker', 'path', 'eraser', 'line', 'circle', 'rect', 'text', 'highlighter', 'image', 'grid'],
    current_instrument: 'path',
    current_color: 'black', // drawing color
    stroke_width: '1',
    is_drawing: false, // flag
    svg_id: 'current_svg', // id of svg html element
    svg_top: 0, // top coord of svg html element
    svg_left: 0, // left coord of svg html element
    element_id: '', // unique id of the current element (line, path, circle etc..)
    svgNS: "http://www.w3.org/2000/svg", // used to create svg elements
    registered_ids: [], // id attributes of all svg elements
    realtime_emit: null, // an object that is gathering data and is sent to node.js
    element_params: '', // holds the element parameters (used to send data to node.js for saving)
    init: function() {
        // getting position of svg element
        this.svg_top = jQuery('#'+window.learn_draw.svg_id).position().top;
        this.svg_left = jQuery('#'+window.learn_draw.svg_id).position().left;
        // draw available colors
        this.initColors();
        // init instruments
        this.initInstruments();
        // init svg
        this.initSvg();
        // init stroke width
        this.initStrokeWidth();
        // mouse hidder
        this.mouseHidder();
    },
    mouseHidder: function() {
        jQuery('.board_cursor').css({'display':'none'});
        var cursor_id = jQuery('div').filter(function() {return this.id.match(/curs_el_/);}).attr('id');
        delete window.client_drawer.registered_cursors[window.client_drawer.registered_cursors.indexOf(cursor_id)];
        jQuery('div').filter(function() {return this.id.match(/curs_el_/);}).remove();
    
        setTimeout(function() {
            window.learn_draw.mouseHidder();
        }, 6000);
    },
    socketEmit: function(ident, object) {
        window.socket_object.emit(ident, object);
    },
    initStrokeWidth: function() {
        jQuery('.learn_stroke_width').click(function() {
            window.learn_draw.stroke_width = jQuery(this).attr('data-value');
        });
    },
    initColors: function () {
        // populate colors
        var colors_html = '';
        for(var i=0;i<this.colors.length;i++) {
            colors_html += '<div style="background-color: '+this.colors[i]+'" class="colorpicker_item" data-color="'+this.colors[i]+'"></div>';
        }
        jQuery('#learn_colors').html(colors_html);
        jQuery('.colorpicker_item').click(function() {
            window.learn_draw.setCurrentColor(jQuery(this).attr('data-color'));
        });
    },
    initInstruments: function() {
        jQuery('.learn_instrument').click(function() {
            window.learn_draw.setCurrentInstrument(jQuery(this).attr('data-type'));
        })
    },
    initSvg: function() {
        // setting is_drawing flag
        jQuery('#'+this.svg_id).mousedown(function(event){
            window.learn_draw.is_drawing = true;
            window.learn_draw.startDrawingEvent(event);
        });
        jQuery('#'+this.svg_id).mouseup(function(event){
            window.learn_draw.is_drawing = false;
            window.learn_draw.stopDrawingEvent(event);
        });
        
        jQuery('body').mousemove(function(event){
            if(event.ctrlKey) {
                window.learn_draw.sendMousePointer(event);
            }
            if(window.learn_draw.is_drawing) {
                if(event.target.id == window.learn_draw.svg_id) { // check if mouse is moving inside the svg
                    window.learn_draw.doDrawing(event);
                }
            }
        });
        
    },
    instruments: {
        pathStart: '', // moveto for path
        getRealCoord: function(event, dimension) {
            var return_data;
            if(dimension == 'x') {
                return_data = event.clientX - window.learn_draw.svg_left + jQuery(window).scrollLeft();
            }
            if(dimension == 'y') {
                return_data = event.clientY - window.learn_draw.svg_top + jQuery(window).scrollTop();
            }
            return return_data;
        },
        drawPath: function(element_id, event, additional) {
            var real_x = this.getRealCoord(event, 'x');
            var real_y = this.getRealCoord(event, 'y');
            window.learn_draw.realtime_emit = new Object();
            window.learn_draw.realtime_emit.el = 'path';
            window.learn_draw.realtime_emit.id = 'el_'+element_id;
            
            if(window.learn_draw.registered_ids.indexOf('el_'+element_id) >= 0) {
                var path = document.getElementById('el_'+element_id);
                var d = path.getAttributeNS(null, 'd');
                var add_value = 'L' + real_x + ',' + real_y;
                window.learn_draw.realtime_emit.is_new = false;
                window.learn_draw.realtime_emit.coord = add_value;
                window.learn_draw.realtime_emit.x = real_x;
                window.learn_draw.realtime_emit.y = real_y;
                window.learn_draw.socketEmit('draw', window.learn_draw.realtime_emit);
                d += add_value;
                path.setAttributeNS(null, 'd', d);
            } else {
                // create element
                window.learn_draw.registered_ids.push('el_'+element_id);
                var path = document.createElementNS(window.learn_draw.svgNS, "path");
                path.setAttributeNS(null, "id", 'el_'+element_id);
                path.setAttributeNS(null, "d", this.pathStart);
                
                window.learn_draw.realtime_emit.is_new = true;
                window.learn_draw.realtime_emit.coord = this.pathStart;
                
                this.addDrawElementAttributes(path, additional);
                window.learn_draw.socketEmit('draw', window.learn_draw.realtime_emit);
                window.learn_draw.element_params = window.learn_draw.realtime_emit;
                document.getElementById(window.learn_draw.svg_id).appendChild(path);
            }
        },
        drawCircle: function(element_id, event) {
            var real_x = this.getRealCoord(event, 'x');
            var real_y = this.getRealCoord(event, 'y');
            window.learn_draw.realtime_emit = new Object();
            window.learn_draw.realtime_emit.el = 'circle';
            window.learn_draw.realtime_emit.id = 'el_'+element_id;
            
            if(window.learn_draw.registered_ids.indexOf('el_'+element_id) >= 0) {
                var cx = jQuery('#el_' + element_id).attr('cx');
//                console.log(cx);
//                var radius_final = Math.abs(real_x - cx.animVal.value);
                var radius_final = Math.abs(real_x - cx);
                var circle = document.getElementById('el_'+element_id);
                circle.setAttributeNS(null, 'r', radius_final);
                
                window.learn_draw.realtime_emit.is_new = false;
                window.learn_draw.realtime_emit.r = radius_final;
                window.learn_draw.realtime_emit.x = real_x;
                window.learn_draw.realtime_emit.y = real_y;
                window.learn_draw.socketEmit('draw', window.learn_draw.realtime_emit);
            } else {
                // create element
                window.learn_draw.registered_ids.push('el_'+element_id);
                var circle = document.createElementNS(window.learn_draw.svgNS, "circle");
                circle.setAttributeNS(null, "id", 'el_'+element_id);
                circle.setAttributeNS(null, "cx", real_x);
                circle.setAttributeNS(null, "cy", real_y);
                circle.setAttributeNS(null, "r", 0);

                window.learn_draw.realtime_emit.is_new = true;
                window.learn_draw.realtime_emit.cx = real_x;
                window.learn_draw.realtime_emit.cy = real_y;
                window.learn_draw.realtime_emit.r = 0;
                
                
                this.addDrawElementAttributes(circle);
                window.learn_draw.socketEmit('draw', window.learn_draw.realtime_emit);
                window.learn_draw.element_params = window.learn_draw.realtime_emit;
                document.getElementById(window.learn_draw.svg_id).appendChild(circle);
            }
        },
        drawRect: function(element_id, event) {
            var real_x = this.getRealCoord(event, 'x');
            var real_y = this.getRealCoord(event, 'y');
            window.learn_draw.realtime_emit = new Object();
            window.learn_draw.realtime_emit.el = 'rect';
            window.learn_draw.realtime_emit.id = 'el_'+element_id;
            
            if(window.learn_draw.registered_ids.indexOf('el_'+element_id) >= 0) {
                var x = jQuery('#el_' + element_id).attr('x');
                var y = jQuery('#el_' + element_id).attr('y');
//                var x = jQuery('#el_' + element_id).attr('x').animVal.value;
//                var y = jQuery('#el_' + element_id).attr('y').animVal.value;
                
                var rect = document.getElementById('el_'+element_id);
                
                var width = real_x - x;
                var height = real_y - y;
                if(width>0 && height>0) {
                    rect.setAttributeNS(null, 'width', width);
                    rect.setAttributeNS(null, 'height', height);
                    window.learn_draw.realtime_emit.width = width;
                    window.learn_draw.realtime_emit.height = height;
                    window.learn_draw.realtime_emit.is_new = false;
                    window.learn_draw.realtime_emit.x = real_x;
                    window.learn_draw.realtime_emit.y = real_y;
                    window.learn_draw.socketEmit('draw', window.learn_draw.realtime_emit);
                } else {
                    return;
                }
            } else {
                // create element
                window.learn_draw.registered_ids.push('el_'+element_id);
                var rect = document.createElementNS(window.learn_draw.svgNS, "rect");
                rect.setAttributeNS(null, "id", 'el_'+element_id);
                rect.setAttributeNS(null, "x", real_x);
                rect.setAttributeNS(null, "y", real_y);
                rect.setAttributeNS(null, "width", 0);
                rect.setAttributeNS(null, "height", 0);
                
                window.learn_draw.realtime_emit.x = real_x;
                window.learn_draw.realtime_emit.y = real_y;
                window.learn_draw.realtime_emit.width = 0;
                window.learn_draw.realtime_emit.height = 0;
                window.learn_draw.realtime_emit.is_new = true;
                
                this.addDrawElementAttributes(rect);
                window.learn_draw.socketEmit('draw', window.learn_draw.realtime_emit);
                window.learn_draw.element_params = window.learn_draw.realtime_emit;
                document.getElementById(window.learn_draw.svg_id).appendChild(rect);
            }
        },
        drawLine: function(element_id, event) {
            var real_x = this.getRealCoord(event, 'x');
            var real_y = this.getRealCoord(event, 'y');
            window.learn_draw.realtime_emit = new Object();
            window.learn_draw.realtime_emit.el = 'line';
            window.learn_draw.realtime_emit.id = 'el_'+element_id;
            
            if(window.learn_draw.registered_ids.indexOf('el_'+element_id) >= 0) {
                var line = document.getElementById('el_'+element_id);
                line.setAttributeNS(null, 'x2', real_x);
                line.setAttributeNS(null, 'y2', real_y);
                window.learn_draw.realtime_emit.x2 = real_x;
                window.learn_draw.realtime_emit.y2 = real_y;
                window.learn_draw.realtime_emit.is_new = false;
                window.learn_draw.socketEmit('draw', window.learn_draw.realtime_emit);
            } else {
                // create element
                window.learn_draw.registered_ids.push('el_'+element_id);
                var line = document.createElementNS(window.learn_draw.svgNS, "line");
                line.setAttributeNS(null, "id", 'el_'+element_id);
                line.setAttributeNS(null, "x1", real_x);
                line.setAttributeNS(null, "y1", real_y);
                line.setAttributeNS(null, "x2", real_x);
                line.setAttributeNS(null, "y2", real_y);
                window.learn_draw.realtime_emit.x1 = real_x;
                window.learn_draw.realtime_emit.y1 = real_y;
                window.learn_draw.realtime_emit.x2 = real_x;
                window.learn_draw.realtime_emit.y2 = real_y;
                window.learn_draw.realtime_emit.is_new = true;
                this.addDrawElementAttributes(line);
                window.learn_draw.socketEmit('draw', window.learn_draw.realtime_emit);
                window.learn_draw.element_params = window.learn_draw.realtime_emit;
                document.getElementById(window.learn_draw.svg_id).appendChild(line);
            }
        },
        // setting default values to draw elements
        addDrawElementAttributes: function(element, additional) {
            element.setAttributeNS(null, "fill", 'none');
            if(additional !== undefined && additional.hasOwnProperty('styles')) {
                element.setAttributeNS(null, "style", additional.styles);
                window.learn_draw.realtime_emit.styles = additional.styles;
            }
            if(additional !== undefined && additional.hasOwnProperty('stroke')) {
                element.setAttributeNS(null, "stroke", additional.stroke);
                window.learn_draw.realtime_emit.stroke = additional.stroke;
            } else {
                element.setAttributeNS(null, "stroke", window.learn_draw.current_color);
                window.learn_draw.realtime_emit.stroke = window.learn_draw.current_color;
            }
            if(additional !== undefined && additional.hasOwnProperty('stroke_width')) {
                element.setAttributeNS(null, "stroke-width", additional.stroke_width);
                window.learn_draw.realtime_emit.stroke_width = additional.stroke_width;
            } else {
                element.setAttributeNS(null, "stroke-width", window.learn_draw.stroke_width);
                window.learn_draw.realtime_emit.stroke_width = window.learn_draw.stroke_width;
            }
        }
    },
    sendMousePointer: function(event) {
        var real_x = event.clientX + jQuery(window).scrollLeft();;
        var real_y = event.clientY + jQuery(window).scrollTop();;
        
        window.learn_draw.realtime_emit = new Object();
        window.learn_draw.realtime_emit.el = 'cursor';
        window.learn_draw.realtime_emit.x = real_x;
        window.learn_draw.realtime_emit.y = real_y;
        window.learn_draw.socketEmit('save_draw_element', window.learn_draw.realtime_emit);
    },
    doDrawing: function(event) {
        switch(this.current_instrument) {
            case 'path':
                this.instruments.drawPath(this.element_id, event, {
                    'styles': '-webkit-tap-highlight-color: rgba(0, 0, 0, 0)'
                });
                break;
            case 'circle':
                this.instruments.drawCircle(this.element_id, event);
                break;
            case 'rect':
                this.instruments.drawRect(this.element_id, event);
                break;
            case 'line':
                this.instruments.drawLine(this.element_id, event);
                break;
            case 'highlighter':
                this.instruments.drawPath(this.element_id, event, {
                    'styles': 'stroke-opacity: 0.2', 
                    'stroke_width': '15'
                });
                break;
            case 'eraser':
                this.instruments.drawPath(this.element_id, event, {
                    'stroke': 'white', 
                    'stroke_width': '5'
                });
                break;
        }
    },
    startDrawingEvent: function(event) {
        this.generateElementId();
        switch(this.current_instrument) {
            case 'path':
            case 'highlighter':
            case 'eraser':
                // setting moveto for path
                window.learn_draw.instruments.pathStart = 'M'+(event.clientX - this.svg_left + jQuery(window).scrollLeft())+','+(event.clientY - this.svg_top + jQuery(window).scrollTop());
                break;
            case 'circle':
                break;
            case 'rect':
                break;
            case 'line':
                break;
        }
    },
    stopDrawingEvent: function(event) {
        this.sendSaveData();
        this.element_id = '';
    },
    sendSaveData: function() {
        var element = document.getElementById('el_'+this.element_id);
        switch(this.current_instrument) {
            case 'path':
            case 'highlighter':
            case 'eraser':
                var d = element.getAttributeNS(null, 'd');
                window.learn_draw.element_params.coord = d;
                break;
            case 'circle':
                var r = element.getAttributeNS(null, 'r');
                window.learn_draw.element_params.r = r;
                break;
            case 'rect':
                var width = element.getAttributeNS(null, 'width');
                var height = element.getAttributeNS(null, 'height');
                window.learn_draw.element_params.width = width;
                window.learn_draw.element_params.height = height;
                break;
            case 'line':
                var x2 = element.getAttributeNS(null, 'x2');
                var y2 = element.getAttributeNS(null, 'y2');
                window.learn_draw.element_params.x2 = x2;
                window.learn_draw.element_params.y2 = y2;
                break;
        }
//        console.log(window.learn_draw.element_params);
        window.learn_draw.socketEmit('save_draw_element', window.learn_draw.element_params);
    },
    generateElementId: function() {
        this.element_id = parseInt(Math.random() * 9999999999999999);
    },
    // setters
    setCurrentColor: function(color) {
        this.current_color = color;
    },
    setCurrentInstrument: function(instrument) {
        this.current_instrument = instrument;
    }
}