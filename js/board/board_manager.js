window.board_manager = {
    is_refresh: true, // is true by default, when the user is synchronized it will be set to false
    is_teacher: 0, // flag
    current_boards: ['draw'], // list of current created boards
    refresh_timeout_obj: {},
    teacher_force_sync: false,
    init: function() {
        // binds events
        this.bindEvents();
        if(this.is_refresh) {
            setTimeout(function(){
                window.board_manager.historyRequest()
            }, 2000);
        }
    },
    historyRequest: function() {
        clearTimeout(window.board_manager.refresh_timeout_obj);
        if(this.is_refresh == false) {
            return;
        }
        console.log('refresh is true resending');
        window.socket_object.emit('refresh_get_content', {});
        this.refresh_timeout_obj = setTimeout(function() {
            window.board_manager.historyRequest();
        }, 3000);
    },
    bindEvents: function() {
        jQuery('#add_board').click(function(){
            window.board_manager.addBoard(jQuery('#board_types').val());
        });
        this.bindTreeviewer();
        jQuery('.show_files_button').unbind('click');
        jQuery('.show_files_button').click(function() {
            jQuery('.treeview_frame').toggle();
        });
        
        // refresh button: deletes all tabs and creates new from db
        jQuery('.refresh_desktop').unbind('click');
        jQuery('.refresh_desktop').click(function() {
            window.board_manager.boardsRedraw();
        });
        
        jQuery('#teacher_force_sync').unbind('click');
        jQuery('#teacher_force_sync').change(function() {
            window.board_manager.teacher_force_sync = this.checked;
            if(typeof(Storage) !== "undefined") {
                localStorage.teacher_force_sync = this.checked;
            }
        });
        
        
    },
    // when refresh button is clicked
    boardsRedraw: function() {
        // closing all tabs
        window.learn_draw.closeBoard();
        window.wb3.closeBoard();
        this.is_refresh = true;
        this.historyRequest();
    },
    // called indicates if this method is called by socket or not
    addBoard: function(board_type, board_name, caller) {
        if(jQuery('#board_'+board_type).length == 0) { // if board of this type does not exist
            if(board_name === undefined) {
                var board_name = jQuery('#board_types option[value='+board_type+']').text();
            }
            
            this.current_boards.push(board_type);
            if(caller === undefined) {
                window.socket_object.emit('board_create', {board_type:board_type, board_name: board_name});
            }
            
            jQuery.ajax({
                url: "ajax",
                data: "todo=get_board&board="+board_type,
                type: "get",
                async: false,
                cache: false,
                beforeSend: function() {
                    jQuery('#add_board').after(' <span id="loading_span">Loading...</span>');
                },
                success: function(data) {
                    jQuery('.learn_board').hide();
                    jQuery('#loading_span').remove(); // remove loader
                    jQuery('#boards').append(data);
                }
            });
            var board_close = '';
//            if(caller === undefined) { // if the board was created via socket, there should be no possibility to delete it (for the student)
                board_close = '<sup>&nbsp;&nbsp;<a href="javascript:;" onclick="window.board_manager.deleteBoard(\''+board_type+'\')">x</a></sup>';
//            }
            jQuery('#boards_tabs').append('<div id="tab_'+board_type+'" class="board_super_tab" data-boardtype="'+board_type+'">'+board_name+board_close+'</div>'); // append to tabs
            window.board_manager.bindBoardEvents(board_type, caller);
            
            jQuery('.active_learn_tab').removeClass('active_learn_tab'); // remove tab selection
            jQuery('#tab_'+board_type).addClass('active_learn_tab'); // setting the clicked tab active
            jQuery('.learn_board').hide(); // 
            jQuery('#board_'+board_type).show();
        }
    },
    deleteBoard: function(board_type, caller) {
        if(caller === undefined) { // if caller!='socket' send socket
            window.socket_object.emit('wb3_board_delete', {board_type: board_type});
        }
        jQuery('#tab_'+board_type).remove(); // deleting board tab
        jQuery('#board_'+board_type).remove(); // deleting board containter
        if(jQuery('.active_learn_tab').length == 0) {
            jQuery(jQuery('.board_super_tab')[0]).addClass('active_learn_tab');
        }
    },
    // when a new board is added bind events
    bindBoardEvents: function(board_type, caller) {
        // general events
        // tab switcher
        jQuery('#boards_tabs div').click(function() {
            var board = jQuery(this).attr('data-boardtype');
            jQuery('.active_learn_tab').removeClass('active_learn_tab'); // remove tab selection
            jQuery(this).addClass('active_learn_tab'); // setting the clicked tab active
            jQuery('.learn_board').hide(); // 
            jQuery('#board_'+board).show();
            if(jQuery(this).attr('id') == 'tab_programming') {
                window.wb3.redrawAllEditors();
            }
            if (window.board_manager.teacher_force_sync && window.board_manager.is_teacher) {
                window.socket_object.emit('main_tab_switch', { board_type: board });
            }
        });
        
        if(typeof(Storage) !== "undefined") {
            if(localStorage.teacher_force_sync !== undefined) {
                document.getElementById('teacher_force_sync').checked = localStorage.teacher_force_sync;
                window.board_manager.teacher_force_sync = localStorage.teacher_force_sync;
            }
        }
        
        if(board_type == 'programming') {
            window.wb3.init();
            if(caller === undefined) { // if caller=='socket' the we do not create the default tab
                // create programming tab
                window.wb3.createTab('1', 'New file');
            }
        }
        if(board_type == 'presentation') {
            window.wb4.init();
        }
        if(board_type == 'languages') {
            window.wb2.init();
        }
    },
    forceSwitchTab: function(data) {
        jQuery('.active_learn_tab').removeClass('active_learn_tab'); // remove tab selection
        jQuery('#tab_'+data.board_type).addClass('active_learn_tab'); // setting the clicked tab active
        jQuery('.learn_board').hide(); // 
        jQuery('#board_'+data.board_type).show();
        if(data.board_type == 'programming') {
            window.wb3.redrawAllEditors();
        }
    },
    // gets content of all boards
    getBoardsFullData: function() {
        var boards_data = new Object();
        for (var i = 0; i < this.current_boards.length; i++) {
            switch(this.current_boards[i]) {
                case 'programming':
                    boards_data.programming = window.wb3.getAllContents();
                    break;
                case 'languages':
//                    boards_data.languages = window.wb3.getAllContents();
                    break;
                case 'draw':
                    boards_data.draw = window.learn_draw.getAllContents();
                    break;
                case 'presentation':
                    boards_data.presentation = window.wb4.getAllContents();
                    break;
            }
        }
        console.log('sending data to FRIENDS');
        return boards_data;
    },
    setBoardsContent: function(data) {
        console.log('Boards loaded from FRIEND');
        jQuery('#loading').show();
        // programming board
        if(data.current_content.hasOwnProperty('programming')) {
            this.addBoard('programming', 'Programming', 'history');
            window.wb3.createBoardFromHistory(data.current_content.programming);
        }
        
        // draw board
        if(data.current_content.hasOwnProperty('draw')) {
            window.learn_draw.createBoardFromHistory(data.current_content.draw);
        }
        
        // presentation board
        if(data.current_content.hasOwnProperty('presentation')) {
            this.addBoard('presentation', 'Presentation', 'history');
            window.wb4.createBoardFromHistory(data.current_content.presentation);
        }
        
        // add more boards here
        this.is_refresh = false;
        jQuery('#loading').hide();
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
                    var parent_tab = jQuery('.active_learn_tab').attr('data-boardtype');
                    if(parent_tab == 'programming') {
                        window.wb3.createTab(file_name.replace(/\./g, ''), file_name, undefined, file_name);
                    } else if(parent_tab == 'draw') {
                        window.learn_draw.createTab(file_name.replace(/\./g, ''), file_name, undefined, file_name);
                    }
                });
                jQuery('.file_treeviewer li a.delete_file').click(function() {
                    var file_name = jQuery(this).attr('data-file-name');
                    window.board_manager.deleteFile(file_name);
                });
                
            }
        });
    },
    deleteFile: function(file_name) {
        window.socket_object.emit('wb3_refresh_treeviewer');
        jQuery.ajax({
            url: "ajax",
            data: "todo=delete_file&file_name="+file_name,
            type: "get",
            beforeSend: function() {
                // loadior here
            },
            success: function() {
                window.wb3.deleteTab(file_name.replace(/\./g, ''));
                window.learn_draw.deleteTab(file_name.replace(/\./g, ''));
                window.board_manager.bindTreeviewer();
            }
        });
    },
    createBoardsFromHistory: function(data) {
        var main_data = '';
        for (var i = 0; i < data.length; i++) {
            main_data = JSON.parse(data[i].main_data);
            this.addBoard(main_data.board_type, main_data.board_name, 'history');
        }
    }
}