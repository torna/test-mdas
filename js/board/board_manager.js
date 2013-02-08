window.board_manager = {
    is_refresh: true, // is true by default, when the user is synchronized it will be set to false
    is_teacher: 0, // flag
    current_boards: ['draw'], // list of current created boards
    refresh_timeout_obj: {},
    teacher_force_sync: false,
    teacher_force_mouse: false,
    current_users: [], // users that are present in the classroom
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
        
        // user list button
        jQuery('.user_list').unbind('click');
        jQuery('.user_list').click(function() {
            jQuery('#user_list').toggle();
        });
        
        jQuery('#teacher_force_sync').unbind('change');
        jQuery('#teacher_force_sync').change(function() {
            window.board_manager.teacher_force_sync = this.checked;
            if(typeof(Storage) !== "undefined") {
                localStorage.teacher_force_sync = this.checked;
            }
        });
        
        jQuery('#teacher_force_mouse').unbind('change');
        jQuery('#teacher_force_mouse').change(function() {
            window.board_manager.teacher_force_mouse = this.checked;
            if(typeof(Storage) !== "undefined") {
                localStorage.teacher_force_mouse = this.checked;
            }
        });
        
    },
    // when refresh button is clicked
    boardsRedraw: function() {
        // closing all tabs
        window.learn_draw.closeBoard();
        window.wb2.closeBoard();
        window.wb3.closeBoard();
        window.wb4.closeBoard();
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
                window.socket_object.emit('board_create', {
                    board_type:board_type, 
                    board_name: board_name
                });
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
            board_close = '<sup>&nbsp;&nbsp;<a href="javascript:;" onclick="window.board_manager.deleteBoard(\''+board_type+'\')">x</a></sup>';
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
            window.socket_object.emit('wb3_board_delete', {
                board_type: board_type
            });
        }
        jQuery('#tab_'+board_type).remove(); // deleting board tab
        jQuery('#board_'+board_type).remove(); // deleting board containter
        if(jQuery('.active_learn_tab').length == 0) {
            jQuery(jQuery('.board_super_tab')[0]).addClass('active_learn_tab');
        }
        switch(board_type) {
            case 'programming':
                break;
            case 'languages':
                break;
            case 'presentation':
                window.wb4.closeBoard();
                break;
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
                window.socket_object.emit('main_tab_switch', {
                    board_type: board
                });
            }
        });
        
        if(this.is_teacher) {
            if(typeof(Storage) !== "undefined") {
                if(localStorage.teacher_force_sync !== undefined) {
                    if(localStorage.teacher_force_sync == 'true') {
                        document.getElementById('teacher_force_sync').checked = localStorage.teacher_force_sync;
                        window.board_manager.teacher_force_sync = true;
                    } else {
                        window.board_manager.teacher_force_sync = false;
                    }
                }
                if(localStorage.teacher_force_mouse !== undefined) {
                    if(localStorage.teacher_force_mouse == 'true') {
                        document.getElementById('teacher_force_mouse').checked = localStorage.teacher_force_mouse;
                        window.board_manager.teacher_force_mouse = true;
                    } else {
                        window.board_manager.teacher_force_mouse = false;
                    }
                }
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
            if(this.is_teacher) {
                window.wb2_teacher.init();
            }
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
    },
    mouseClick: function(data) {
        jQuery('#mouse_click').show();
        this.mouseClickAnimation(40, data.x, data.y);
    },
    mouseClickAnimation: function(step, x, y) {
        if(step < 1) {
            jQuery('#mouse_click').hide();
            return;
        }
        jQuery('#mouse_click').css({
            'left':(x - (step/2) -3),
            'top':(y - (step/2) - 3),
            'width':(step),
            'height':(step)
        });
        setTimeout(function() {
            window.board_manager.mouseClickAnimation(step/2, x, y);
        }, 15);
    },
    notify: function(message, type) {
        var func;
        if(type == 'info') {
            func = jNotify;
        } else if(type == 'success') {
            func = jSuccess;
        } else if(type == 'error') {
            func = jError;
        }
        func(
            message,
            {
                autoHide : true, // added in v2.0
                clickOverlay : false, // added in v2.0
                MinWidth : 250,
                TimeShown : 3000,
                ShowTimeEffect : 200,
                HideTimeEffect : 200,
                LongTrip :20,
                HorizontalPosition : 'right',
                VerticalPosition : 'top',
                ShowOverlay : false,
                ColorOverlay : '#000',
                OpacityOverlay : 0.3,
                onClosed : function(){ // added in v2.0
		   
                },
                onCompleted : function(){ // added in v2.0
		   
                }
            });
    },
    createUserList: function(data) {
        var html = '';
        var force_refresh = '';
        for (var i = 0; i < data.length; i++) {
            if (jQuery('#user_'+data[i].hash).length) {
                continue;
            }
            this.current_users[data[i].hash] = data[i];
            
            if(this.is_teacher) {
                force_refresh = '<input type="button" class="force_refresh_user" data-user-hash="'+data[i].hash+'" value="Refresh user" />';
            }
            html += '<div id="user_'+data[i].hash+'">'+data[i].f_name+' '+data[i].l_name+' '+force_refresh+'</div>';
        }
        jQuery('.course_users_placeholder').append(html);
        if(this.is_teacher) {
            this.bindStudentRefresher();
        }
    },
    deleteUser: function(hash) {
        jQuery('#user_'+hash).remove();
        delete this.current_users[hash];
    },
    bindStudentRefresher: function() {
        jQuery('.force_refresh_user').unbind('click');
        jQuery('.force_refresh_user').click(function() {
            var user_hash = jQuery(this).attr('data-user-hash');
            window.socket_object.emit('force_refresh_student', { hash: user_hash });
        });
    }
}