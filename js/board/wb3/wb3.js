window.wb3 = {
    editors_list: [], // list of codemirror objects 
    board_name: 'programming',
    is_changed_from_socket: false,
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
            jQuery('#file_name_'+sheet_id).parent().remove(); // delete the tab
            jQuery('#board_item_'+sheet_id).remove();
            delete window.wb3.editors_list[sheet_id]; // remove object from memory
        } else {
            jQuery('.delete_programming_sheet').unbind('click'); // unbind click from these elements to avoid multiplication of events
            jQuery('.delete_programming_sheet').click(function(){
                var sheet_id = jQuery(this).parent().parent().attr('data-sheet-id');
                window.wb3.deleteTab(sheet_id);
            });
        }
    },
    deleteTab: function(sheet_id) {
        window.socket_object.emit('wb3_tab_delete', {sheet_id: sheet_id});
        jQuery('#file_name_'+sheet_id).parent().remove(); // delete the tab
        jQuery('#board_item_'+sheet_id).remove();
        delete window.wb3.editors_list[sheet_id]; // remove object from memory
    },
    // switch tabs when clicked
    bindTabSwitcher: function() {
        jQuery('#board_items_tabs div').unbind('click'); // unbind click from these elements to avoid multiplication of events
        jQuery('#board_items_tabs div').click(function(){
            // inactivate all tabs
            jQuery('.active_wp3_tab').removeClass('active_wp3_tab');
            // set active the clicked tab
            jQuery(this).addClass('active_wp3_tab');
            var sheet_id = jQuery(this).attr('data-sheet-id');
            // hidding tab contents
            jQuery('.wb3_board_item').hide();
            // showing contend of selected tab
            jQuery('#board_item_'+sheet_id).show();
            if(window.wb3.editors_list[sheet_id] !== undefined) {
                window.wb3.editors_list[sheet_id].refresh();
            }
        });
    },
    createTab: function(unique_id, tab_name, caller, file_name) {
        if(jQuery('#file_name_'+unique_id).length > 0) {
            return false;
        }
        // create tab
        jQuery('#board_items_tabs').append('<div data-sheet-id="'+unique_id+'"><span id="file_name_'+unique_id+'">'+tab_name+'</span> <sup><a href="javascript:;" class="delete_programming_sheet">x</a></sup></div>');
        // create tab content
        jQuery.ajax({
            url: "ajax",
            data: "todo=get_wb3_generic&file_name="+file_name,
            type: "get",
            beforeSend: function() {
            // loadior here
            },
            success: function(data) {
                if(caller === undefined) { // if caller!='socket' send socket
                    window.socket_object.emit('wb3_tab_create', {tab_name: tab_name, unique_id: unique_id, file_name: file_name});
                }
                // setting zone id, i.e board id, so we could know where are we working
                data = data.replace(/%zone_id%/g, unique_id);
                jQuery('.programming_board_subfiles').append('<div id="board_item_'+unique_id+'" class="wb3_board_item">'+data+'</div>');
                jQuery('#resizable_'+unique_id).resizable();
                jQuery('.wb3_board_item').hide(); // hide all wb3 boards
                jQuery('#board_item_'+unique_id).show(); // showing created board
                
                window.wb3.bindDeleteTabEvent();
                window.wb3.bindTabSwitcher();
                window.wb3.bindLanguageSwitcher();
                window.wb3.bindTreeviewer();
            }
        });
        
    },
    renameTab: function(zone_id, tab_name) {
        jQuery('#file_name_'+zone_id).html(tab_name); // setting tab filename
        this.bindTreeviewer();
    },
    bindLanguageSwitcher: function(chosen_language, mime, zone_id, caller) {
        if(caller === 'socket') { // if caller!='socket' send socket
            window.wb3.createHighlighter(chosen_language, mime, zone_id);
        } else {
            jQuery('.set_language_button').unbind('click'); // unbind click events to avoid event multiplication
            jQuery('.set_language_button').click(function() {
                var zone_id = jQuery(this).attr('data-zone-id'); // get zone id
                var chosen_language = jQuery('#programming_language_'+zone_id).val(); // get selected language
                var mime = jQuery('#programming_language_'+zone_id+' option:selected').attr('data-mime'); // getting language mime type

                window.wb3.createHighlighter(chosen_language, mime, zone_id);
                window.socket_object.emit('wb3_set_language', {chosen_language: chosen_language, mime: mime, zone_id: zone_id});
            });
        }
    },
    // create file treeviewer
    bindTreeviewer: function() {
        jQuery.ajax({
            url: "ajax",
            data: "todo=get_tree_view_content",
            type: "get",
            beforeSend: function() {
                // loadior here
            },
            success: function(data) {
                var json = JSON.parse(data);
                var li_html = '';
                for (var i = 0; i < json.length; i++) {
                    li_html += '<li><a href="javascript:;" class="edit_file">'+json[i]+'</a> - <a href="javascript:;" class="delete_file" data-file-name="'+json[i]+'">Delete</a></li>';
                }
                jQuery(".file_treeviewer").html(li_html);
                jQuery('.file_treeviewer li a.edit_file, .file_treeviewer li a.delete_file').unbind('click'); // unbind click events to avoid event multiplication
                jQuery('.file_treeviewer li a.edit_file').click(function() {
                    var file_name = jQuery(this).html();
                    window.wb3.createTab(file_name.replace(/\./g, ''), file_name, undefined, file_name);
                });
                jQuery('.file_treeviewer li a.delete_file').click(function() {
                    var file_name = jQuery(this).attr('data-file-name');
                    window.wb3.deleteFile(file_name);
                });
                
            }
        });
    },
    deleteFile: function(file_name) {
        jQuery.ajax({
            url: "ajax",
            data: "todo=delete_file&file_name="+file_name,
            type: "get",
            beforeSend: function() {
                // loadior here
            },
            success: function() {
                window.socket_object.emit('wb3_refresh_treeviewer');
                window.wb3.deleteTab(file_name.replace(/\./g, ''));
                window.wb3.bindTreeviewer();
            }
        });
    },
    bindCodeExecutor: function(zone_id) {
        jQuery('#execute_code_button_'+zone_id).unbind('click'); // unbind click events to avoid event multiplication
        jQuery('#execute_code_button_'+zone_id).click(function() {
            window.wb3.sendFileToExecution(zone_id);
        });
    },
    sendFileToExecution: function(zone_id) {
        var file_name = jQuery('#file_name_'+zone_id).html(); // getting filename (tab name)
        var file_content = this.editors_list[zone_id].getValue();
        var namespace = jQuery('#board_'+this.board_name+'_namespace').val();
        if(!file_name.match(/^[0-9a-zA-Z.\._]+$/)) {
            file_name = window.prompt('Please give a file name and extension. The file should not contain spaces. Ex: index.html OR product.php');
            if(file_name === null) { // cancel pressed
                return false;
            }
            if(!file_name.match(/^[0-9a-zA-Z.\._]+$/)) {
                this.sendFileToExecution(zone_id); // while filename is invalid call itself recursevly
                return false;
            }
        }
        jQuery.ajax({
            url: "ajax",
            data: "todo=save_file_for_execution&file_name="+file_name+'&namespace='+namespace+'&file_content='+file_content,
            type: "post",
            beforeSend: function() {
                // loadior here
            },
            success: function(data) {
                var json = JSON.parse(data);
                if(json.status == 'ok') {
                    window.socket_object.emit('wb3_file_name_change', {zone_id: zone_id, file_name: file_name});
                    window.wb3.renameTab(zone_id, file_name);
                    // refresh iframe
                    jQuery('#code_execution_iframe_'+zone_id).attr('src', '../learn_files/'+json.file_path);
                } else {
                    alert('An error had accured.');
                }
            }
        });
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
    createHighlighter: function(chosen_language, mime, zone_id) {
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
        var included_scripts_cnt = false;

        for (var i = 0; i < javascripts.length; i++) {
            if(existent_scripts.indexOf(javascripts[i]) == -1) { // if script doesn't exist in DOM add it
                included_scripts_cnt++;
                var script = document.createElement("script");
                script.type = "text/javascript";
                script.src = javascripts[i];
                document.getElementsByTagName("head")[0].appendChild(script); // add script to head
                script.onload = function() {
                    loaded_script_counter++;
                    if(loaded_script_counter == included_scripts_cnt) { // if all scripts had been loaded successfully do the binding
                        window.wb3.initHighlighter(zone_id, mime, chosen_language);
                    }
                }
            }
        }
        if(included_scripts_cnt == 0) { // if the scripts are already loaded
            this.initHighlighter(zone_id, mime, chosen_language);
        }
    },
    initHighlighter: function(zone_id, mime, chosen_language) {
        // when switching language keep the content
//        var current_editor_value = '';
//        if(this.editors_list[zone_id] !== undefined) {
//            current_editor_value = this.editors_list[zone_id].getValue();
//            console.log('Current editor value:'+current_editor_value);
//        }
        jQuery('#resizable_'+zone_id+' div[class="CodeMirror cm-s-default"]').remove(); // delete previous codemirror divs before creating new one
        var editor = window.CodeMirror.fromTextArea(document.getElementById("highlighter_textarea_"+zone_id), {
            lineNumbers: true,
            matchBrackets: true,
            mode: mime,
            indentUnit: 4,
            indentWithTabs: true,
            enterMode: "keep",
            tabMode: "shift"
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
                    next: changeObj.next
                };
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
        
//        if(current_editor_value) {
//            console.log('setting editor value:'+current_editor_value);
//            window.wb3.is_changed_from_socket = true;
//            editor.setValue(current_editor_value); // set old content to the new editor
//            window.wb3.is_changed_from_socket = false;
//        }
        
        this.editors_list[zone_id] = editor;
        // manage code execution part
        this.handleCodeExecutionFrame(zone_id, chosen_language);
    },
    applyHighlighterChange: function(data) {
        var zone_id = data.zone_id;
//        console.log(data.change_obj);
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
                    text += "\n";
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
                    if(data.change_obj.text.length > 1) {
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
        
        this.editors_list[zone_id].replaceRange(text, from, to, origin);
        text = '';
        this.is_changed_from_socket = false;
        
    }
}