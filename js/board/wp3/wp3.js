window.wp3 = {
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
            window.wp3.createTab(unique_id, tab_name);
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
        jQuery('#board_items_tabs').append('<div data-sheet-id="'+unique_id+'">'+tab_name+' <sup><a href="javascript:;" class="delete_programming_sheet">x</a></sup></div>');
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
                window.wp3.bindDeleteTabEvent();
                window.wp3.bindTabSwitcher();
                window.wp3.bindLanguageSwitcher();
            }
        });
        
        /**
         * @TODO
         * emit tab creation
         */
    },
    bindLanguageSwitcher: function() {
        jQuery('.set_language_button').unbind('click'); // unbind click events to avoid event multiplication
        jQuery('.set_language_button').click(function(){
            var zone_id = jQuery(this).attr('data-zone-id'); // get zone id
            var chosen_language = jQuery('#programming_language_'+zone_id).val(); // get selected language
            window.wp3.createHighlighter(chosen_language, zone_id);
        });
    },
    createHighlighter: function(chosen_language, zone_id) {
        var javascripts = new Array();
        javascripts.push('../js/highlighter/lib/codemirror.js');
        if(chosen_language != 'clike') {
            javascripts.push('../js/highlighter/mode/'+chosen_language+'/'+chosen_language+'.js');
        }
        javascripts.push('../js/highlighter/mode/clike/clike.js');
        javascripts.push('../js/highlighter/mode/xml/xml.js');
        javascripts.push('../js/highlighter/mode/javascript/javascript.js');
        
        var existent_scripts = new Array();
        for (var i = 0; i < jQuery('script').length; i++) {
            existent_scripts.push(jQuery(jQuery('script')[i]).attr('src'));
        }

        var included_script_counter = 0;

        for (var i = 0; i < javascripts.length; i++) {
            if(existent_scripts.indexOf(javascripts[i]) == -1) { // if script doesn't exist in DOM add it
                var script = document.createElement("script");
                script.type = "text/javascript";
                script.src = javascripts[i];
                document.getElementsByTagName("head")[0].appendChild(script); // add script to head
                script.onload = function() {
                    included_script_counter++;
                    if(included_script_counter == javascripts.length) { // if all scripts had been loaded successfully do the binding
                        var editor = CodeMirror.fromTextArea(document.getElementById("highlighter_textarea_"+zone_id), {
                            lineNumbers: true,
                            matchBrackets: true,
//                            mode: "application/x-httpd-php",
                            indentUnit: 4,
                            indentWithTabs: true,
                            enterMode: "keep",
                            tabMode: "shift"
                        });
                    }
                }
            }
        }
    }
}