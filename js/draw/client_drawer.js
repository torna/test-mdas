window.client_drawer = Object();
window.client_drawer = {
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
        }
    },
    drawPath: function(data) {
        if(data.is_new) {
            var path = document.createElementNS(window.learn_draw.svgNS, "path");
            path.setAttributeNS(null, "id", data.id);
            path.setAttributeNS(null, "d", data.coord);
                
            this.addDrawElementAttributes(path, data);
            document.getElementById(window.learn_draw.svg_id).appendChild(path);
        } else {
            var path = document.getElementById(data.id);
            var d = path.getAttributeNS(null, 'd');
            d += data.coord;
            path.setAttributeNS(null, 'd', d);
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
            document.getElementById(window.learn_draw.svg_id).appendChild(circle);
        } else {
            var circle = document.getElementById(data.id);
            circle.setAttributeNS(null, 'r', data.r);
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
            document.getElementById(window.learn_draw.svg_id).appendChild(line);
        } else {
            var line = document.getElementById(data.id);
            line.setAttributeNS(null, "x2", data.x2);
            line.setAttributeNS(null, "y2", data.y2);
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
            document.getElementById(window.learn_draw.svg_id).appendChild(rect);
        } else {
            var rect = document.getElementById(data.id);
            rect.setAttributeNS(null, "width", data.width);
            rect.setAttributeNS(null, "height", data.height);
        }
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
        var cnt = data.length;
        for (var i = 0;i < cnt;i++) {
            switch(data[i].figure_name) {
                case 'path':
                    var obj = new Object();
                    obj.el = data[i].figure_name;
                    obj.is_new = true;
                    obj.id = data[i].figure_id;
                    obj.coord = data[i].param_8;
                    obj.stroke_width = data[i].param_1;
                    obj.stroke = data[i].param_6;
                    obj.styles = data[i].param_7;
                    this.doDrawing(obj);
                    break;
                case 'circle':
                    var obj = new Object();
                    obj.el = data[i].figure_name;
                    obj.is_new = true;
                    obj.id = data[i].figure_id;
                    obj.cx = data[i].param_1;
                    obj.cy = data[i].param_2;
                    obj.r = data[i].param_3;
                    obj.stroke_width = data[i].param_4;
                    obj.stroke = data[i].param_6;
                    this.doDrawing(obj);
                    break;
                case 'line':
                    var obj = new Object();
                    obj.el = data[i].figure_name;
                    obj.is_new = true;
                    obj.id = data[i].figure_id;
                    obj.x1 = data[i].param_1;
                    obj.y1 = data[i].param_2;
                    obj.x2 = data[i].param_3;
                    obj.y2 = data[i].param_4;
                    
                    obj.stroke_width = data[i].param_5;
                    obj.stroke = data[i].param_6;
                    this.doDrawing(obj);
                    break;
                case 'rect':
                    var obj = new Object();
                    obj.el = data[i].figure_name;
                    obj.is_new = true;
                    obj.id = data[i].figure_id;
                    obj.x = data[i].param_1;
                    obj.y = data[i].param_2;
                    obj.width = data[i].param_3;
                    obj.height = data[i].param_4;
                    
                    obj.stroke_width = data[i].param_5;
                    obj.stroke = data[i].param_6;
                    this.doDrawing(obj);
                    break;
            }
        }
    }
}