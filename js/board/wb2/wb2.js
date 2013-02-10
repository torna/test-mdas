window.wb2 = {
    editors_list: [], // list of codemirror objects 
    board_name: 'languages',
    is_changed_from_socket: false,
    refresh_history: [], // holds the history when the page is refreshed (all history, when does not exist a client to help)
    refresh_history_initialized_editors: [], // list of processed editors, used when data comes from history
    current_tabs: [], // holds all created tabs of this board
    deleted_tabs: [], // holds all deleted tabs
    history_from_friend: [], // holds the history sent by a client that is on the same course
    stored_tab_html: '', // storing html data that is comming from ajax for repeated uses
    stored_test_html:[],
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
        jQuery('#add_text_sheet').click(function() {
            // generating unique id
            var unique_id = jQuery('#texts_list').val();
            var tab_name = jQuery('#texts_list option:selected').text();
            window.wb2.createTab(unique_id, tab_name, undefined, 'text');
        });
    },
    bindDeleteTabEvent:function(sheet_id, caller) {
        if(caller == 'socket') {
            this.deleteTab(sheet_id, caller);
        } else {
            jQuery('.delete_languages_sheet').unbind('click'); // unbind click from these elements to avoid multiplication of events
            jQuery('.delete_languages_sheet').click(function(){
                var sheet_id = jQuery(this).parent().parent().attr('data-sheet-id');
                window.wb2.deleteTab(sheet_id);
            });
        }
    },
    deleteTab: function(sheet_id, caller) {
        if(caller === undefined) {
            window.socket_object.emit('wb2_tab_delete', {sheet_id: sheet_id});
        }
        this.deleted_tabs.push(sheet_id);
        
        var index = this.current_tabs.indexOf(sheet_id);
        this.current_tabs.splice(index, 1);
        jQuery('#file_name_'+sheet_id).parent().remove(); // delete the tab
        jQuery('#board_item_'+sheet_id).remove();
        delete window.wb2.editors_list[sheet_id]; // remove object from memory
        if(jQuery('.active_wp2_tab').length == 0) {
            var last_tab_sheet_id = jQuery(jQuery('.tab_div_wb2')[jQuery('.tab_div_wb2').length-1]).attr('data-sheet-id');
            window.wb2.switchTab(last_tab_sheet_id);
        }
    },
    // switch tabs when clicked
    bindTabSwitcher: function() {
        jQuery('#wb2_items_tabs div').unbind('click'); // unbind click from these elements to avoid multiplication of events
        jQuery('#wb2_items_tabs div').click(function() {
            var sheet_id = jQuery(this).attr('data-sheet-id');
            window.wb2.switchTab(sheet_id);
        });
    },
    switchTab: function(sheet_id) {
        if(window.board_manager.is_teacher) {
            var send_obj = {};
            send_obj.sheet_id = sheet_id;
            if(window.board_manager.teacher_force_sync) {
                send_obj.zone_id = sheet_id;
            }
            window.socket_object.emit('wb2_teacher_tab', send_obj);
        }
        // inactivate all tabs
        jQuery('.active_wp2_tab').removeClass('active_wp2_tab');
        // set active the clicked tab
        jQuery('#file_name_'+sheet_id).parent().addClass('active_wp2_tab');
        // hidding tab contents
        jQuery('.wb2_board_item').hide();
        // showing contend of selected tab
        jQuery('#board_item_'+sheet_id).show();
        jQuery('#board_item_'+sheet_id).show();
        if(window.wb2.editors_list[sheet_id] !== undefined) {
            window.wb2.editors_list[sheet_id].refresh();
        }
    },
    createTab: function(unique_id, tab_name, caller, type) {
        if(jQuery('#file_name_'+unique_id).length > 0) {
            return false;
        }
        this.current_tabs.push(unique_id.toString());
        if(caller === undefined) { // if caller!='socket' send socket
            if(type == 'text') {
                window.socket_object.emit('wb2_create_text', { unique_id: unique_id, tab_name: tab_name });
            }
        }
        
        var todo = '';
        
        if(type == 'text') {
            todo = 'get_wb2_generic';
        }
        
        jQuery.ajax({
            url: "ajax",
            data: "todo="+todo+"&unique_id="+unique_id,
            type: "get",
            async: false,
            beforeSend: function() {
                // loadior here
            },
            success: function(data) {
                jQuery('#wb2_items_tabs').append('<div class="tab_div_wb2" data-sheet-id="'+unique_id+'"><span id="file_name_'+unique_id+'">'+tab_name+'</span> <sup><a href="javascript:;" class="delete_languages_sheet">x</a></sup></div>');
                window.wb2.setTabBindings(data, unique_id, true);
            }
        });
        
    },
    createTeacherTest: function(test, test_name, caller) {
        var unique_id = test;
        if(jQuery('#file_name_'+unique_id).length > 0) {
            return false;
        }
        this.current_tabs.push(unique_id);
        jQuery('#wb2_items_tabs').append('<div class="tab_div_wb2" data-sheet-id="'+unique_id+'"><span id="file_name_'+unique_id+'">'+test_name+'</span> <sup><a href="javascript:;" class="delete_teacher_test">x</a></sup></div>');
        if(window.wb2.stored_test_html[test] !== undefined) {
            window.wb2.setTabBindings(window.wb2.stored_test_html[test], unique_id);
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
                    window.wb2.stored_test_html[test] = data;
                    window.wb2.setTabBindings(data, unique_id);
                }
            });
        }
    },
    setTabBindings: function(data, unique_id, is_editor) {
        // setting zone id, i.e board id, so we could know where are we working
        data = data.replace(/%zone_id%/g, unique_id);
        data = data.replace(/%test_hash%/g, unique_id);
        jQuery('.wb2_board_subfiles').append('<div id="board_item_'+unique_id+'" class="wb2_board_item">'+data+'</div>');
        jQuery('.wb2_board_item').hide(); // hide all wb2 boards
        jQuery('#board_item_'+unique_id).show(); // showing created board
        window.wb2.bindDeleteTabEvent();
        window.wb2.bindTabSwitcher();
        if(is_editor) {
            window.wb2.bindLanguageSwitcher(unique_id);
        }
        window.wb2.switchTab(unique_id);
        window.wb2.bindTestControls(unique_id);
        
    },
    bindTestControls: function(unique_id) {
        jQuery('.set_test_finished').unbind('change');
        jQuery('.set_test_finished').change(function() {
            window.socket_object.emit('test_finished', { test_hash: jQuery(this).attr('data-test-hash'), test_status: jQuery(this).val() });
        })
    },
    renameTab: function(zone_id, tab_name) {
        jQuery('#file_name_'+zone_id).html(tab_name); // setting tab filename
//        window.board_manager.bindTreeviewer();
    },
    // indicates the active teacher tab
    teacherTabIndicator: function(data) {
        jQuery('div#wb2_items_tabs > .teacher_active_tab').removeClass('teacher_active_tab');
        jQuery('#file_name_'+data.sheet_id).parent().addClass('teacher_active_tab');
        if(data.zone_id !== undefined) {
            this.switchTab(data.zone_id);
        }
    },
    bindLanguageSwitcher: function(zone_id) {
        window.wb2.createHighlighter(zone_id);
    },
    createHighlighter: function(zone_id) {
        var javascripts = new Array();
        var existent_scripts = new Array();
        for (var i = 0; i < jQuery('script').length; i++) {
            existent_scripts.push(jQuery(jQuery('script')[i]).attr('src'));
        }

        var loaded_script_counter = 0;
        var included_scripts_cnt = 0;

        for (var i = 0; i < javascripts.length; i++) {
//            if(existent_scripts.indexOf(javascripts[i]) == -1) { // if script doesn't exist in DOM add it
                included_scripts_cnt++;
                var script = document.createElement("script");
                script.type = "text/javascript";
                script.src = javascripts[i];
                document.getElementsByTagName("head")[0].appendChild(script); // add script to head
                script.onload = function() {
                    loaded_script_counter++;
                    if(loaded_script_counter == included_scripts_cnt) { // if all scripts had been loaded successfully do the binding
                        window.wb2.initHighlighter(zone_id);
                    }
                }
        }
        if(included_scripts_cnt == 0) { // if the scripts are already loaded
            this.initHighlighter(zone_id);
        }
    },
    initHighlighter: function(zone_id) {
        if(this.deleted_tabs.indexOf(zone_id) != -1) { // its a deleted tab
            return;
        }
        jQuery('#resizable_'+zone_id+' div[class="CodeMirror cm-s-default"]').remove(); // delete previous codemirror divs before creating new one
        var editor = window.CodeMirror.fromTextArea(document.getElementById("highlighter_textarea_"+zone_id), {
            lineNumbers: false,
            matchBrackets: false,
            mode: '',
            indentUnit: 4,
            indentWithTabs: true,
            enterMode: "keep",
            tabMode: "shift",
            smartIndent: false,
            dragDrop: false,
            readOnly: true
        });
        
        editor.on('cursorActivity', function(instance) {
//            console.log(instance.getSelection()); // returns selected string
//            console.log(instance.getSelection()); // cursor movement
        })
        editor.on('viewportChange', function(instance) {
//            console.log('Viewport change'+instance);
        })
        
        this.editors_list[zone_id] = editor;
        // if there are keystrokes in memory (from history) apply them
        this.setDataFromFrindHistory(zone_id);
        
        jQuery('#board_item_'+zone_id+' .CodeMirror-lines:first-child').css('line-height', '22px');
    },
    // used when data comes from history
    allEditorsBinded: function() {
        var unique_id = null;
        for (var i = 0; i < this.refresh_history.length; i++) {
            if(this.refresh_history[i] !== undefined && this.refresh_history[i].act_name == 'wb3_set_language') {
                unique_id = this.refresh_history[i].obj_id;
                if(this.refresh_history_initialized_editors.indexOf(unique_id) == -1) { // some editor not initialized yet
                    console.log('id not found: '+unique_id);
                    return false;
                }
            }
        }
        return true;
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
                    window.wb2.createTab(data[i].obj_id, main_data.tab_name, 'history', main_data.file_name);
                    break;
                case 'wb3_tab_delete':
                    window.wb2.deleteTab(data[i].obj_id, 'history');
                    break;
                case 'wb3_set_language':
                    window.wb2.bindLanguageSwitcher(main_data.chosen_language, main_data.mime, data[i].obj_id, 'history'); // actual setter
                    window.wb2.bindLanguageSwitcher(); // binder
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