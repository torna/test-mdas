window.wb4 = {
    board_name: 'presentation',
    is_changed_from_socket: false,
    refresh_history: [], // holds the history when the page is refreshed (all history, when does not exist a client to help)
    current_tabs: [], // holds all created tabs of this board
    deleted_tabs: [], // holds all deleted tabs
    history_from_friend: [], // holds the history sent by a client that is on the same course
    current_slider_position: 0,

    init: function() {
        // bind elements events
        this.bindEvents();
    },
    bindEvents: function() {
        
        // set tab events: close tab, switch tab, rename tab
        this.setTabEvents();
    },
    setTabEvents: function() {
        // when tab's x is clicked
        this.bindDeleteTabEvent();
        
        // add blank tab
        jQuery('#add_presentation_btn').click(function() {
            // generating unique id
            var unique_id = jQuery('#teacher_presentations_select').val();
            var tab_name = jQuery('#teacher_presentations_select :selected').text();
            window.wb4.createTab(unique_id, tab_name);
        });
    },
    bindDeleteTabEvent:function(sheet_id, caller) {
        if(caller == 'socket') {
            this.deleteTab(sheet_id, caller);
        } else {
            jQuery('.delete_presentation_sheet').unbind('click'); // unbind click from these elements to avoid multiplication of events
            jQuery('.delete_presentation_sheet').click(function(){
                var sheet_id = jQuery(this).parent().parent().attr('data-sheet-id');
                window.wb4.deleteTab(sheet_id);
            });
        }
    },
    deleteTab: function(sheet_id, caller) {
        if(caller === undefined) {
            window.socket_object.emit('wb4_tab_delete', {
                sheet_id: sheet_id
            });
        }
        this.deleted_tabs.push(sheet_id);
        
        var index = this.current_tabs.indexOf(sheet_id);
        this.current_tabs.splice(index, 1);
        jQuery('#file_name_'+sheet_id).parent().remove(); // delete the tab
        jQuery('#board_item_'+sheet_id).remove();
        if(jQuery('.active_wp4_tab').length == 0) {
            var last_tab_sheet_id = jQuery(jQuery('.tab_div_wb4')[jQuery('.tab_div_wb4').length-1]).attr('data-sheet-id');
            window.wb4.switchTab(last_tab_sheet_id);
        }
    },
    // switch tabs when clicked
    bindTabSwitcher: function() {
        jQuery('#wb4_items_tabs div').unbind('click'); // unbind click from these elements to avoid multiplication of events
        jQuery('#wb4_items_tabs div').click(function() {
            var sheet_id = jQuery(this).attr('data-sheet-id');
            window.wb4.switchTab(sheet_id);
        });
    },
    switchTab: function(sheet_id) {
        if(window.board_manager.is_teacher) {
            window.socket_object.emit('wb4_teacher_tab', {
                sheet_id: sheet_id
            });
        }
        // inactivate all tabs
        jQuery('.active_wp4_tab').removeClass('active_wp4_tab');
        // set active the clicked tab
        jQuery('#file_name_'+sheet_id).parent().addClass('active_wp4_tab');
        // hidding tab contents
        jQuery('.wb4_board_item').hide();
        // showing contend of selected tab
        jQuery('#board_item_'+sheet_id).show();
    },
    createTab: function(unique_id, tab_name, caller) {
        //        if(jQuery('#file_name_'+unique_id).length > 0) {
        if(this.current_tabs.length >= 1) {
            return false;
        }
        this.current_tabs.push(unique_id.toString());
        if(caller === undefined) { // if caller!='socket' send socket
            window.socket_object.emit('wb4_tab_create', {
                tab_name: tab_name, 
                unique_id: unique_id
            });
        }
        // create tab
        jQuery('#wb4_items_tabs').append('<div class="tab_div_wb4" data-sheet-id="'+unique_id+'"><span id="file_name_'+unique_id+'">'+tab_name+'</span> <sup><a href="javascript:;" class="delete_presentation_sheet">x</a></sup></div>');
        // create tab content
        jQuery.ajax({
            url: "ajax",
            data: "todo=get_wb4_generic&presentation_hash="+unique_id,
            type: "get",
            async: false,
            beforeSend: function() {
            // loadior here
            },
            success: function(data) {
                window.wb4.setTabBindings(data, unique_id);
            }
        });
        
    },
    setTabBindings: function(data, unique_id) {
        // setting zone id, i.e board id, so we could know where are we working
        data = data.replace(/%zone_id%/g, unique_id);
        jQuery('.presentation_board_subfiles').append('<div id="board_item_'+unique_id+'" class="wb4_board_item">'+data+'</div>');
        jQuery('.wb4_board_item').hide(); // hide all wb3 boards
        jQuery('#board_item_'+unique_id).show(); // showing created board
        
        jQuery.deck('.slide_'+unique_id);
        if(window.board_manager.is_teacher == 0) {
            jQuery(document).unbind('keydown.deck');
        }
        console.log(this.history_from_friend[unique_id]);
        if(this.history_from_friend[unique_id] !== undefined) {
            this.switchSlide(this.history_from_friend[unique_id], 'history');
        }
        window.wb4.bindDeleteTabEvent();
        window.wb4.bindTabSwitcher();
        window.board_manager.bindTreeviewer();
        window.wb4.switchTab(unique_id);
    },
    slidePosition: function(slider_position) {
        window.socket_object.emit('wb4_slide_change', {
            slider_position: slider_position, 
            unique_id: this.current_tabs[0]
        });
        this.current_slider_position = slider_position;
    },
    switchSlide: function(slider_position, caller) {
        if(typeof jQuery.deck === 'function') {
            jQuery.deck('go', slider_position);
            this.current_slider_position = slider_position;
        }
    },
    setDataFromFrindHistory: function(zone_id) {
        if(this.history_from_friend[zone_id] === null) {
            return;
        }
        if(this.history_from_friend[zone_id] !== undefined) {
            this.is_changed_from_socket = true;
            this.editors_list[zone_id].setValue(this.history_from_friend[zone_id]);
            this.is_changed_from_socket = false;
        }
    },
    // gets current board content for helping other
    getAllContents: function() {
        var contents_object = new Object();
        var final_result = new Array();
        var cnt_tabs = this.current_tabs.length;
        var unique_id = '';
        for (var i = 0; i < cnt_tabs; i++) {
            unique_id = this.current_tabs[i].toString();
            if(this.deleted_tabs.indexOf(unique_id) != -1) {
                continue;
            }
            contents_object = new Object();
            contents_object.tab_name = jQuery('#file_name_'+unique_id).html();
            contents_object.unique_id = unique_id;
            contents_object.current_slider_position = this.current_slider_position;
            final_result.push(contents_object);
        }
        return final_result;
    },
    createBoardFromHistory: function(data) {
        console.log(data);
        // create tabs, sliders
        for (var i = 0; i < data.length; i++) {
            this.history_from_friend[data[i].unique_id] = data[i].current_slider_position;
            this.createTab(data[i].unique_id, data[i].tab_name, 'history');
        }
        
    },
    applyRedrawBoard: function(data) {
        console.log('Boards loaded from HISTORY (wb4)');
        var cnt = data.length;
        var main_data = new Array();
        for (var i = 0; i < cnt; i++) {
            main_data = JSON.parse(data[i].main_data);
            switch(data[i].act_name) {
                case 'wb4_tab_create':
                    this.createTab(data[i].obj_id, main_data.tab_name, 'history');
                    break;
                case 'wb4_tab_delete':
                    this.deleteTab(data[i].obj_id, 'history');
                    break;
            }
            if(i == cnt-1) { // if last element, set slider last position
                main_data = JSON.parse(data[i].last_slider_position);
                this.switchSlide(main_data.slider_position);
            }
        }
    },
    closeBoard: function() {
        while(this.current_tabs.length) {
            this.deleteTab(this.current_tabs[0], 'redraw');
        }
        this.deleted_tabs = [];
    }
}