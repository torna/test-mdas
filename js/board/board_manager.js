window.board_manager = {
    is_refresh: true, // is true by default, when the user is synchronized it will be set to false
    init: function() {
        // binds events
        this.bindEvents();
    },
    bindEvents: function() {
        jQuery('#add_board').click(function(){
            window.board_manager.addBoard(jQuery('#board_types').val());
        });
    },
    // called indicates if this method is called by socket or not
    addBoard: function(board_type, board_name, caller) {
        if(jQuery('#board_'+board_type).length == 0) { // if board of this type does not exist
            if(board_name === undefined) {
                var board_name = jQuery('#board_types option[value='+board_type+']').text();
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
            jQuery('#boards_tabs').append('<div id="tab_'+board_type+'" data-boardtype="'+board_type+'">'+board_name+board_close+'</div>'); // append to tabs
            jQuery('.show_files_button').unbind('click');
            jQuery('.show_files_button').click(function() {
                jQuery('.treeview_frame').toggle();
            })
            if(caller === undefined) {
                window.socket_object.emit('board_create', {board_type:board_type, board_name: board_name});
            }
            window.board_manager.bindBoardEvents(board_type, caller);
        }
    },
    deleteBoard: function(board_type, caller) {
        if(caller === undefined) { // if caller!='socket' send socket
            window.socket_object.emit('wb3_board_delete', {board_type: board_type});
        }
        jQuery('#tab_'+board_type).remove(); // deleting board tab
        jQuery('#board_'+board_type).remove(); // deleting board containter
    },
    // when a new board is added bind events
    bindBoardEvents: function(board_type, caller) {
        // general events
        // tab swither
        jQuery('#boards_tabs div').click(function() {
            var board = jQuery(this).attr('data-boardtype');
            jQuery('.active_learn_tab').removeClass('active_learn_tab'); // remove tab selection
            jQuery(this).addClass('active_learn_tab'); // setting the clicked tab active
            jQuery('.learn_board').hide(); // 
            jQuery('#board_'+board).show();
        });
        if(board_type == 'programming') {
            window.wb3.init();
            if(caller === undefined) { // if caller=='socket' the we do not create the default tab
                // create programming tab
                window.wb3.createTab('1', 'New file');
            }
        }
    }
}