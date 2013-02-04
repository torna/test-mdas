window.wb3 = {
    editors_list: [], // list of codemirror objects 
    board_name: 'programming',
    is_changed_from_socket: false,
    refresh_history: [], // holds the history when the page is refreshed (all history, when does not exist a client to help)
    refresh_history_initialized_editors: [], // list of processed editors, used when data comes from history
    current_tabs: [], // holds all created tabs of this board
    deleted_tabs: [], // holds all deleted tabs
    history_from_friend: [], // holds the history sent by a client that is on the same course
    stored_tab_html: '', // storing html data that is comming from ajax for repeated uses
    
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
        jQuery('.wb3_add_blank_file').click(function() {
            // generating unique id
            var unique_id = parseInt(Math.random() * 9999999999999999);
            var tab_name = 'New file';
            window.wb3.createTab(unique_id, tab_name);
        });
    },
    bindDeleteTabEvent:function(sheet_id, caller) {
        if(caller == 'socket') {
            this.deleteTab(sheet_id, caller);
        } else {
            jQuery('.delete_programming_sheet').unbind('click'); // unbind click from these elements to avoid multiplication of events
            jQuery('.delete_programming_sheet').click(function(){
                var sheet_id = jQuery(this).parent().parent().attr('data-sheet-id');
                window.wb3.deleteTab(sheet_id);
            });
        }
    },
    deleteTab: function(sheet_id, caller) {
        if(caller === undefined) {
            window.socket_object.emit('wb3_tab_delete', {sheet_id: sheet_id});
        }
        this.deleted_tabs.push(sheet_id);
        
        var index = this.current_tabs.indexOf(sheet_id);
        this.current_tabs.splice(index, 1);
        jQuery('#file_name_'+sheet_id).parent().remove(); // delete the tab
        jQuery('#board_item_'+sheet_id).remove();
        delete window.wb3.editors_list[sheet_id]; // remove object from memory
        if(jQuery('.active_wp3_tab').length == 0) {
            var last_tab_sheet_id = jQuery(jQuery('.tab_div_wb3')[jQuery('.tab_div_wb3').length-1]).attr('data-sheet-id');
            window.wb3.switchTab(last_tab_sheet_id);
        }
    },
    // switch tabs when clicked
    bindTabSwitcher: function() {
        jQuery('#board_items_tabs div').unbind('click'); // unbind click from these elements to avoid multiplication of events
        jQuery('#board_items_tabs div').click(function() {
            var sheet_id = jQuery(this).attr('data-sheet-id');
            window.wb3.switchTab(sheet_id);
        });
    },
    switchTab: function(sheet_id) {
        if(window.board_manager.is_teacher) {
            var send_obj = {};
            send_obj.sheet_id = sheet_id;
            if(window.board_manager.teacher_force_sync) {
                send_obj.zone_id = sheet_id;
            }
            window.socket_object.emit('wb3_teacher_tab', send_obj);
        }
        // inactivate all tabs
        jQuery('.active_wp3_tab').removeClass('active_wp3_tab');
        // set active the clicked tab
        jQuery('#file_name_'+sheet_id).parent().addClass('active_wp3_tab');
        // hidding tab contents
        jQuery('.wb3_board_item').hide();
        // showing contend of selected tab
        jQuery('#board_item_'+sheet_id).show();
        if(window.wb3.editors_list[sheet_id] !== undefined) {
            window.wb3.editors_list[sheet_id].refresh();
        }
    },
    createTab: function(unique_id, tab_name, caller, file_name) {
        if(jQuery('#file_name_'+unique_id).length > 0) {
            return false;
        }
        this.current_tabs.push(unique_id.toString());
        if(caller === undefined) { // if caller!='socket' send socket
            window.socket_object.emit('wb3_tab_create', {tab_name: tab_name, unique_id: unique_id, file_name: file_name});
        }
        // create tab
        jQuery('#board_items_tabs').append('<div class="tab_div_wb3" data-sheet-id="'+unique_id+'"><span id="file_name_'+unique_id+'">'+tab_name+'</span> <sup><a href="javascript:;" class="delete_programming_sheet">x</a></sup></div>');
        // create tab content
        if(file_name === undefined && this.stored_tab_html != '') {
            console.log('creating tab from memory');
            window.wb3.setTabBindings(this.stored_tab_html, unique_id);
        } else {
            jQuery.ajax({
                url: "ajax",
                data: "todo=get_wb3_generic&file_name="+file_name,
                type: "get",
                async: false,
                beforeSend: function() {
                    // loadior here
                },
                success: function(data) {
                    if(file_name === undefined) {
                        window.wb3.stored_tab_html = data;
                    }
                    window.wb3.setTabBindings(data, unique_id);
                }
            });
        }
        
    },
    setTabBindings: function(data, unique_id) {
        // setting zone id, i.e board id, so we could know where are we working
        data = data.replace(/%zone_id%/g, unique_id);
        jQuery('.programming_board_subfiles').append('<div id="board_item_'+unique_id+'" class="wb3_board_item">'+data+'</div>');
        jQuery('#resizable_'+unique_id).resizable();
        jQuery('.wb3_board_item').hide(); // hide all wb3 boards
        jQuery('#board_item_'+unique_id).show(); // showing created board
        window.wb3.bindDeleteTabEvent();
        window.wb3.bindTabSwitcher();
        window.wb3.bindLanguageSwitcher();
        window.board_manager.bindTreeviewer();
        window.wb3.switchTab(unique_id);
    },
    renameTab: function(zone_id, tab_name) {
        jQuery('#file_name_'+zone_id).html(tab_name); // setting tab filename
        window.board_manager.bindTreeviewer();
    },
    redrawAllEditors: function() {
        for(var i=0; i<window.wb3.current_tabs.length; i++) {
            if(window.wb3.editors_list[window.wb3.current_tabs[i]] !== undefined) {
                window.wb3.editors_list[window.wb3.current_tabs[i]].refresh();
            }
        }
    },
    // indicates the active teacher tab
    teacherTabIndicator: function(data) {
        jQuery('div#board_items_tabs > .teacher_active_tab').removeClass('teacher_active_tab');
        jQuery('#file_name_'+data.sheet_id).parent().addClass('teacher_active_tab');
        if(data.zone_id !== undefined) {
            this.switchTab(data.zone_id);
        }
    },
    bindLanguageSwitcher: function(chosen_language, mime, zone_id, caller) {
        if(caller === 'socket' || caller === 'history') { // if caller!='socket' send socket
            window.wb3.createHighlighter(chosen_language, mime, zone_id, caller);
            jQuery('#save_file_wb3_button_'+zone_id).show();
        } else {
            jQuery('.set_language_button').unbind('click'); // unbind click events to avoid event multiplication
            jQuery('.set_language_button').click(function() {
                var zone_id = jQuery(this).attr('data-zone-id'); // get zone id
                var chosen_language = jQuery('#programming_language_'+zone_id).val(); // get selected language
                var mime = jQuery('#programming_language_'+zone_id+' option:selected').attr('data-mime'); // getting language mime type

                if(caller === undefined) {
                    window.socket_object.emit('wb3_set_language', {chosen_language: chosen_language, mime: mime, zone_id: zone_id});
                }
                window.wb3.createHighlighter(chosen_language, mime, zone_id);
                jQuery('#save_file_wb3_button_'+zone_id).show();
            });
        }
        this.bindFileSaver();
    },
    bindFileSaver: function() {
        jQuery('.save_file_wb3_button').unbind('click');
        jQuery('.save_file_wb3_button').click(function() {
            var zone_id = jQuery(this).attr('data-zone-id');
            window.wb3.sendFileToExecution(zone_id, false);
        })
    },
    bindCodeExecutor: function(zone_id) {
        jQuery('#execute_code_button_'+zone_id).unbind('click'); // unbind click events to avoid event multiplication
        jQuery('#execute_code_button_'+zone_id).click(function() {
            window.wb3.sendFileToExecution(zone_id, true);
        });
        
        // teacher sends execution command to all clients
        jQuery('#execute_all_code_button_'+zone_id).unbind('click'); // unbind click events to avoid event multiplication
        jQuery('#execute_all_code_button_'+zone_id).click(function() {
            window.wb3.sendFileToExecution(zone_id, true, true);
        });
    },
    sendFileToExecution: function(zone_id, execute, execute_all) {
        var file_name = jQuery('#file_name_'+zone_id).html(); // getting filename (tab name)
        var file_content = this.editors_list[zone_id].getValue();
        
        var namespace = jQuery('#board_'+this.board_name+'_namespace').val();
        if(!file_name.match(/^[0-9a-zA-Z.\._]+$/)) {
            file_name = window.prompt('Please give a file name and extension. The file should not contain spaces. Ex: index.html OR product.php');
            if(file_name === null) { // cancel pressed
                return false;
            }
            if(!file_name.match(/^[0-9a-zA-Z.\._]+$/)) {
                this.sendFileToExecution(zone_id, execute); // while filename is invalid call itself recursevly
                return false;
            }
        }
        jQuery.ajax({
            url: "ajax",
            data: "todo=save_file_for_execution&file_name="+file_name+'&namespace='+namespace+'&file_content='+encodeURIComponent(file_content),
            type: "post",
            beforeSend: function() {
                // loadior here
            },
            success: function(data) {
                var json = JSON.parse(data);
                if(json.status == 'ok') {
                    window.socket_object.emit('wb3_file_name_change', {zone_id: zone_id, file_name: file_name});
                    window.wb3.renameTab(zone_id, file_name);
                    if(execute_all && window.board_manager.is_teacher) {
                        window.socket_object.emit('wb3_execute_to_all', {zone_id: zone_id, file_name: json.file_path});
                    }
                    if(execute) {
                        // refresh iframe
                        window.wb3.refreshIframe(zone_id, json.file_path);
                    }
                } else {
                    alert('An error had accured.');
                }
            }
        });
    },
    refreshIframe: function(zone_id, file_path) {
        jQuery('#code_execution_iframe_'+zone_id).attr('src', '../learn_files/'+file_path);
    },
    // some languages does not have execution part, this function handles all of them
    handleCodeExecutionFrame: function(zone_id, chosen_language) {
        var executed_languages = ['css', 'javascript', 'mysql', 'php', 'html', 'htmlmixed']; // list of languages that are currently available for execution
        if(chosen_language === undefined) {
            chosen_language = jQuery('#programming_language_'+zone_id).val(); // get selected language
        }
        jQuery('#programming_language_'+zone_id).val(chosen_language); // set selected language in selectbox
        if(executed_languages.indexOf(chosen_language) != -1) { // the chosen language is in available list
            // bind button events
            jQuery('#result_frame_'+zone_id).show();
            this.bindCodeExecutor(zone_id);
            this.bindCodeExecutorNavigationButtons();
        } else {
            // hidding frame
            jQuery('#result_frame_'+zone_id).hide();
        }
    },
    // iframe navigation buttons
    bindCodeExecutorNavigationButtons: function() {
        jQuery('.iframe_back, .iframe_forward').unbind('click');
        jQuery('.iframe_back').click(function() {
            var zone_id = jQuery(this).attr('data-zone-id');
            document.getElementById('code_execution_iframe_'+zone_id).contentWindow.history.go(-1);
        });
        
        jQuery('.iframe_forward').click(function() {
            var zone_id = jQuery(this).attr('data-zone-id');
            document.getElementById('code_execution_iframe_'+zone_id).contentWindow.history.go(1);
        });
    },
    createHighlighter: function(chosen_language, mime, zone_id, caller) {
        var javascripts = new Array();
        if(chosen_language != 'c' && chosen_language != 'cplus' && chosen_language != 'java') {
            javascripts.push('../js/highlighter/mode/'+chosen_language+'/'+chosen_language+'.js');
        }
        javascripts.push('../js/highlighter/mode/clike/clike.js');
        javascripts.push('../js/highlighter/mode/xml/xml.js');
        javascripts.push('../js/highlighter/mode/javascript/javascript.js');
        
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
                        window.wb3.initHighlighter(zone_id, mime, chosen_language, caller);
                    }
                }
        }
        if(included_scripts_cnt == 0) { // if the scripts are already loaded
            this.initHighlighter(zone_id, mime, chosen_language, caller);
        }
    },
    initHighlighter: function(zone_id, mime, chosen_language, caller) {
        if(this.deleted_tabs.indexOf(zone_id) != -1) { // its a deleted tab
            return;
        }
        // when switching language keep the content
        var current_editor_value = '';
        if(this.editors_list[zone_id] !== undefined) {
            current_editor_value = this.editors_list[zone_id].getValue();
//            console.log('prev data: '+current_editor_value);
        } else {
//            console.log('undefined editor: '+zone_id);
        }
        jQuery('#resizable_'+zone_id+' div[class="CodeMirror cm-s-default"]').remove(); // delete previous codemirror divs before creating new one
        var editor = window.CodeMirror.fromTextArea(document.getElementById("highlighter_textarea_"+zone_id), {
            lineNumbers: true,
            matchBrackets: true,
            mode: mime,
            indentUnit: 4,
            indentWithTabs: true,
            enterMode: "keep",
            tabMode: "shift",
            smartIndent: false,
            dragDrop: false,
            undoDepth: 0
        });
        editor.zone_id = zone_id;
        editor.on('change', function(instance, changeObj) {
//            console.log(changeObj); // changed object
            if(window.wb3.is_changed_from_socket == false) {
                var editor_socket_obj = {
                    from: {ch: changeObj.from.ch, line: changeObj.from.line},
                    to: {ch: changeObj.to.ch, line: changeObj.to.line},
                    origin: changeObj.origin,
                    text: changeObj.text,
                    next: changeObj.next,
                    cnt_text: changeObj.text.length
                };
                if(changeObj.origin == 'paste' && changeObj.text[changeObj.text.length-1] == '') {
                    changeObj.text.pop();
                }
                window.socket_object.emit('wb3_editor_change', {zone_id: zone_id, change_obj: editor_socket_obj});
                window.wb3.is_changed_from_socket = false;
            }
        });
        editor.on('cursorActivity', function(instance) {
//            console.log(instance.getSelection()); // returns selected string
//            console.log(instance.getSelection()); // cursor movement
        })
        editor.on('viewportChange', function(instance) {
//            console.log('Viewport change'+instance);
        })
        
        if(current_editor_value) {
            window.wb3.is_changed_from_socket = true;
            editor.setValue(current_editor_value); // set old content to the new editor
            window.wb3.is_changed_from_socket = false;
        }

        this.editors_list[zone_id] = editor;
        // if there are keystrokes in memory (from history) apply them
        this.setHistoryKeystrokes(zone_id);
        this.setDataFromFrindHistory(zone_id);
        // manage code execution part
        this.handleCodeExecutionFrame(zone_id, chosen_language);
    },
    // used when data comes from history, is triggered when the zone_id highlighter is initialized
    setHistoryKeystrokes: function(zone_id) {
        if(this.refresh_history === undefined) {
            return;
        }
        var cnt = this.refresh_history.length;
        var main_data = new Array();
        
        for (var i = 0; i < cnt; i++) {
            if(this.refresh_history[i] !== undefined && this.refresh_history[i].act_name == 'wb3_editor_change') {
                if(this.refresh_history[i].obj_id == zone_id) {
                    main_data = JSON.parse(this.refresh_history[i].main_data);
                    this.applyHighlighterChange(main_data);
                }
            }
        }
        this.refresh_history_initialized_editors.push(zone_id);
        if(this.allEditorsBinded()) { // if all editors from history were processed set is_refresh=false
            delete this.refresh_history;
            window.board_manager.is_refresh = false;
        }
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
                
            } else if(data.change_obj.origin == 'undo' || data.change_obj.origin == 'redo') {
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
                    window.wb3.createTab(data[i].obj_id, main_data.tab_name, 'history', main_data.file_name);
                    break;
                case 'wb3_tab_delete':
                    window.wb3.deleteTab(data[i].obj_id, 'history');
                    break;
                case 'wb3_set_language':
                    window.wb3.bindLanguageSwitcher(main_data.chosen_language, main_data.mime, data[i].obj_id, 'history'); // actual setter
                    window.wb3.bindLanguageSwitcher(); // binder
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