window.wb3 = {
    editors_list: [], // list of codemirror objects 
    board_name: 'programming',
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
    bindDeleteTabEvent:function() {
        jQuery('.delete_programming_sheet').unbind('click'); // unbind click from these elements to avoid multiplication of events
        jQuery('.delete_programming_sheet').click(function(){
            var sheet_id = jQuery(this).parent().parent().attr('data-sheet-id');
            jQuery(this).parent().parent().remove(); // delete the tab
            jQuery('#board_item_'+sheet_id).remove();
        /**
             * @TODO
             * emit deletion
             */
        });
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
        });
    },
    createTab: function(unique_id, tab_name) {
        // create tab
        jQuery('#board_items_tabs').append('<div data-sheet-id="'+unique_id+'"><span id="file_name_'+unique_id+'">'+tab_name+'</span> <sup><a href="javascript:;" class="delete_programming_sheet">x</a></sup></div>');
        // create tab content
        jQuery.ajax({
            url: "ajax",
            data: "todo=get_wb3_generic",
            type: "get",
            beforeSend: function() {
            // loadior here
            },
            success: function(data) {
                // setting zone id, i.e board id, so we could know where are we working
                data = data.replace(/%zone_id%/g, unique_id);
                jQuery('.programming_board_subfiles').append('<div id="board_item_'+unique_id+'" class="wb3_board_item">'+data+'</div>');
                jQuery('#resizable_'+unique_id).resizable({
                    resize: function(event, ui) { // resize only x
                        ui.size.height = ui.originalSize.height;
                    }
                });
                jQuery('.wb3_board_item').hide(); // hide all wb3 boards
                jQuery('#board_item_'+unique_id).show(); // showing created board
                window.wb3.bindDeleteTabEvent();
                window.wb3.bindTabSwitcher();
                window.wb3.bindLanguageSwitcher();
            }
        });
        
    /**
         * @TODO
         * emit tab creation
         */
    },
    bindLanguageSwitcher: function() {
        jQuery('.set_language_button').unbind('click'); // unbind click events to avoid event multiplication
        jQuery('.set_language_button').click(function() {
            var zone_id = jQuery(this).attr('data-zone-id'); // get zone id
            var chosen_language = jQuery('#programming_language_'+zone_id).val(); // get selected language
            var mime = jQuery('#programming_language_'+zone_id+' option:selected').attr('data-mime'); // getting language mime type
            window.wb3.createHighlighter(chosen_language, mime, zone_id);
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
            type: "get",
            beforeSend: function() {
                // loadior here
            },
            success: function(data) {
                var json = JSON.parse(data);
                if(json.status == 'ok') {
                    jQuery('#file_name_'+zone_id).html(file_name); // setting tab filename
                    // refresh iframe
                    jQuery('#code_execution_iframe_'+zone_id).attr('src', '../learn_files/'+json.file_path);
                    /**
                     * @TODO
                     * emit file name
                     **/
                } else {
                    alert('An error had accured.');
                }
            }
        });
    },
    // some languages does not have execution part, this function handles all of them
    handleCodeExecutionFrame: function(zone_id) {
        var executed_languages = ['css', 'javascript', 'mysql', 'php', 'html']; // list of languages that are currently available for execution
        var chosen_language = jQuery('#programming_language_'+zone_id).val(); // get selected language
        if(executed_languages.indexOf(chosen_language) != -1) { // the chosen language is in available list
            // bind button events
            jQuery('#result_frame_'+zone_id).show();
            this.bindCodeExecutor(zone_id);
        } else {
            // hidding frame
            jQuery('#result_frame_'+zone_id).hide();
        }
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
                        window.wb3.initHighlighter(zone_id, mime);
                    }
                }
            }
        }
        if(included_scripts_cnt == 0) { // if the scripts are already loaded
            this.initHighlighter(zone_id, mime);
        }
    },
    initHighlighter: function(zone_id, mime) {
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
            console.log(changeObj); // changed object
        });
        editor.on('cursorActivity', function(instance) {
            console.log(instance.getSelection()); // returns selected string
            console.log(instance.getSelection()); // cursor movement
        })
        editor.on('viewportChange', function(instance) {
            console.log('Viewport change'+instance);
        })
        /**
         * @TODO
         * emit editor changes
         */
        this.editors_list[zone_id] = editor;
        // manage code execution part
        this.handleCodeExecutionFrame(zone_id);
    }
}