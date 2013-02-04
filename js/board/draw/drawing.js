window.learn_draw = {
    colors: ['#EB3636', '#78E66E', 'blue', 'black'],
    available_instruments: ['colorpicker', 'path', 'eraser', 'line', 'circle', 'rect', 'text', 'highlighter', 'image', 'grid'],
    current_instrument: [],
    current_tabs: [],
    current_color: [], // drawing color
    stroke_width: [],
    is_drawing: false, // flag
    svg_id: 'current_svg', // id of svg html element
    svg_class: 'learn_svg',
    svg_top: 0, // top coord of svg html element
    svg_left: 0, // left coord of svg html element
    element_id: '', // unique id of the current element (line, path, circle etc..)
    svgNS: "http://www.w3.org/2000/svg", // used to create svg elements
    registered_ids: [], // id attributes of all svg elements
    realtime_emit: null, // an object that is gathering data and is sent to node.js
    element_params: '', // holds the element parameters (used to send data to node.js for saving)
    history_svg: [], // when svg's come from friend store them here
    stored_tab_html: '', // storing html data that is comming from ajax for repeated uses
    
    init: function() {
        this.createTab('wb1_1', 'New file', 'history');
        this.bindEvents();
    },
    bindEvents: function() {
        // set tab events: close tab, switch tab, rename tab
        this.setTabEvents();
    },
    setDefaults: function(unique_id) {
        this.current_instrument[unique_id] = 'path';
        this.current_color[unique_id] = '#000000';
        this.stroke_width[unique_id] = '1';
    },
    setTabEvents: function() {
        // when tab's x is clicked
        this.bindDeleteTabEvent();
        
        // add blank tab
        jQuery('.wb1_add_blank_file').click(function() {
            // generating unique id
            var unique_id = parseInt(Math.random() * 9999999999999999);
            var tab_name = 'New file';
            window.learn_draw.createTab(unique_id, tab_name);
        });
    },
    bindDeleteTabEvent:function(sheet_id, caller) {
        if(caller == 'socket') {
            this.deleteTab(sheet_id, caller);
        } else {
            jQuery('.delete_wb1_sheet').unbind('click'); // unbind click from these elements to avoid multiplication of events
            jQuery('.delete_wb1_sheet').click(function(){
                var sheet_id = jQuery(this).parent().parent().attr('data-draw-id');
                window.learn_draw.deleteTab(sheet_id);
            });
        }
    },
    deleteTab: function(sheet_id, caller) {
        var index = this.current_tabs.indexOf(sheet_id);
        this.current_tabs.splice(index, 1);
        if(caller === undefined) {
            window.socket_object.emit('wb1_tab_delete', {
                sheet_id: sheet_id
            });
        }
        jQuery('#file_name_'+sheet_id).parent().remove(); // delete the tab
        jQuery('#wb1_board_item_'+sheet_id).remove();
        
        delete this.current_instrument[sheet_id];
        delete this.current_color[sheet_id];
        delete this.stroke_width[sheet_id];
        
        if(jQuery('.active_wp1_tab').length == 0) {
            var last_tab_sheet_id = jQuery(jQuery('.tab_div_wb1')[jQuery('.tab_div_wb1').length-1]).attr('data-draw-id');
            window.learn_draw.switchTab(last_tab_sheet_id);
        }
    },
    switchTab: function(sheet_id) {
        if(window.board_manager.is_teacher) {
            var send_obj = {};
            send_obj.sheet_id = sheet_id;
            if(window.board_manager.teacher_force_sync) {
                send_obj.zone_id = sheet_id;
            }
            window.socket_object.emit('wb1_teacher_tab', send_obj);
        }
        
        
        // inactivate all tabs
        jQuery('.active_wp1_tab').removeClass('active_wp1_tab');
        // set active the clicked tab
        jQuery('#file_name_'+sheet_id).parent().addClass('active_wp1_tab');
        // hidding tab contents
        jQuery('.wb1_board_item').hide();
        // showing contend of selected tab
        jQuery('#wb1_board_item_'+sheet_id).show();
    },
    // switch tabs when clicked
    bindTabSwitcher: function() {
        jQuery('#wb1_items_tabs div').unbind('click'); // unbind click from these elements to avoid multiplication of events
        jQuery('#wb1_items_tabs div').click(function() {
            var sheet_id = jQuery(this).attr('data-draw-id');
            if(window.board_manager.is_teacher) {
                window.socket_object.emit('wb1_teacher_tab', {
                    sheet_id: sheet_id
                });
            }
            window.learn_draw.switchTab(sheet_id);
        });
    },
    createTab: function(unique_id, tab_name, caller, file_name) {
        if(jQuery('#file_name_'+unique_id).length > 0) {
            return false;
        }
        this.current_tabs.push(unique_id.toString());
        if(caller === undefined) { // if caller!='socket' send socket
            window.socket_object.emit('wb1_tab_create', {
                tab_name: tab_name, 
                unique_id: unique_id, 
                file_name: file_name
            });
        }
        // create tab
        jQuery('#wb1_items_tabs').append('<div class="tab_div_wb1" data-draw-id="'+unique_id+'"><span id="file_name_'+unique_id+'">'+tab_name+'</span> <sup><a href="javascript:;" class="delete_wb1_sheet">x</a></sup></div>');
        // create tab content
        if(file_name === undefined && this.stored_tab_html != '') {
            console.log('creating tab from memory wb1');
            window.learn_draw.setTabBindings(this.stored_tab_html, unique_id);
        } else {
            jQuery.ajax({
                url: "ajax",
                data: "todo=get_wb1_generic&file_name="+file_name,
                type: "get",
                async: false,
                beforeSend: function() {
                // loadior here
                },
                success: function(data) {
                    if(file_name === undefined) {
                        window.learn_draw.stored_tab_html = data;
                    }
                    window.learn_draw.setTabBindings(data, unique_id);
                }
            });
        }
        
    },
    setTabBindings: function(data, unique_id) {
        // setting zone id, i.e board id, so we could know where are we working
        data = data.replace(/%zone_id%/g, unique_id);
        jQuery('.wb1_board_subfiles').append('<div id="wb1_board_item_'+unique_id+'" class="wb1_board_item">'+data+'</div>');
        jQuery('.wb1_board_item').hide(); // hide all wb3 boards
        jQuery('#wb1_board_item_'+unique_id).show(); // showing created board
        // getting position of svg element
        if(window.learn_draw.svg_top == 0 && jQuery('.'+window.learn_draw.svg_class).length) {
            window.learn_draw.svg_top = jQuery('.'+window.learn_draw.svg_class).position().top;
            window.learn_draw.svg_left = jQuery('.'+window.learn_draw.svg_class).position().left;
        }
        // draw available colors
        window.learn_draw.initColors(unique_id);
        // init instruments
        window.learn_draw.initInstruments();
        if(window.learn_draw.history_svg[unique_id] !== undefined) {
            jQuery('#svg_'+unique_id).remove();
            jQuery('#svg_holder_'+unique_id).html(window.learn_draw.history_svg[unique_id]);
        }
        // init svg
        window.learn_draw.initSvg(unique_id);
        // init stroke width
        window.learn_draw.initStrokeWidth();
        // mouse hidder
        window.learn_draw.mouseHidder();
        window.learn_draw.bindDeleteTabEvent();
        window.learn_draw.bindTabSwitcher();
        window.learn_draw.bindFileSaver();
        // default color, thickness, etc
        window.learn_draw.setDefaults(unique_id);
        window.learn_draw.switchTab(unique_id);
    },
    renameTab: function(zone_id, tab_name) {
        jQuery('#file_name_'+zone_id).html(tab_name); // setting tab filename
        window.board_manager.bindTreeviewer();
    },
    bindFileSaver: function() {
        jQuery('.save_svg').unbind('click');
        jQuery('.save_svg').click(function() {
            var zone_id = jQuery(this).attr('data-draw-id');
            window.learn_draw.saveFile(zone_id);
        });
    },
    saveFile: function(zone_id) {
        var file_name = jQuery('#file_name_'+zone_id).html(); // getting filename (tab name)
        var serializer = new XMLSerializer();
        var file_content = serializer.serializeToString(document.getElementById('svg_'+zone_id));
        
        var namespace = jQuery('#global_namespace').val();
        if(!file_name.match(/^[0-9a-zA-Z.\._]+$/)) {
            file_name = window.prompt('Please give a file name. The file should not contain spaces. Ex: index.html OR product.php');
            if(file_name === null) { // cancel pressed
                return false;
            }
            if(!file_name.match(/^[0-9a-zA-Z.\._]+$/)) {
                this.saveFile(zone_id); // while filename is invalid call itself recursevly
                return false;
            }
        }
        jQuery.ajax({
            url: "ajax",
            data: "todo=save_svg_file&file_name="+file_name+'&namespace='+namespace+'&file_content='+encodeURIComponent(file_content),
            type: "post",
            beforeSend: function() {
                // loadior here
            },
            error: function(error_obj) {
                /**
                 * @todo
                 * take actions in case of error
                 */
            },
            success: function(data) {
                var json = JSON.parse(data);
                if(json.status == 'ok') {
                    window.socket_object.emit('wb1_file_name_change', {zone_id: zone_id, file_name: file_name});
                    window.learn_draw.renameTab(zone_id, file_name);
                } else {
                    alert('An error had accured.');
                }
            }
        });
    },
    mouseHidder: function() {
        jQuery('.board_cursor').css({
            'display':'none'
        });
        var cursor_id = jQuery('div').filter(function() {
            return this.id.match(/curs_el_/);
        }).attr('id');
        delete window.client_drawer.registered_cursors[window.client_drawer.registered_cursors.indexOf(cursor_id)];
        jQuery('div').filter(function() {
            return this.id.match(/curs_el_/);
        }).remove();
    
        setTimeout(function() {
            window.learn_draw.mouseHidder();
        }, 6000);
    },
    socketEmit: function(ident, object) {
        window.socket_object.emit(ident, object);
    },
    initStrokeWidth: function() {
        jQuery('.learn_stroke_width').click(function() {
            window.learn_draw.stroke_width[jQuery(this).attr('data-draw-id')] = jQuery(this).attr('data-value');
        });
    },
    initColors: function (unique_id) {
        // populate colors
        var colors_html = '';
        for(var i=0;i<this.colors.length;i++) {
            colors_html += '<div data-draw-id="'+unique_id+'" style="background-color: '+this.colors[i]+'" class="colorpicker_item" data-color="'+this.colors[i]+'"></div>';
        }
        jQuery('#learn_colors_'+unique_id).html(colors_html);
        jQuery('.colorpicker_item').unbind('click');
        jQuery('.colorpicker_item').click(function() {
            window.learn_draw.setCurrentColor(jQuery(this).attr('data-color'), jQuery(this).attr('data-draw-id'));
        });
    },
    initInstruments: function() {
        jQuery('.learn_instrument').unbind('click'); // avoid dublicate events
        jQuery('.learn_instrument').click(function() {
            window.learn_draw.setCurrentInstrument(jQuery(this).attr('data-type'), jQuery(this).attr('data-draw-id'));
        })
    },
    initSvg: function(unique_id) {
        jQuery('.learn_svg').unbind('mousedown');
        jQuery('.learn_svg').unbind('mouseup');
        jQuery('.learn_svg').unbind('mousemove');
        // setting is_drawing flag
        jQuery('.learn_svg').mousedown(function(event){
            window.learn_draw.is_drawing = true;
            window.learn_draw.startDrawingEvent(event, jQuery(this).attr('data-draw-id'));
        });
        jQuery('.learn_svg').mouseup(function(event){
            window.learn_draw.is_drawing = false;
            window.learn_draw.stopDrawingEvent(event, jQuery(this).attr('data-draw-id'));
        });
        
        jQuery('body').mousemove(function(event){
            if(event.ctrlKey || window.board_manager.teacher_force_mouse) {
                window.learn_draw.sendMousePointer(event);
            }
            if(window.learn_draw.is_drawing) {
                if(jQuery(event.target).attr('class') == window.learn_draw.svg_class) { // check if mouse is moving inside the svg
                    window.learn_draw.doDrawing(event, jQuery(event.target).attr('data-draw-id'));
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
        drawPath: function(zone_id, element_id, event, additional) {
            var real_x = this.getRealCoord(event, 'x');
            var real_y = this.getRealCoord(event, 'y');
            window.learn_draw.realtime_emit = new Object();
            window.learn_draw.realtime_emit.el = 'path';
            window.learn_draw.realtime_emit.id = 'el_'+element_id;
            window.learn_draw.realtime_emit.tab_id = zone_id;
            
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
                
                this.addDrawElementAttributes(zone_id, path, additional);
                window.learn_draw.socketEmit('draw', window.learn_draw.realtime_emit);
                window.learn_draw.element_params = window.learn_draw.realtime_emit;
                document.getElementById('svg_'+zone_id).appendChild(path);
            }
        },
        drawCircle: function(zone_id, element_id, event) {
            var real_x = this.getRealCoord(event, 'x');
            var real_y = this.getRealCoord(event, 'y');
            window.learn_draw.realtime_emit = new Object();
            window.learn_draw.realtime_emit.el = 'circle';
            window.learn_draw.realtime_emit.id = 'el_'+element_id;
            window.learn_draw.realtime_emit.tab_id = zone_id;
            
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
                
                
                this.addDrawElementAttributes(zone_id, circle);
                window.learn_draw.socketEmit('draw', window.learn_draw.realtime_emit);
                window.learn_draw.element_params = window.learn_draw.realtime_emit;
                document.getElementById('svg_'+zone_id).appendChild(circle);
            }
        },
        drawRect: function(zone_id, element_id, event) {
            var real_x = this.getRealCoord(event, 'x');
            var real_y = this.getRealCoord(event, 'y');
            window.learn_draw.realtime_emit = new Object();
            window.learn_draw.realtime_emit.el = 'rect';
            window.learn_draw.realtime_emit.id = 'el_'+element_id;
            window.learn_draw.realtime_emit.tab_id = zone_id;
            
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
                
                this.addDrawElementAttributes(zone_id, rect);
                window.learn_draw.socketEmit('draw', window.learn_draw.realtime_emit);
                window.learn_draw.element_params = window.learn_draw.realtime_emit;
                document.getElementById('svg_'+zone_id).appendChild(rect);
            }
        },
        drawLine: function(zone_id, element_id, event) {
            var real_x = this.getRealCoord(event, 'x');
            var real_y = this.getRealCoord(event, 'y');
            window.learn_draw.realtime_emit = new Object();
            window.learn_draw.realtime_emit.el = 'line';
            window.learn_draw.realtime_emit.id = 'el_'+element_id;
            window.learn_draw.realtime_emit.tab_id = zone_id;
            
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
                this.addDrawElementAttributes(zone_id, line);
                window.learn_draw.socketEmit('draw', window.learn_draw.realtime_emit);
                window.learn_draw.element_params = window.learn_draw.realtime_emit;
                document.getElementById('svg_'+zone_id).appendChild(line);
            }
        },
        // setting default values to draw elements
        addDrawElementAttributes: function(zone_id, element, additional) {
            element.setAttributeNS(null, "fill", 'none');
            if(additional !== undefined && additional.hasOwnProperty('styles')) {
                element.setAttributeNS(null, "style", additional.styles);
                window.learn_draw.realtime_emit.styles = additional.styles;
            }
            if(additional !== undefined && additional.hasOwnProperty('stroke')) {
                element.setAttributeNS(null, "stroke", additional.stroke);
                window.learn_draw.realtime_emit.stroke = additional.stroke;
            } else {
                element.setAttributeNS(null, "stroke", window.learn_draw.current_color[zone_id]);
                window.learn_draw.realtime_emit.stroke = window.learn_draw.current_color[zone_id];
            }
            if(additional !== undefined && additional.hasOwnProperty('stroke_width')) {
                element.setAttributeNS(null, "stroke-width", additional.stroke_width);
                window.learn_draw.realtime_emit.stroke_width = additional.stroke_width;
            } else {
                element.setAttributeNS(null, "stroke-width", window.learn_draw.stroke_width[zone_id]);
                window.learn_draw.realtime_emit.stroke_width = window.learn_draw.stroke_width[zone_id];
            }
        }
    },
    sendMousePointer: function(event) {
        var real_x = event.clientX + jQuery(window).scrollLeft();
        var real_y = event.clientY + jQuery(window).scrollTop();
        
        window.learn_draw.realtime_emit = new Object();
        window.learn_draw.realtime_emit.el = 'cursor';
        window.learn_draw.realtime_emit.x = real_x;
        window.learn_draw.realtime_emit.y = real_y;
        window.learn_draw.socketEmit('save_draw_element', window.learn_draw.realtime_emit);
    },
    doDrawing: function(event, svg_id) {
        switch(this.current_instrument[svg_id]) {
            case 'path':
                this.instruments.drawPath(svg_id, this.element_id, event, {
                    'styles': '-webkit-tap-highlight-color: rgba(0, 0, 0, 0)'
                });
                break;
            case 'circle':
                this.instruments.drawCircle(svg_id, this.element_id, event);
                break;
            case 'rect':
                this.instruments.drawRect(svg_id, this.element_id, event);
                break;
            case 'line':
                this.instruments.drawLine(svg_id, this.element_id, event);
                break;
            case 'highlighter':
                this.instruments.drawPath(svg_id, this.element_id, event, {
                    'styles': 'stroke-opacity: 0.2', 
                    'stroke_width': '15'
                });
                break;
            case 'eraser':
                this.instruments.drawPath(svg_id, this.element_id, event, {
                    'stroke': 'white', 
                    'stroke_width': '5'
                });
                break;
        }
    },
    startDrawingEvent: function(event, svg_id) {
        this.generateElementId();
        switch(this.current_instrument[svg_id]) {
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
    stopDrawingEvent: function(event, svg_id) {
        this.sendSaveData(svg_id);
        this.element_id = '';
    },
    sendSaveData: function(svg_id) {
        var element = document.getElementById('el_'+this.element_id);
        window.learn_draw.element_params.tab_id = svg_id;
        switch(this.current_instrument[svg_id]) {
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
    // indicates the active teacher tab
    teacherTabIndicator: function(data) {
        jQuery('div#wb1_items_tabs > .teacher_active_tab').removeClass('teacher_active_tab');
        jQuery('#file_name_'+data.sheet_id).parent().addClass('teacher_active_tab');
        if(data.zone_id !== undefined) {
            this.switchTab(data.zone_id);
        }
    },
    generateElementId: function() {
        this.element_id = parseInt(Math.random() * 9999999999999999);
    },
    // setters
    setCurrentColor: function(color, svg_id) {
        this.current_color[svg_id] = color;
    },
    setCurrentInstrument: function(instrument, svg_id) {
        this.current_instrument[svg_id] = instrument;
    },
    // gets current board content for helping other
    getAllContents: function() {
        var contents_object = new Object();
        var final_result = new Array();
        var cnt_tabs = this.current_tabs.length;
        var unique_id = '';
        var serializer = new Object();
        for (var i = 0; i < cnt_tabs; i++) {
            unique_id = this.current_tabs[i].toString();
            contents_object = new Object();
            contents_object.tab_name = jQuery('#file_name_'+unique_id).html();
            contents_object.unique_id = unique_id;
            serializer = new XMLSerializer();
            contents_object.svg_data = serializer.serializeToString(document.getElementById('svg_'+unique_id));
            final_result.push(contents_object);
        }
        
        return final_result;
    },
    createBoardFromHistory: function(data) {
        // create tabs, svgs
        for (var i = 0; i < data.length; i++) {
            this.history_svg[data[i].unique_id.toString()] = data[i].svg_data;
        }
        
        this.deleteTab('wb1_1', 'history');
        
        for (var i = 0; i < data.length; i++) {
            this.createTab(data[i].unique_id, data[i].tab_name, 'history', data.file_name);
        }
        
    },
    closeBoard: function() {
        this.svg_top = 0;
        this.svg_left = 0;
        this.registered_ids = [];
        this.history_svg = [];
        
        while(this.current_tabs.length) {
            this.deleteTab(this.current_tabs[0], 'redraw');
        }
    }
}