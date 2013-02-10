window.wb5 = {
    board_name: 'tests',
    refresh_history: [], // holds the history when the page is refreshed (all history, when does not exist a client to help)
    current_tabs: [], // holds all created tabs of this board
    history_from_friend: [], // holds the history sent by a client that is on the same course
    stored_test_html: [], // storing html data that is comming from ajax for repeated uses
    
    init: function() {
        // bind elements events
        this.bindEvents();
    },
    bindEvents: function() {
        // set tab events: close tab, switch tab, rename tab
        this.setTabEvents();
    },
    
    createTeacherTest: function(test, test_name, caller) {
        var unique_id = test;
        if(jQuery('#file_name_'+unique_id).length > 0) {
            return false;
        }
        this.current_tabs.push(unique_id);
        jQuery('#wb5_items_tabs').append('<div class="tab_div_wb5" data-sheet-id="'+unique_id+'"><span id="file_name_'+unique_id+'">'+test_name+'</span> <sup><a href="javascript:;" class="delete_teacher_test">x</a></sup></div>');
        if(window.wb5.stored_test_html[test] !== undefined) {
            window.wb5.setTabBindings(window.wb5.stored_test_html[test], unique_id);
        } else {
            jQuery.ajax({
                url: "ajax",
                data: "todo=teacher_test&test_hash="+test,
                type: "get",
                async: false,
                beforeSend: function() {
                    // loadior here
                },
                success: function(data) {
                    window.wb5.stored_test_html[test] = data;
                    window.wb5.setTabBindings(data, unique_id);
                }
            });
        }
    },
    setTabEvents: function() {
        // when tab's x is clicked
        this.bindDeleteTabEvent();
        
        // add blank tab
        jQuery('#add_text_sheet').click(function() {
            // generating unique id
            var unique_id = jQuery('#texts_list').val();
            var tab_name = jQuery('#texts_list option:selected').text();
            window.wb5.createTab(unique_id, tab_name, undefined, 'text');
        });
    },
    bindDeleteTabEvent:function(sheet_id, caller) {
        jQuery('.delete_teacher_test').unbind('click'); // unbind click from these elements to avoid multiplication of events
        jQuery('.delete_teacher_test').click(function(){
            var sheet_id = jQuery(this).parent().parent().attr('data-sheet-id');
            window.wb5.deleteTab(sheet_id);
        });
    },
    bindTestControls: function(unique_id) {
        jQuery('.set_test_finished').unbind('change');
        jQuery('.set_test_finished').change(function() {
            window.socket_object.emit('test_finished', { test_hash: jQuery(this).attr('data-test-hash'), test_status: jQuery(this).val() });
        })
    },
    sendTestProgress: function(test_hash, caller) {
        var test_progress = this.getTestProgress(test_hash);
        window.socket_object.emit('student_test_progress', { test_hash: test_hash, test_progress: test_progress });
    },
    getTestProgress: function(test_hash) {
        var element;
        var element_type;
        var element_object;
        var class_name;
        var progress_data = [];
        for (var i = 0; i < jQuery('.test_'+test_hash+' input, .test_'+test_hash+' textarea').length; i++) {
            element = jQuery('.test_'+test_hash+' input, .test_'+test_hash+' textarea')[i];
            class_name = jQuery(element).attr('class');
            element_type = jQuery(element).attr('type');
            if(jQuery(element).prop('tagName') == 'INPUT') {
                switch(jQuery(element).attr('type')) {
                    case 'radio':
                        element_object = { is_checked: element.checked };
                        break;
                    case 'text':
                        element_object = { value: jQuery(element).val() };
                        break;
                    case 'checkbox':
                        element_object = { is_checked: element.checked };
                        break;
                }
            } else if(jQuery(element).prop('tagName') == 'TEXTAREA') {
                element_object = { value: jQuery(element).val() };
            }
            element_object.el_class = class_name;
            element_object.el_type = element_type;
            progress_data.push(element_object);
            element_object = {};
        }
        return progress_data;
    },
    deleteTab: function(sheet_id, caller) {
        var index = this.current_tabs.indexOf(sheet_id);
        this.current_tabs.splice(index, 1);
        jQuery('#file_name_'+sheet_id).parent().remove(); // delete the tab
        jQuery('#board_item_'+sheet_id).remove();
        if(jQuery('.active_wp5_tab').length == 0) {
            var last_tab_sheet_id = jQuery(jQuery('.tab_div_wb5')[jQuery('.tab_div_wb5').length-1]).attr('data-sheet-id');
            window.wb5.switchTab(last_tab_sheet_id);
        }
    },
    // switch tabs when clicked
    bindTabSwitcher: function() {
        jQuery('#wb5_items_tabs div').unbind('click'); // unbind click from these elements to avoid multiplication of events
        jQuery('#wb5_items_tabs div').click(function() {
            var sheet_id = jQuery(this).attr('data-sheet-id');
            window.wb5.switchTab(sheet_id);
        });
    },
    switchTab: function(sheet_id) {
//        if(window.board_manager.is_teacher) {
//            var send_obj = {};
//            send_obj.sheet_id = sheet_id;
//            if(window.board_manager.teacher_force_sync) {
//                send_obj.zone_id = sheet_id;
//            }
//            window.socket_object.emit('wb5_teacher_tab', send_obj);
//        }
        // inactivate all tabs
        jQuery('.active_wp5_tab').removeClass('active_wp5_tab');
        // set active the clicked tab
        jQuery('#file_name_'+sheet_id).parent().addClass('active_wp5_tab');
        // hidding tab contents
        jQuery('.wb5_board_item').hide();
        // showing contend of selected tab
        jQuery('#board_item_'+sheet_id).show();
    },
    setTabBindings: function(data, unique_id) {
        // setting zone id, i.e board id, so we could know where are we working
        data = data.replace(/%zone_id%/g, unique_id);
        data = data.replace(/%test_hash%/g, unique_id);
        jQuery('.wb5_board_subfiles').append('<div id="board_item_'+unique_id+'" class="wb5_board_item">'+data+'</div>');
        jQuery('.wb5_board_item').hide(); // hide all wb3 boards
        jQuery('#board_item_'+unique_id).show(); // showing created board
        this.bindDeleteTabEvent();
        this.bindTabSwitcher();
        this.switchTab(unique_id);
        this.bindTestControls(unique_id);
    },
    renameTab: function(zone_id, tab_name) {
        jQuery('#file_name_'+zone_id).html(tab_name); // setting tab filename
    //        window.board_manager.bindTreeviewer();
    },
    // indicates the active teacher tab
    teacherTabIndicator: function(data) {
        jQuery('div#wb5_items_tabs > .teacher_active_tab').removeClass('teacher_active_tab');
        jQuery('#file_name_'+data.sheet_id).parent().addClass('teacher_active_tab');
        if(data.zone_id !== undefined) {
            this.switchTab(data.zone_id);
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
            contents_object.tab_language = jQuery('#programming_language_'+unique_id).val();
            contents_object.mime = jQuery('#programming_language_'+unique_id+' option:selected').attr('data-mime');
            contents_object.unique_id = unique_id;
            if (this.editors_list[unique_id] !== undefined) {
                contents_object.editor_content = this.editors_list[unique_id].getValue();
            } else {
                contents_object.editor_content = null;
            }
            final_result.push(contents_object);
        }
        
        return final_result;
    },
    createBoardFromHistory: function(data) {
        // store editor data
        for (var i = 0; i < data.length; i++) {
            this.history_from_friend[data[i].unique_id] = data[i].editor_content;
        }
        
        // create tabs, editors
        for (var i = 0; i < data.length; i++) {
            this.createTab(data[i].unique_id, data[i].tab_name, 'history', data.file_name);
            if(data[i].editor_content !== null) {
                this.bindLanguageSwitcher(data[i].tab_language, data[i].mime, data[i].unique_id, 'history'); // actual setter
                this.bindLanguageSwitcher(); // binder
            }
        }
        
    },
    applyHighlighterChange: function(data) {
        //        console.log('Received object: ', data);
        var zone_id = data.zone_id;
        var text = '';
        for (var i = 0; i < data.change_obj.text.length; i++) {
            this.is_changed_from_socket = true;
            var from = data.change_obj.from;
            var to = data.change_obj.to;
            var origin = data.change_obj.origin;
            if(data.change_obj.origin == 'delete' && text == '') {
                
            } else if(data.change_obj.origin == 'undo') {
                if(data.change_obj.text[i] == '') {
                    text += "\n";
                } else {
                    text += data.change_obj.text[i];
                }
                if(data.change_obj.text.length > 1 && i<data.change_obj.text.length-1) { // the there are multiple lines add \n but not to last line
                    text += "\n";
                }
            } else if(data.change_obj.origin == 'input') {
                if(data.change_obj.text[i] == '') {
                    if(from.ch == to.ch && from.ch == to.ch) {
                        text += "\n";
                    }
                } else {
                    text += data.change_obj.text[i];
                }
                if(data.change_obj.hasOwnProperty('next')) {
                    text += data.change_obj.next.text[0];
                    break;
                }
            } else if(data.change_obj.origin == 'paste') {
                if(data.change_obj.text[i] == '') {
                    text += "\n";
                } else {
                    text += data.change_obj.text[i];
                    if((data.change_obj.text.length > 1 || data.change_obj.cnt_text > 1) && i!=data.change_obj.cnt_text-1) {
                        text += "\n";
                    }
                }
            } else if(text == '') {
                text = "\n";
                if(data.change_obj.hasOwnProperty('next')) {
                    text += data.change_obj.next.text[0];
                }
            }
        }
        
        if(data.change_obj.origin != 'paste') {
            text = text.replace(/([\r\n])+/gm,"\n");
        }
        //        console.log(this.editors_list[zone_id]);
        this.editors_list[zone_id].replaceRange(text, from, to, origin);
        text = '';
        this.is_changed_from_socket = false;
    }, 
    applyRedrawBoard: function(data) {
        console.log('Boards loaded from HISTORY');
        this.refresh_history = data;
        var cnt = data.length;
        var main_data = new Array();
        var contains_editors = false; // flag
        for (var i = 0; i < cnt; i++) {
            main_data = JSON.parse(data[i].main_data);
            switch(data[i].act_name) {
                //                case 'board_create':
                //                    window.board_manager.addBoard(main_data.board_type, main_data.board_name, 'history');
                //                    break;
                //                case 'wb3_board_delete':
                //                    window.board_manager.deleteBoard(main_data.board_type, 'history');
                //                    break;
                case 'wb3_tab_create':
                    window.wb5.createTab(data[i].obj_id, main_data.tab_name, 'history', main_data.file_name);
                    break;
                case 'wb3_tab_delete':
                    window.wb5.deleteTab(data[i].obj_id, 'history');
                    break;
                case 'wb3_set_language':
                    window.wb5.bindLanguageSwitcher(main_data.chosen_language, main_data.mime, data[i].obj_id, 'history'); // actual setter
                    window.wb5.bindLanguageSwitcher(); // binder
                    contains_editors = true;
                    break;
                case 'wb3_file_name_change':
                    this.renameTab(data[i].obj_id, main_data.file_name);
                    break;
            }
        }
        if(!contains_editors) {
            delete this.refresh_history; // free memory
            window.board_manager.is_refresh = false; // set refresh status to false
        }
    },
    closeBoard: function() {
        while(this.current_tabs.length) {
            this.deleteTab(this.current_tabs[0], 'redraw');
        }
        this.deleted_tabs = [];
    }
}