window.client_drawer = Object();
window.client_drawer = {
    registered_cursors: [], // list of cursors in page
    doDrawing: function(data) {
        switch(data.el) {
            case 'path':
                this.drawPath(data);
                break;
            case 'circle':
                this.drawCircle(data);
                break;
            case 'line':
                this.drawLine(data);
                break;
            case 'rect':
                this.drawRect(data);
                break;
            case 'cursor':
                this.drawCursor(data);
                break;
        }
    },
    drawPath: function(data) {
        if(data.is_new) {
            var path = document.createElementNS(window.learn_draw.svgNS, "path");
            path.setAttributeNS(null, "id", data.id);
            path.setAttributeNS(null, "d", data.coord);
                
            this.addDrawElementAttributes(path, data);
            document.getElementById('svg_'+data.tab_id).appendChild(path);
        } else {
            var path = document.getElementById(data.id);
            var d = path.getAttributeNS(null, 'd');
            d += data.coord;
            path.setAttributeNS(null, 'd', d);
            this.drawCursor({
                x:data.x+window.learn_draw.svg_left, 
                y:data.y+window.learn_draw.svg_top, 
                id: 'curs_'+data.id,
                tab_id: data.tab_id
            }); // show cursor while drawing
        }
    },
    drawCircle: function(data) {
        if(data.is_new) {
            var circle = document.createElementNS(window.learn_draw.svgNS, "circle");
            circle.setAttributeNS(null, "id", data.id);
            circle.setAttributeNS(null, "cx", data.cx);
            circle.setAttributeNS(null, "cy", data.cy);
            if(data.hasOwnProperty('r')) {
                circle.setAttributeNS(null, "r", data.r);
            } else {
                circle.setAttributeNS(null, "r", 0);
            }
                
            this.addDrawElementAttributes(circle, data);
            document.getElementById('svg_'+data.tab_id).appendChild(circle);
        } else {
            var circle = document.getElementById(data.id);
            circle.setAttributeNS(null, 'r', data.r);
            this.drawCursor({
                x:data.x+window.learn_draw.svg_left, 
                y:data.y+window.learn_draw.svg_top, 
                id: 'curs_'+data.id,
                tab_id: data.tab_id
            }); // show cursor while drawing
        }
    },
    drawLine: function(data) {
        if(data.is_new) {
            var line = document.createElementNS(window.learn_draw.svgNS, "line");
            line.setAttributeNS(null, "id", data.id);
            line.setAttributeNS(null, "x1", data.x1);
            line.setAttributeNS(null, "y1", data.y1);
            line.setAttributeNS(null, "x2", data.x2);
            line.setAttributeNS(null, "y2", data.y2);
                
            this.addDrawElementAttributes(line, data);
            document.getElementById('svg_'+data.tab_id).appendChild(line);
        } else {
            var line = document.getElementById(data.id);
            line.setAttributeNS(null, "x2", data.x2);
            line.setAttributeNS(null, "y2", data.y2);
            this.drawCursor({
                x:data.x2+window.learn_draw.svg_left, 
                y:data.y2+window.learn_draw.svg_top, 
                id: 'curs_'+data.id,
                tab_id: data.tab_id
            }); // show cursor while drawing
        }
    },
    drawRect: function(data) {
        if(data.is_new) {
            var rect = document.createElementNS(window.learn_draw.svgNS, "rect");
            rect.setAttributeNS(null, "id", data.id);
            rect.setAttributeNS(null, "x", data.x);
            rect.setAttributeNS(null, "y", data.y);
            rect.setAttributeNS(null, "width", data.width);
            rect.setAttributeNS(null, "height", data.height);
                
            this.addDrawElementAttributes(rect, data);
            document.getElementById('svg_'+data.tab_id).appendChild(rect);
        } else {
            var rect = document.getElementById(data.id);
            rect.setAttributeNS(null, "width", data.width);
            rect.setAttributeNS(null, "height", data.height);
            this.drawCursor({
                x:data.x+window.learn_draw.svg_left, 
                y:data.y+window.learn_draw.svg_top, 
                id: 'curs_'+data.id,
                tab_id: data.tab_id
            }); // show cursor while drawing
        }
    },
    drawCursor: function(data) {
//        if(jQuery('.active_learn_tab').attr('id') == 'tab_draw' && jQuery('.active_wp1_tab').attr('data-draw-id') == data.tab_id) {
            if(window.client_drawer.registered_cursors.indexOf(data.id) >= 0) { // the cursor already exists
                jQuery('#'+data.id).css({
                    'top':(data.y-12), 
                    'left':(data.x-2), 
                    'display':'block'
                });
            } else {
                window.client_drawer.registered_cursors.push(data.id);
                jQuery('body').append('<div class="board_cursor" id="'+data.id+'"></div>');
            }
//        }
    },
    addDrawElementAttributes: function(element, additional) {
        element.setAttributeNS(null, "fill", 'none');
        if(additional !== undefined && additional.hasOwnProperty('styles')) {
            element.setAttributeNS(null, "style", additional.styles);
        }
        if(additional !== undefined && additional.hasOwnProperty('stroke')) {
            element.setAttributeNS(null, "stroke", additional.stroke);
        } else {
            element.setAttributeNS(null, "stroke", window.learn_draw.current_color);
        }
        if(additional !== undefined && additional.hasOwnProperty('stroke_width')) {
            element.setAttributeNS(null, "stroke-width", additional.stroke_width);
        } else {
            element.setAttributeNS(null, "stroke-width", window.learn_draw.stroke_width);
        }
    },
    reDrawBoard: function(data) {
        jQuery('#loading').show();
        var cnt = data.length;
        var obj = new Object();
        var json = new Object();
        for (var i = 0;i < cnt;i++) {
            obj = new Object();
            obj.id = data[i].figure_id;
            obj.is_new = true;
            obj.el = data[i].figure_name;
            obj.tab_id = data[i].tab_id;
            
            switch(data[i].figure_name) {
                case 'path':
                    obj.coord = data[i].param_8;
                    obj.stroke_width = data[i].param_1;
                    obj.stroke = data[i].param_6;
                    obj.styles = data[i].param_7;
                    this.doDrawing(obj);
                    break;
                case 'circle':
                    obj.cx = data[i].param_1;
                    obj.cy = data[i].param_2;
                    obj.r = data[i].param_3;
                    obj.stroke_width = data[i].param_4;
                    obj.stroke = data[i].param_6;
                    this.doDrawing(obj);
                    break;
                case 'line':
                    obj.x1 = data[i].param_1;
                    obj.y1 = data[i].param_2;
                    obj.x2 = data[i].param_3;
                    obj.y2 = data[i].param_4;
                    
                    obj.stroke_width = data[i].param_5;
                    obj.stroke = data[i].param_6;
                    this.doDrawing(obj);
                    break;
                case 'rect':
                    obj.x = data[i].param_1;
                    obj.y = data[i].param_2;
                    obj.width = data[i].param_3;
                    obj.height = data[i].param_4;
                    
                    obj.stroke_width = data[i].param_5;
                    obj.stroke = data[i].param_6;
                    this.doDrawing(obj);
                    break;
                case 'wb1_tab_create':
                    console.log('creating tab: '+data[i].tab_id);
                    json = JSON.parse(data[i].param_8);
                    window.learn_draw.createTab(data[i].tab_id, json.tab_name, 'socket');
                    break;
                case 'wb1_tab_delete':
                    console.log('deleting tab: '+data[i].tab_id);
                    window.learn_draw.deleteTab(data[i].tab_id, 'socket');
                    break;
                case 'wb1_tab_rename':
                    json = JSON.parse(data[i].param_8);
                    window.learn_draw.renameTab(data[i].tab_id, json.file_name);
                    break;
            }
        }
        jQuery('#loading').hide();
    }
}